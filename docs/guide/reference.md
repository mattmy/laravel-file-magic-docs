# Reference

## Testing

```php
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mattmy\FileMagic\Facades\FileMagic;

Storage::fake('documents');

$file = FileMagic::fromUpload(
    UploadedFile::fake()->createWithContent('notes.txt', 'hello'),
)->onDisk('documents')->store();

Storage::disk('documents')->assertExists($file->path);

expect($file->contents())->toBe('hello');
```

Use `RefreshDatabase` for database assertions and load the published migration.


## Performance

- Uploads and paths are inspected and stored with streams.
- Checksums are calculated in chunks.
- `contents()` loads everything into memory; prefer `readStream()` for large files.
- Base64 necessarily uses additional memory.
- Image decoding may consume far more memory than the compressed file size.
- `Overwrite` creates a full local temporary backup of the existing object and performs additional I/O; prefer `Unique` when a fixed path is unnecessary.
- ZIP downloads use local temporary disk space up to the uncompressed source size plus the archive size.
- URL imports perform one synchronous streaming GET and use local temporary disk up to the downloaded size.
- Set URL connection and total timeouts for the reliability needs of the calling workflow.
- Use `find()` for batch lookup and call `FileQuery::delete()` for batch deletion.


## Security

- Authorize every store, read, download, and delete operation.
- Keep Laravel request validation in front of the package.
- Treat original names and client MIME values as untrusted metadata.
- Prefer MIME allowlists for sensitive workflows.
- Consider blocking HTML and SVG when serving from the same origin.
- Keep private files on private disks and use short-lived temporary URLs.
- Never pass a user-controlled server path to `fromPath()`.
- Ensure the PHP system temporary directory has appropriate permissions and capacity before enabling `Overwrite` for sensitive or large files.
- Authorize every file in a ZIP download before passing its targets to FileMagic.
- Configure web-server request limits in addition to `max_size`.
- Add antivirus scanning when required by the threat model.
- URL imports verify TLS by default and reject HTTP unless explicitly enabled.
- URL imports block SSRF targets and revalidate every redirect; keep an outbound firewall as defense in depth.
- Keep downloaded HTML and other active content private and serve untrusted files as attachments with `nosniff`.


## API reference

### `FileMagic`

```php
fromUpload(UploadedFile $file): PendingFile
fromPath(string $path): PendingFile
fromUrl(string $url, ?RemoteFileOptions $options = null): PendingFile
fromContent(string $contents, ?string $originalFilename = null, ?string $mimeType = null): PendingFile
fromBase64(string $base64, ?string $originalFilename = null): PendingFile
text(string $text): PendingFile
json(array|\JsonSerializable $data): PendingFile
csv(iterable $rows): PendingFile
find(int|string|StoredFile|array|Collection ...$targets): FileQuery
```

### `PendingFile`

```php
onDisk(string $disk): self
inDirectory(string $directory): self
named(string|int $filename): self
visibility(FileVisibility $visibility): self
onCollision(CollisionPolicy $policy): self
maxSize(int $bytes): self
allowMimeTypes(array $mimeTypes): self
blockMimeTypes(array $mimeTypes): self
withMetadata(array $metadata): self
ownedBy(Model $owner): self
resizeImage(?int $maxWidth = null, ?int $quality = null): self
store(): StoredFile
```

### `FileQuery`

```php
one(): ?StoredFile
get(): Collection
urls(): Collection
exists(): bool
url(): string
temporaryUrl(?DateTimeInterface $expiration = null): string
contents(): string
readStream(): resource
download(?string $name = null): StreamedResponse
downloadZip(?string $name = null): BinaryFileResponse
delete(): int
```

`get()` returns `Illuminate\Support\Collection<int, StoredFile>`. Use Laravel Collection methods such as `map()`, `filter()`, `groupBy()`, `pluck()`, and `values()` for in-memory transformations. Keep filesystem-aware batch operations on `FileQuery` by calling `urls()` or `delete()` before discarding the query object.


## Troubleshooting

### MIME differs from the browser value

This is expected. FileMagic trusts content detected with `finfo`.

### A file gets a `.bin` extension

Symfony Mime has no extension for the detected type. Inspect `mime_type` and decide whether the workflow should allow it.

### Temporary local URLs fail

Enable `serve => true` on the local disk or use a driver supporting temporary URLs.

### Image processing is unavailable

Install `intervention/image`, enable GD or Imagick, and use JPEG, PNG, WebP, or BMP.

### A physical object was removed externally

`existsOnDisk()` returns `false`; `contents()` and `readStream()` throw `FileNotFound`.

### A published migration filename contains a timestamp

The service provider adds a timestamp when publishing the migration so Laravel executes it in the expected order. Publish it once per application and commit the generated migration.

### ZIP downloads are unavailable

Install and enable PHP `ext-zip`. Also ensure the PHP process can write to the system
temporary directory and that it has enough free space for the source files and archive.

### A normal website URL is rejected

Web pages are detected as HTML and rejected by default. Use
`new RemoteFileOptions(allowHtml: true)` only when storing HTML is intentional.
FileMagic stores allowed HTML as HTML; it never silently converts it to TXT.

### A development HTTPS URL fails certificate verification

Fix the certificate whenever possible. For a controlled environment only, pass
`RemoteFileOptions::withoutTlsVerification()`. This weakens TLS authenticity but
does not enable HTTP, private networks, arbitrary ports, or unsafe redirects.


## License

FileMagic is open-source software licensed under the [MIT License](https://github.com/mattmy/file-magic/blob/main/LICENSE).


## Project maintenance

- Read [CONTRIBUTING.md](https://github.com/mattmy/file-magic/blob/main/CONTRIBUTING.md) before submitting a pull request.
- Report vulnerabilities privately according to [SECURITY.md](https://github.com/mattmy/file-magic/blob/main/SECURITY.md).
- Releases follow [Semantic Versioning](https://semver.org/) and are documented
  in [CHANGELOG.md](https://github.com/mattmy/file-magic/blob/main/CHANGELOG.md).

