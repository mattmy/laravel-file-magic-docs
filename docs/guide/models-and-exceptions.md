# Models and exceptions

## Custom model and table

```php
namespace App\Models;

use Mattmy\FileMagic\Models\StoredFile as BaseStoredFile;

final class StoredFile extends BaseStoredFile {}
```

```php
'model' => App\Models\StoredFile::class,
'table' => 'assets',
```

The custom model must extend the package model. FileMagic uses it consistently for storage,
lookup, and deletion, including its connection, table, and primary key. Batch record deletion
uses an unscoped bulk query because FileMagic has already resolved explicit keys. It therefore
bypasses global scopes and does not dispatch per-model Eloquent `deleting` or `deleted` events.

Configure a custom table before publishing the migration. If already deployed, create a new
migration rather than editing migration history.


## Exceptions

All exceptions extend `FileMagicException`.

| Exception | Meaning |
| --- | --- |
| `InvalidFileSource` | Invalid upload, path, or stream |
| `InvalidBase64` | Invalid Base64 or Data URI |
| `InvalidDocumentData` | Invalid UTF-8, JSON data, or CSV rows |
| `InvalidRemoteOptions` | Invalid timeout, redirect, host, or port option |
| `InvalidRemoteUrl` | Malformed or unsupported remote URL |
| `RemoteAccessDenied` | Scheme, host, port, DNS, IP, or network policy rejected the URL |
| `RemoteDownloadFailed` | DNS, TLS, connection, redirect, HTTP, or temporary download failure |
| `InvalidFileName` | Unsafe or reserved name |
| `InvalidStoragePath` | Unsafe directory |
| `InvalidFileTarget` | Invalid ID, UUID, model, array, or Collection target |
| `InvalidStoredFileModel` | Configured model does not extend the package `StoredFile` |
| `FileTooLarge` | Byte limit exceeded |
| `DisallowedMimeType` | MIME type rejected |
| `FileWriteFailed` | Storage or collision failure |
| `FileRecordFailed` | Database persistence failure |
| `FileRecoveryFailed` | An overwrite failed and the original object could not be restored |
| `PartialFileDeletion` | Only confirmed missing objects and their records were deleted |
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

The package deliberately does not choose HTTP status codes or response formats.


