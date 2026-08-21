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

All three forms preserve input order and remove duplicate records. A model target is a selector:
FileMagic runs one scoped query for every non-empty `find()` call and returns the current canonical
record instead of reusing the supplied instance. Empty arrays and Collections return an empty
`Illuminate\Support\Collection` without a query.

Arrays and Collections must be one-dimensional. Every element must be a positive integer ID, valid UUID, or persisted `StoredFile`; invalid elements throw `InvalidFileTarget` instead of being silently removed.

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

`urls()` returns an `Illuminate\Support\Collection<int|string, string>` keyed by model key. Files that do not exist on disk are omitted.

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
            break;
        }

        // Consume the chunk.
    }
} finally {
    \fclose($stream);
}
```

The caller owns and must close the returned stream.


## Download

```php
return FileMagic::find($target)->download();
return FileMagic::find($target)->download('invoice-2026.pdf');
```

Laravel streams the response using the detected MIME type.


