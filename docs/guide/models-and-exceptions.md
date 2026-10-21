# Models and exceptions

## Custom model and table

```php
namespace App\Models;

use Mattmy\FileMagic\Models\StoredFile as BaseStoredFile;

final class StoredFile extends BaseStoredFile
{
    protected $table = 'assets';
}
```

```php
'model' => App\Models\StoredFile::class,
'table' => 'assets',
```

The custom model must extend the package `StoredFile` and set `$table` to match `file-magic.table`.
Storage, lookup, batch deletion, and audits use its connection, table, and primary key.

`find()` applies global scopes. Batch deletion reloads and deletes only the resolved primary keys
using unscoped queries; it does not expand the selection or dispatch individual `deleting` or
`deleted` events. Audits bypass global scopes; see [Consistency audits](/guide/maintenance).

If you need individual model events, explicitly retrieve the model and call `$file->delete()`.
That path does not use shared path locks or compensate if the physical deletion succeeds but
the database deletion fails. Use `FileMagic::find(...)->delete()` for coordinated deletion.

Configure a custom table before publishing the migration. If already deployed, create a new
migration rather than editing migration history.

## 0.x upgrade note

If your application calls `StoredFile::temporaryUrl()` directly, pass a `DateTimeInterface`
expiration now. `FileMagic::find($target)->temporaryUrl()` keeps the configured default
lifetime. A custom model must now declare the same `$table` as `file-magic.table`.

## Exceptions

All exceptions extend `FileMagicException`.

| Exception | Meaning |
| --- | --- |
| `InvalidConfiguration` | Invalid package configuration or matching operation option |
| `InvalidFileSource` | Invalid upload, path, or stream |
| `InvalidBase64` | Invalid Base64 or Data URI |
| `InvalidDocumentData` | Invalid UTF-8, JSON data, or CSV rows |
| `InvalidRemoteOptions` | Invalid timeout, redirect, host, or port option |
| `InvalidRemoteUrl` | Malformed or unsupported remote URL |
| `RemoteAccessDenied` | Scheme, host, port, DNS, IP, or network policy rejected the URL |
| `RemoteDownloadUnavailable` | PHP `ext-curl` is unavailable for `fromUrl()` |
| `RemoteDownloadFailed` | DNS, TLS, connection, redirect, HTTP, or temporary download failure |
| `InvalidFileName` | Unsafe or reserved name |
| `InvalidStoragePath` | Unsafe directory |
| `InvalidFileOwner` | Owner is not persisted or has no integer or non-empty string key |
| `InvalidFileTarget` | Invalid ID, UUID, model, array, or Collection target |
| `InvalidStoredFileModel` | Configured model does not extend the package `StoredFile` or uses a different table |
| `FileTooLarge` | Byte limit exceeded |
| `DisallowedMimeType` | MIME type rejected |
| `FileWriteFailed` | Write, backup, collision, or path-lock acquisition failure |
| `FileRecordFailed` | Record save cancelled by an event, persistence or revalidation failure, or deleted-count mismatch |
| `FileRecoveryFailed` | An operation failed and restoring the old object or removing the new object also failed |
| `PartialFileDeletion` | A batch deletion has unresolved items, possibly with zero deletions |
| `FileNotFound` | No record matched, or physical content or stream is unavailable |
| `ImageProcessingUnavailable` | Missing image dependency or driver while processing a supported image |
| `ZipCreationUnavailable` | PHP `ext-zip` is unavailable |
| `ZipCreationFailed` | Temporary ZIP creation or finalization failed |
| `ZipLimitExceeded` | ZIP file-count or uncompressed-size limit exceeded |

Handle errors in the application layer:

```php
use Mattmy\FileMagic\Exceptions\FileMagicException;

try {
    $file = FileMagic::fromUpload($uploadedFile)->store();
} catch (FileMagicException $exception) {
    report($exception);

    return back()->withErrors(['file' => 'The file could not be stored.']);
}
```

The package does not choose HTTP status codes or response formats. This table lists FileMagic
domain exceptions. Some read, URL, and storage operations can still throw underlying adapter
exceptions; catching `FileMagicException` does not catch every runtime failure.


