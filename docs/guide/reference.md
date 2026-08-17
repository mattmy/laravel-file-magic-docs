# API reference

This page lists the methods and fields used by Laravel applications. Each section links to
the guide with full examples and behavior.

## Create a pending file

```php
FileMagic::fromUpload(UploadedFile $file): PendingFile
FileMagic::fromPath(string $path): PendingFile
FileMagic::fromContent(string $contents, ?string $originalFilename = null, ?string $mimeType = null): PendingFile
FileMagic::fromBase64(string $base64, ?string $originalFilename = null): PendingFile
FileMagic::fromUrl(string $url, ?RemoteFileOptions $options = null): PendingFile
FileMagic::text(string $text): PendingFile
FileMagic::json(array|JsonSerializable $data): PendingFile
FileMagic::csv(iterable $rows): PendingFile
```

- `fromUpload()` accepts a Laravel uploaded file.
- `fromPath()` accepts a readable local path chosen by the application.
- `fromContent()` accepts text or binary content. `$originalFilename` and `$mimeType` are
  optional source details; the stored type is determined from the content.
- `fromBase64()` accepts Base64 text or a Base64 Data URI.
- `fromUrl()` downloads an HTTP(S) file. `$options` changes the rules for this download.
- `text()`, `json()`, and `csv()` create content that can be stored like any other file.

All methods return `PendingFile`. See [Storing files](/guide/storing-files),
[Remote files](/guide/remote-files), and [Documents and images](/guide/documents-and-images).

## Configure and store a pending file

```php
$pending->onDisk(string $disk): self
$pending->inDirectory(string $directory): self
$pending->named(string|int $filename): self
$pending->visibility(FileVisibility $visibility): self
$pending->onCollision(CollisionPolicy $policy): self
$pending->maxSize(int $bytes): self
$pending->allowMimeTypes(array $mimeTypes): self
$pending->blockMimeTypes(array $mimeTypes): self
$pending->withMetadata(array $metadata): self
$pending->ownedBy(Model $owner): self
$pending->resizeImage(?int $maxWidth = null, ?int $quality = null): self
$pending->store(): StoredFile
```

- `onDisk()` selects a configured Laravel Filesystem disk and rejects an empty name.
- `inDirectory()` selects a canonical forward-slash relative directory; an empty string selects
  the disk root. Unsafe or ambiguous paths throw `InvalidStoragePath`.
- `named()` selects a filename without its extension. Unsafe, reserved, empty, or names longer
  than 200 characters throw `InvalidFileName`.
- `visibility()` selects `FileVisibility::Private` or `FileVisibility::Public`.
- `onCollision()` selects `Unique`, `Error`, or `Overwrite` when the path already exists.
- `maxSize()` sets a positive maximum byte count for both the original and stored result.
- `allowMimeTypes()` accepts only the supplied list of non-empty MIME type strings.
- `blockMimeTypes()` rejects the supplied non-empty strings in a list; the list itself may be empty.
- `withMetadata()` saves application data in the file record's `metadata` field.
- `ownedBy()` associates the file with a saved Eloquent model.
- `resizeImage()` sets the maximum width and output quality for supported images. A `null`
  parameter uses its configured default; width must be positive and quality must be `1` to `100`.
- `store()` saves the physical file and returns its `StoredFile` record.

The following methods return the choices currently set on a `PendingFile`. A value is `null`
when that option has not been set and the package default will be used by `store()`.

```php
$pending->source(): FileSource
$pending->disk(): ?string
$pending->directory(): ?string
$pending->filename(): ?string
$pending->fileVisibility(): ?FileVisibility
$pending->collisionPolicy(): ?CollisionPolicy
$pending->maximumSize(): ?int
$pending->allowedMimeTypes(): ?array
$pending->blockedMimeTypes(): ?array
$pending->metadata(): array
$pending->owner(): ?Model
$pending->imageOptions(): ?ImageOptions
```

`ImageOptions` contains public `maxWidth` and `quality` integer fields.

## Find files

```php
FileMagic::find(int|string|StoredFile|array|Collection ...$targets): FileQuery
```

`$targets` accepts IDs, UUIDs, existing `StoredFile` models, one-dimensional arrays, and
Laravel Collections. Multiple target arguments may be mixed. See
[Querying files](/guide/querying-files).

```php
$query->one(): ?StoredFile
$query->get(): Collection
$query->urls(): Collection
$query->exists(): bool
$query->url(): string
$query->temporaryUrl(?DateTimeInterface $expiration = null): string
$query->contents(): string
$query->readStream(): resource
$query->download(?string $name = null): StreamedResponse
$query->downloadZip(?string $name = null): BinaryFileResponse
$query->delete(): int
```

- `one()` returns the first matching file record or `null`.
- `get()` returns all matching records as `Collection<int, StoredFile>`.
- `urls()` returns public URLs keyed by model key and omits files missing from storage.
- `exists()` checks whether the first matching physical file exists.
- `url()` returns the first matching file's public URL.
- `temporaryUrl()` returns a temporary URL. A `null` expiration uses the configured lifetime.
- `contents()` returns the complete contents of the first matching file as a string.
- `readStream()` returns a readable stream for the first matching file; close it after use.
- `download()` returns a streamed download. `$name` replaces the download filename.
- `downloadZip()` returns all matching files as a ZIP download. `$name` sets the ZIP filename.
- `delete()` deletes matching physical files and records, then returns the deleted count.

Except for `one()` and `get()`, operations that need a first match throw `FileNotFound` when
no record matches.

## StoredFile fields

`StoredFile` is the Eloquent record returned after storage or lookup.

| Field | Type | Data |
| --- | --- | --- |
| `id` | `int` | Database key. |
| `uuid` | `string` | Public unique identifier. |
| `disk` | `string` | Laravel Filesystem disk. |
| `path` | `string` | Full path relative to the disk. |
| `location_hash` | `string` | Identifier for the disk and path combination. |
| `filename` | `string` | Stored filename without extension. |
| `original_filename` | `?string` | Original filename when available. |
| `extension` | `string` | Stored extension. |
| `mime_type` | `string` | MIME type determined for the file. |
| `size` | `int` | File size in bytes. |
| `checksum` | `?string` | File checksum when available. |
| `visibility` | `FileVisibility` | Public or private storage visibility. |
| `owner_type`, `owner_id` | `?string` | Polymorphic owner identifiers. |
| `metadata` | `?array` | Application metadata saved with the file. |
| `created_at`, `updated_at` | `?Carbon` | Record timestamps. |
| `owner` | `?Model` | Associated Eloquent model. |

## StoredFile methods

```php
$file->owner(): MorphTo
$file->storage(): FilesystemAdapter
$file->existsOnDisk(): bool
$file->fullName(): string
$file->originalName(): string
$file->url(): string
$file->temporaryUrl(?DateTimeInterface $expiration = null): string
$file->contents(): string
$file->readStream(): resource
$file->download(?string $name = null): StreamedResponse
$file->delete(): ?bool
```

- `owner()` provides the Eloquent owner relationship.
- `storage()` returns the Laravel Filesystem adapter for `disk`.
- `existsOnDisk()` checks whether `path` exists on the disk.
- `fullName()` returns `filename` and `extension` together.
- `originalName()` returns `original_filename`, or `fullName()` when unavailable.
- URL, content, stream, download, and delete methods operate on this record's physical file.

## RemoteFileOptions

`RemoteFileOptions` changes one `fromUrl()` download. Its public fields are:

| Field | Type | Default | Use |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | Require a valid HTTPS certificate. |
| `allowHttp` | `bool` | `false` | Allow unencrypted HTTP. |
| `allowHtml` | `bool` | `false` | Allow HTML and XHTML content. |
| `connectTimeoutSeconds` | `int` | `5` | Maximum connection time. |
| `timeoutSeconds` | `int` | `30` | Maximum total download time. |
| `maxRedirects` | `int` | `3` | Maximum redirects, from `0` to `10`. |
| `allowedHosts` | `list<string>` | `[]` | Exact host allowlist; empty allows eligible public hosts. |
| `allowedPorts` | `list<int>` | `[80, 443]` | Allowed destination ports. |
| `allowedPrivateHosts` | `list<string>` | `[]` | Exact private hosts explicitly allowed. |

```php
RemoteFileOptions::withoutTlsVerification(): RemoteFileOptions
```

Use this helper only for controlled environments where certificate verification cannot be
used. It does not enable HTTP or allow private hosts. See [Remote files](/guide/remote-files).

## Enums

```php
FileVisibility::Private
FileVisibility::Public

CollisionPolicy::Unique
CollisionPolicy::Error
CollisionPolicy::Overwrite
```

`Unique` changes the filename when the target exists. `Error` rejects the collision.
`Overwrite` replaces the file while keeping the same storage path.

## Exception result methods

All package exceptions extend `FileMagicException`. See
[Models and exceptions](/guide/models-and-exceptions) for the complete list.

```php
$exception->deletedCount(): int
$exception->failedCount(): int
$exception->failedKeys(): array
```

These `PartialFileDeletion` methods return the completed count, failed count, and model keys
that still need attention.

```php
$exception->operationFailure(): Throwable
```

`FileRecoveryFailed::operationFailure()` returns the error that caused overwrite recovery to
start. The exception's previous error contains the recovery failure.
