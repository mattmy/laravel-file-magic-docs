# Querying files

## Query files

Pass a positive integer ID, a decimal ID string such as `'123'`, a UUID, or a saved `StoredFile` model to `find()`.

```php
$file = FileMagic::find($id)->one();
$file = FileMagic::find($uuid)->one();
$file = FileMagic::find($fileModel)->one();
```

You may operate on the first resolved file without extracting the model:

```php
FileMagic::find($uuid)->contents();
FileMagic::find($fileModel)->download();
FileMagic::find($id)->delete();
```

Batch lookups accept variadic targets, an array, or a Laravel Collection:

```php
$variadic = FileMagic::find(
    $firstId,
    $secondUuid,
    $fileModel,
)->get();

$array = FileMagic::find([
    $firstId,
    $secondUuid,
    $fileModel,
])->get();

$collection = FileMagic::find(collect([
    $firstId,
    $secondUuid,
    $fileModel,
]))->get();
```

`FileQuery` resolves targets on first use and reuses the results. It runs at most one query for the
file records, applies the configured model's global scopes, keeps input order, and removes duplicates.
Eloquent can run additional queries for eager-loaded relationships. A supplied model contributes
only its primary key. If no valid targets remain, FileMagic skips the query.

`find()` skips `null`, booleans, floats, non-positive integers, and strings that match neither a UUID
nor a positive decimal ID. This applies to individual arguments and values in arrays or Collections.
Decimal IDs use ASCII digits, allow leading zeros, and must fit in a PHP integer. UUIDs are case-insensitive.

Nested arrays or Collections, unsupported types, and invalid models throw `InvalidFileTarget`. A model
target must be saved and match the configured file model, connection, table, and primary-key name.
Its primary key must match the saved value.

Valid IDs and UUIDs without a matching record are omitted. `one()` therefore returns
the first resolved `StoredFile` or `null`, while operations that require a file,
such as `download()` and `contents()`, throw `FileNotFound` when nothing resolves.
`get()` returns an `Illuminate\Support\Collection<int, StoredFile>`, so you can use normal
Laravel Collection methods such as `map()`, `filter()`, and `pluck()`.


## URLs

```php
$publicUrl = FileMagic::find($target)->url();
$temporaryUrl = FileMagic::find($target)->temporaryUrl();
$customExpiration = FileMagic::find($target)
    ->temporaryUrl(now()->addMinutes(30));
```

`StoredFile::temporaryUrl()` requires an explicit expiration. Use this query API when the
configured `temporary_url_ttl` should supply it.

Retrieve public URLs for multiple targets:

```php
$urls = FileMagic::find([
    $firstUuid,
    $secondUuid,
])->urls();
```

`urls()` returns an `Illuminate\Support\Collection<int|string, string>` keyed by model key.
Files that do not exist on disk are omitted. This performs one storage existence check per resolved record, which can add requests and latency on remote disks.

The disk must support the requested operation. Local temporary URLs require `serve => true`; cloud disks require their normal credentials.


## Read and stream

```php
$file = FileMagic::find($target);

if ($file->exists()) {
    $smallContents = $file->contents();
}
```

Use streams for large files:

```php
$stream = FileMagic::find($target)->readStream();

try {
    while (\feof($stream) === false) {
        $chunk = \fread($stream, 8192);

        if ($chunk === false || ($chunk === '' && \feof($stream) === false)) {
            throw new \RuntimeException('The file stream could not be read.');
        }

        // Consume the chunk.
    }
} finally {
    \fclose($stream);
}
```

The caller owns and must close the returned stream. `exists()` throws `FileNotFound` when no
database record matches; it returns `false` only when a matched record's physical file is missing.


## Download

```php
$response = FileMagic::find($target)->download();
$renamedResponse = FileMagic::find($target)->download('invoice-2026.pdf');
```

`download()` uses the cleaned original filename when available and the stored filename as a fallback.
Laravel streams the file with the MIME type saved on the record. Passing a name changes only the filename
shown in the download.


