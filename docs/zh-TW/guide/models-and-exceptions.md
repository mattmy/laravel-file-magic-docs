# Model 與例外

## 自訂 Model

建立繼承套件 Model 的應用程式 Model：

```php
namespace App\Models;

use Mattmy\FileMagic\Models\StoredFile as BaseStoredFile;

final class StoredFile extends BaseStoredFile
{
    protected $table = 'assets';

    // 加入應用程式專用的 relationship 或 scope。
}
```

更新設定：

```php
'model' => App\Models\StoredFile::class,
'table' => 'assets',
```

自訂 Model 必須繼承套件 `StoredFile`，且 `$table` 必須與 `file-magic.table` 相同。
儲存、查詢、批次刪除與稽核都會使用這個 Model 的連線、資料表與主鍵。

`find()` 會套用全域範圍。批次刪除只重查已選取的主鍵，並略過全域範圍與關聯預先載入。
批次刪除會略過逐筆的 `deleting` 與 `deleted` 事件。稽核也略過全域範圍。詳見[一致性稽核](/zh-TW/guide/maintenance)。

若需要逐筆事件，可明確取得 Model 後呼叫 `$file->delete()`；但這個入口沒有共用路徑鎖，
也不提供實體檔案刪除後、資料庫刪除失敗時的補償。需要協調一致性時，請使用
`FileMagic::find(...)->delete()`。


## 自訂資料表

請在執行 migration 前設定表名。要重新命名既有資料表時，請新增 migration。

## 例外

所有套件例外都繼承 `Mattmy\FileMagic\Exceptions\FileMagicException`。
部分讀取、URL 與儲存操作也可能拋出儲存驅動程式的例外。

| 例外 | 原因 |
| --- | --- |
| `InvalidConfiguration` | 無效套件設定或對應的單次操作選項 |
| `InvalidFileSource` | 無效的上傳檔案、本機路徑或串流 |
| `InvalidBase64` | 無效 Base64 或 Data URI |
| `InvalidDocumentData` | 無效 UTF-8、JSON 資料或 CSV rows |
| `InvalidRemoteOptions` | 無效 timeout、redirect、host 或 port 設定 |
| `InvalidRemoteUrl` | 格式錯誤或不支援的遠端 URL |
| `RemoteAccessDenied` | Scheme、host、port、DNS、IP 或 network policy 拒絕網址 |
| `RemoteDownloadUnavailable` | `fromUrl()` 所需的 PHP `ext-curl` 未啟用 |
| `RemoteDownloadFailed` | DNS、TLS、連線、redirect、HTTP 或暫存下載失敗 |
| `InvalidFileName` | 不安全或系統保留的檔名 |
| `InvalidStoragePath` | 傳給 `inDirectory()` 的目錄無效 |
| `InvalidFileOwner` | Owner 尚未儲存，或主鍵不是整數或非空字串 |
| `InvalidFileTarget` | 無效 Model、巢狀目標容器或不支援的目標型別 |
| `InvalidStoredFileModel` | 設定的 Model 未繼承套件 `StoredFile`，或資料表與設定不符 |
| `FileTooLarge` | 檔案超過 byte 限制 |
| `DisallowedMimeType` | MIME 類型不在允許範圍內 |
| `FileWriteFailed` | 寫入、備份、檔名碰撞或取得路徑鎖失敗 |
| `FileRecordFailed` | 紀錄儲存被事件取消、儲存／重查／刪除失敗，或刪除筆數不符 |
| `FileRecoveryFailed` | 操作失敗後，舊檔案還原或新檔案清理也失敗 |
| `PartialFileDeletion` | 批次刪除有未完成項目，可能一筆也未刪除 |
| `FileNotFound` | 找不到符合的檔案紀錄，或實體檔案內容或 stream 不存在 |
| `ImageProcessingUnavailable` | 處理支援格式時缺少圖片套件或驅動程式 |
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
