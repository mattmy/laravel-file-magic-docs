# Querying files

## Query files

All normal file lookups go through the single `find()` entry point. It accepts a positive integer ID, UUID, or existing `StoredFile` model:

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

All three forms preserve input order and remove duplicate records. A model target only identifies
the record. The query runs when you first request a result or operation, not when you call `find()`.
For non-empty targets, it fetches current records in one query using the configured model's global
scopes. It does not reuse the supplied model's attributes or relations. Each `FileQuery` caches its
results, so later operations on that instance do not repeat the lookup. Empty arrays and Collections
return an empty `Illuminate\Support\Collection` without a query.

Arrays and Collections must be one-dimensional. Every element must be a positive integer ID, valid UUID, or persisted `StoredFile`; invalid elements throw `InvalidFileTarget` instead of being silently removed.

UUIDs are case-insensitive. Numeric strings such as `"123"` are not integer IDs; convert and
validate request values before passing them. A model target must match the configured file model,
connection, table, and primary-key name, and its primary key must not be dirty.

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

        if ($chunk === false) {
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
return FileMagic::find($target)->download();
return FileMagic::find($target)->download('invoice-2026.pdf');
```

Laravel streams the response using the record's MIME type: detected from ordinary content, or
declared by a trusted generated source. Changing the download name does not convert the content.


