# Storing files

## Store an uploaded file

Pass a Laravel `UploadedFile` to `fromUpload()`.

```php
$file = FileMagic::fromUpload($uploadedFile)->store();
```

`store()` checks the file size and detects the MIME type from its contents.


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

Use `fromGeneratedContent()` when your app generates the content and can guarantee its format.

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

Both content methods receive the full `$contents` string in PHP memory. For large files, use an upload,
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

`named()` sets the base name. FileMagic keeps dots in the name and appends an extension based on the
file's MIME type. For example, `FileMagic::text('Hello')->named('report.txt')->store()` saves
`report.txt.txt` if that name is available.

Use `/` to separate directory segments. An empty string selects the disk root. FileMagic rejects
leading, trailing, or repeated separators, backslashes, whitespace around segments, control or
Windows-unsafe characters, `.` and `..`, and reserved Windows names.
Filenames follow the same character and reserved-name rules and cannot start or end with a dot.

Collision policies:

- `Unique` adds a random suffix when the path exists.
- `Error` throws `FileWriteFailed`.
- `Overwrite` intentionally replaces the physical path and updates its existing database record.

When overwriting a record, omit `ownedBy()` and `withMetadata()` to keep their existing values.
An explicit `ownedBy($model)` replaces the owner, and `withMetadata($metadata)` replaces all metadata.
Pass `withMetadata([])` to clear it.

`Overwrite` backs up the old file and its visibility before writing. If the write or record save
fails, FileMagic tries to restore the backup. If recovery also fails, it throws `FileRecoveryFailed`.
Readers can still access the path while FileMagic writes to it. Allow extra local temporary space
roughly equal to the size of the old file. Use `Unique` when the path can change.

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

These options replace the corresponding defaults for this file. `maxSize()` applies to both the
original input and the processed image. FileMagic detects the MIME type of ordinary sources with
`finfo`. Built-in documents and `fromGeneratedContent()` with a recognized MIME type use the
declared type. The blocklist wins when a type appears in both lists. An empty allowlist permits
any type the blocklist allows.


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

Load the files with the owner, then pass an attachment to `find()`.

```php
$post = Post::query()
    ->with('files')
    ->findOrFail($postId);

$attachment = $post->files->firstOrFail();

return FileMagic::find($attachment)->download();
```

`find()` uses the supplied model's primary key to query the current record with its global scopes.
It performs this lookup even when the attachment was eager loaded. Use your configured file model
class in the inverse relationship.

The `owner_id` column is a string, so integer, UUID, and ULID owner keys are supported.


