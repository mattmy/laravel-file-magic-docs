# Storing files

## Store an uploaded file

Pass a Laravel `UploadedFile` to `fromUpload()`.

```php
$file = FileMagic::fromUpload($uploadedFile)->store();
```

When you call `store()`, FileMagic applies its own size limit and detects the MIME type from the contents.


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

Application-generated content whose format is guaranteed by the application can use a trusted MIME
type:

```php
$file = FileMagic::fromGeneratedContent(
    contents: $dxfContents,
    originalFilename: 'drawing.dxf',
    mimeType: 'image/vnd.dxf',
)->named('drawing')->store();
```

FileMagic trusts the supplied MIME type only when Symfony can map it to an extension. For example,
`image/vnd.dxf` maps to `.dxf`. Omit the MIME type or pass an unmapped value such as `application/dxf`
to use the same content inspection as `fromContent()`. An unmapped value remains a source hint.

An extension mapping cannot verify the format or safety of the contents. Use
`fromContent($request->getContent())` for a raw HTTP request body. Never pass the body and its
`Content-Type` header to `fromGeneratedContent()`.
Both content methods hold the full `$contents` string in PHP memory. For large files, use an upload,
a local path, or a remote URL as appropriate.

Plain Base64:

```php
$file = FileMagic::fromBase64(
    base64: \base64_encode($contents),
    originalFilename: 'document.pdf',
)->store();
```

Pass plain Base64 or use `data:<mime>;base64,<payload>`. A Data URI with a missing MIME type or
parameters such as `charset` throws `InvalidBase64`. FileMagic detects the stored MIME type and
extension from the decoded content.

Data URI:

```php
$file = FileMagic::fromBase64(
    base64: 'data:text/plain;base64,'.\base64_encode('Hello'),
    originalFilename: 'hello.txt',
)->store();
```

Use the alphabet and padding produced by `base64_encode()`. `fromBase64()` throws `InvalidBase64`
for URL-safe Base64, missing padding, spaces, or line breaks. At `store()`, FileMagic checks the
decoded size before decoding and throws `FileTooLarge` if it exceeds the limit. Decoding uses a
temporary file in chunks. The encoded string stays in PHP memory, so prefer uploads or paths for
large inputs.


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

`named()` takes a name without extension. Directories use canonical forward-slash-separated
relative paths; an empty directory means the disk root. Leading or trailing separators,
backslashes, repeated separators, whitespace around segments, control or Windows-unsafe
characters, `.` and `..`, and reserved Windows names are rejected rather than normalized.
Filenames follow the same character and reserved-name rules and cannot start or end with a dot.

Collision policies:

- `Unique` adds a random suffix when the path exists.
- `Error` throws `FileWriteFailed`.
- `Overwrite` intentionally replaces the physical path and updates its existing database record.

`Overwrite` backs up the existing bytes and visibility before writing. If writing or saving the
record fails, FileMagic attempts to restore that backup. This is not an atomic replacement, so
other readers can observe the path while it is being written. The backup needs local temporary
space close to the old file size, in addition to the new source snapshot. Prefer the default
`Unique` policy unless the storage path must stay the same. If both replacement and recovery fail, `FileRecoveryFailed` is thrown.

Path locking is off by default. Set `collision_lock.enabled` to `true` to lock each candidate path
from the existence check through writing, saving the record, and any recovery. If the wait exceeds
`collision_lock.wait_seconds`, FileMagic throws `FileWriteFailed` before touching the path. See
[Configuration](/guide/configuration#optional-collision-lock-deployment) for how stores, batch
deletion, and audit cleanup share locks.


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

Per-operation values override their corresponding global configuration. `maxSize()` applies to
both the original input and the final image output. FileMagic uses `finfo`, not the
browser-provided MIME header, for ordinary sources. Built-in documents and recognized
`fromGeneratedContent()` MIME types use their declared trusted MIME instead. The blocklist wins
when a type appears in both lists; an empty allowlist adds no restriction.


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

Metadata must be JSON-serializable and must not contain secrets. An owner must already be
persisted and have an integer or non-empty string key. Otherwise, `ownedBy()` immediately throws
`InvalidFileOwner` before any file I/O.

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

Passing an existing `StoredFile` model to `find()` performs one scoped query to obtain the current
canonical record. Eager loading fetches the attachments together but does not remove this
lookup. The supplied model only identifies the record; its other attributes and loaded
relations are not reused. If you configured a custom file model, use that class in the inverse relation.

The `owner_id` column is a string, so integer, UUID, and ULID owner keys are supported.


