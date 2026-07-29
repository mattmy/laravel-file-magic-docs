# Model 與例外

## 自訂 Model

建立繼承套件 Model 的應用程式 Model：

```php
namespace App\Models;

use Mattmy\FileMagic\Models\StoredFile as BaseStoredFile;

final class StoredFile extends BaseStoredFile
{
    // 加入應用程式專用的 relationship 或 scope。
}
```

更新設定：

```php
'model' => App\Models\StoredFile::class,
```

自訂 Model 必須繼承套件提供的 `StoredFile`。FileMagic 會在儲存、查詢與刪除流程
一致使用自訂 Model，包括它的 connection、table 與 primary key。由於套件已經解析
出明確 keys，批次刪除紀錄會使用不套用 global scope 的 bulk query，因此不會觸發
逐筆 Eloquent `deleting` 或 `deleted` events。


## 自訂資料表

發佈及執行 migration 前修改：

```php
'table' => 'assets',
```

如果 migration 已經部署到正式環境，應建立新的 migration 重新命名資料表，不要修改已經部署的 migration。


## 例外

所有套件例外都繼承 `Mattmy\FileMagic\Exceptions\FileMagicException`。

| 例外 | 原因 |
| --- | --- |
| `InvalidFileSource` | 無效 upload、路徑或 stream |
| `InvalidBase64` | 無效 Base64 或 Data URI |
| `InvalidDocumentData` | 無效 UTF-8、JSON 資料或 CSV rows |
| `InvalidRemoteOptions` | 無效 timeout、redirect、host 或 port 設定 |
| `InvalidRemoteUrl` | 格式錯誤或不支援的遠端 URL |
| `RemoteAccessDenied` | Scheme、host、port、DNS、IP 或 network policy 拒絕網址 |
| `RemoteDownloadUnavailable` | `fromUrl()` 所需的 PHP `ext-curl` 未啟用 |
| `RemoteDownloadFailed` | DNS、TLS、連線、redirect、HTTP 或暫存下載失敗 |
| `InvalidFileName` | 不安全或系統保留的檔名 |
| `InvalidStoragePath` | 不安全的相對目錄 |
| `InvalidFileTarget` | 無效 ID、UUID、Model、array 或 Collection target |
| `InvalidStoredFileModel` | 設定的 Model 未繼承套件 `StoredFile` |
| `FileTooLarge` | 檔案超過 byte 限制 |
| `DisallowedMimeType` | MIME type 不被允許 |
| `FileWriteFailed` | storage 寫入、檔名碰撞或刪除失敗 |
| `FileRecordFailed` | database 紀錄儲存失敗 |
| `FileRecoveryFailed` | Overwrite 失敗，且無法還原原始 object |
| `PartialFileDeletion` | 只有已確認不存在的 objects 與其紀錄完成刪除 |
| `FileNotFound` | 找不到符合的檔案紀錄，或實體檔案內容或 stream 不存在 |
| `ImageProcessingUnavailable` | 處理受支援圖片時缺少圖片 dependency 或 driver |
| `ZipCreationUnavailable` | PHP `ext-zip` 不可用 |
| `ZipCreationFailed` | 暫存 ZIP 建立或結束寫入失敗 |
| `ZipLimitExceeded` | ZIP 檔案數量或未壓縮大小超過限制 |

在應用程式層處理例外：

```php
use Mattmy\FileMagic\Exceptions\FileMagicException;

try {
    $file = FileMagic::fromUpload($uploadedFile)->store();
} catch (FileMagicException $exception) {
    report($exception);

    return back()->withErrors([
        'file' => '檔案無法儲存。',
    ]);
}
```

套件不會自行決定 HTTP status code 或 response 格式。


