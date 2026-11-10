# 開始使用

FileMagic 讓 Laravel 應用程式能用同一套流程接收、儲存、查詢、下載與刪除檔案。
儲存成功後會取得一筆 `StoredFile` 紀錄，之後可透過 `FileMagic::find()` 讀取或操作檔案。

## 系統需求

| 需求 | 支援版本 |
| --- | --- |
| PHP | 8.3–8.x |
| Laravel | 12 或 13 |
| PHP extension | `ext-fileinfo` |

CI 會在 PHP 8.3、8.4、8.5 分別測試 Laravel 12 與 13。應用程式還需要設定好
Laravel Filesystem 磁碟與資料庫連線。

- 透過 `fromUrl()` 匯入遠端檔案需要 `ext-curl`。
- 下載 ZIP 需要 `ext-zip`。
- 圖片縮放需要 Intervention Image 4 和 GD 或 Imagick。


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

如果需要圖片縮放功能，請另外安裝 Intervention Image 4，並啟用 PHP GD 或 Imagick：

```bash
composer require intervention/image:^4.0
```

## 設定

發佈並執行 migration 後，FileMagic 可以直接使用預設設定。預設會在
`FILE_MAGIC_DISK` 指定的 disk 下，以 `files` 為目錄、`private` 為可見性，
限制檔案大小為 100 MiB，檔名重複時會加入隨機字串。未設定 `FILE_MAGIC_DISK` 時，
依序使用 `FILESYSTEM_DISK` 或 `local`。

只有需要調整預設值時才需發佈設定檔：

```bash
php artisan vendor:publish --tag=file-magic-config
```

所有選項與環境變數請參考[設定參考](/zh-TW/guide/configuration)。

## 快速開始

以下是 `routes/web.php` 的範例。它會驗證上傳檔案，並回傳 ID、UUID 與偵測到的 MIME 類型。
開放這條路由前，請先加入應用程式的身分驗證與上傳權限檢查。

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

想調整這次的儲存方式，可以在[呼叫 `store()` 前設定選項](/zh-TW/guide/storing-files)。

## 下一步

- [儲存上傳、本機、字串與 Base64 檔案](/zh-TW/guide/storing-files)
- [安全匯入遠端 HTTP(S) 檔案](/zh-TW/guide/remote-files)
- [查詢、讀取與下載已儲存檔案](/zh-TW/guide/querying-files)
- [查閱 API 與欄位](/zh-TW/guide/reference)

