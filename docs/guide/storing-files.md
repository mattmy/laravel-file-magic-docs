# Storing files

## Store an uploaded file

Validate the HTTP boundary first:

```php
use Illuminate\Http\Request;
use Mattmy\FileMagic\Facades\FileMagic;

public function store(Request $request)
{
    $validated = $request->validate([
        'document' => ['required', 'file', 'max:10240'],
    ]);

    $file = FileMagic::fromUpload($validated['document'])->store();

    return response()->json($file);
}
```

FileMagic inspects the content again. Request validation and package inspection protect different boundaries.


## Store from other sources

Readable local path:

```php
$file = FileMagic::fromPath(storage_path('imports/report.pdf'))
    ->inDirectory('reports')
    ->store();
```

Only pass paths chosen by trusted application code.

String or binary content:

```php
$file = FileMagic::fromContent(
    contents: $pdfContents,
    originalFilename: 'invoice.pdf',
    mimeType: 'application/pdf',
)->inDirectory('invoices')->store();
```

The MIME argument is only a source hint. Stored MIME and extension come from content inspection.

Plain Base64:

```php
$file = FileMagic::fromBase64(
    base64: \base64_encode($contents),
    originalFilename: 'document.pdf',
)->store();
```

The Data URI prefix is optional. When omitted, FileMagic detects the MIME type from the decoded content instead of relying on caller-provided metadata.

Data URI:

```php
$file = FileMagic::fromBase64(
    base64: 'data:text/plain;base64,'.\base64_encode('Hello'),
    originalFilename: 'hello.txt',
)->store();
```

Decoding is strict. Invalid or non-canonical input throws `InvalidBase64`. Base64 consumes more memory than its decoded file, so prefer uploads or paths for large objects.


## Customize storage

```php
use Mattmy\FileMagic\Enums\CollisionPolicy;
use Mattmy\FileMagic\Enums\FileVisibility;

$file = FileMagic::fromUpload($uploadedFile)
    ->onDisk('s3')
    ->inDirectory('accounts/42/contracts')
    ->named('signed-contract')
    ->visibility(FileVisibility::Private)
    ->onCollision(CollisionPolicy::Unique)
    ->store();
```

`named()` takes a name without extension. Directories must be relative; absolute paths, drive paths, null bytes, `.` and `..` are rejected.

Collision policies:

- `Unique` adds a random suffix when the path exists.
- `Error` throws `FileWriteFailed`.
- `Overwrite` intentionally replaces the physical path and updates its existing database record.

`Overwrite` first streams the complete existing object into a seekable temporary file on
the PHP server's local disk. If the new storage write or database update fails, FileMagic
restores the original content and visibility before reporting the failure. The temporary
backup is closed and deleted after the operation.

This safety has a cost: the server needs local temporary space approximately equal to the
existing file size, and the operation performs additional storage reads and local disk I/O.
`Overwrite` is therefore slower than normal storage. Prefer the default `Unique` policy
unless the application specifically needs to preserve the same storage path.


## Size and MIME restrictions

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->maxSize(10 * 1024 * 1024)
    ->allowMimeTypes([
        'application/pdf',
        'image/jpeg',
        'image/png',
    ])
    ->blockMimeTypes([
        'image/svg+xml',
        'text/html',
    ])
    ->store();
```

Per-operation values override their corresponding global configuration. FileMagic uses `finfo`, not the browser-provided MIME header.


## Metadata and ownership

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->withMetadata([
        'category' => 'invoice',
        'year' => 2026,
    ])
    ->ownedBy($user)
    ->store();
```

Metadata must be JSON-serializable and must not contain secrets. Any persisted Eloquent model can be an owner.

Add the inverse relation:

```php
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Mattmy\FileMagic\Models\StoredFile;

public function files(): MorphMany
{
    return $this->morphMany(StoredFile::class, 'owner');
}
```

Eager-load the relation from the owning model, then pass an already loaded file
model into FileMagic:

```php
$post = Post::query()
    ->with('files')
    ->findOrFail($postId);

$attachment = $post->files->firstOrFail();

return FileMagic::find($attachment)->download();
```

Passing an existing `StoredFile` model does not execute another database query.

The `owner_id` column is a string, so integer, UUID, and ULID owner keys are supported.


