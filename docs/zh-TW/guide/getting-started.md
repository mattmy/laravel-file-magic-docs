# 開始使用

FileMagic 讓 Laravel 應用程式能用同一套流程接收、儲存、查詢、下載與刪除檔案。
儲存上傳檔案後，會得到一筆可透過 Eloquent 查詢的檔案紀錄。

## 系統需求

| 需求 | 支援版本 |
| --- | --- |
| PHP | 8.3–8.x |
| Laravel | 12 或 13 |
| PHP extension | `ext-fileinfo` |

以上版本來自套件的 Composer constraints。CI 會在 PHP 8.3、8.4、8.5 分別測試
Laravel 12 與 13。應用程式還需要至少一個設定完成的 Laravel Filesystem disk，以及
Laravel 支援的 database。

FileMagic 使用 `ext-fileinfo` 取得儲存檔案的類型。Client 回報的檔名與 MIME type
不能用來證明檔案的實際類型。

透過 `fromUrl()` 匯入遠端 HTTP(S) 檔案時，另外需要 PHP `ext-curl`。缺少時其他功能
仍可使用，但儲存遠端來源會拋出 `RemoteDownloadUnavailable`。可使用
`php --ri curl` 確認 CLI 使用的 PHP 是否已啟用此 extension。

圖片縮放功能另外需要：

- `intervention/image` 4.0 或以上
- PHP GD 或 Imagick extension

ZIP 批次下載另外需要 PHP `ext-zip`。


## 安裝

透過 Composer 安裝套件：

```bash
composer require mattmy/laravel-file-magic
```

發佈並執行 migration：

```bash
php artisan vendor:publish --tag=file-magic-migrations
php artisan migrate
```

## 設定

發佈並執行 migration 後，FileMagic 可以直接使用預設設定。預設會在
`FILESYSTEM_DISK` 的 `files` 目錄儲存 private 檔案、限制檔案大小為 100 MiB，並在
檔名碰撞時加入不重複的 suffix。

只有需要調整預設值時才需發佈設定檔：

```bash
php artisan vendor:publish --tag=file-magic-config
```

所有選項與環境變數請參考[設定參考](/zh-TW/guide/configuration)。

## 快速開始

將以下 route 加入 `routes/web.php`。它會先驗證上傳的文件，再使用預設設定儲存，最後
以 JSON 回傳新紀錄的 ID、UUID 與偵測到的 MIME type。

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Mattmy\FileMagic\Facades\FileMagic;

Route::post('/documents', function (Request $request): array {
    $input = $request->validate([
        'document' => ['required', 'file'],
    ]);

    $file = FileMagic::fromUpload($input['document'])->store();

    return [
        'id' => $file->id,
        'uuid' => $file->uuid,
        'mime_type' => $file->mime_type,
    ];
});
```

只有來源方法與 `store()` 是必要呼叫。中間可以視單一檔案的需求覆寫 storage、檔名、
驗證、owner 與圖片選項。

## 下一步

- [儲存上傳、本機、字串與 Base64 檔案](/zh-TW/guide/storing-files)
- [安全匯入遠端 HTTP(S) 檔案](/zh-TW/guide/remote-files)
- [查詢、讀取與下載已儲存檔案](/zh-TW/guide/querying-files)
- [查找所有應用程式 API 與欄位](/zh-TW/guide/reference)

