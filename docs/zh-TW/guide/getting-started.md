# 開始使用

FileMagic 是一個專為 Laravel 設計的檔案管理套件。

## 系統需求

- PHP 8.3 或以上
- Laravel 12 或 13
- PHP `ext-fileinfo`
- 至少一個已設定完成的 Laravel Filesystem disk

Composer 會在安裝階段檢查 `ext-fileinfo`，因為 FileMagic 必須依實際檔案內容偵測
MIME type，而不會信任檔名或 client 提供的 MIME type。

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

發佈設定檔：

```bash
php artisan vendor:publish --tag=file-magic-config
```

發佈並執行 migration：

```bash
php artisan vendor:publish --tag=file-magic-migrations
php artisan migrate
```

Laravel 會自動發現 `Mattmy\FileMagic\FileMagicServiceProvider` 與 `FileMagic` Facade。

如果專案停用了 package discovery，可以在 `bootstrap/providers.php` 手動註冊 Service Provider：

```php
use Mattmy\FileMagic\FileMagicServiceProvider;

return [
    FileMagicServiceProvider::class,
];
```


## 設定

發佈後的 `config/file-magic.php` 內容如下：

```php
<?php

declare(strict_types=1);

return [
    'disk' => \env('FILE_MAGIC_DISK', \env('FILESYSTEM_DISK', 'local')),
    'directory' => \env('FILE_MAGIC_DIRECTORY', 'files'),
    'visibility' => \env('FILE_MAGIC_VISIBILITY', 'private'),
    'max_size' => 100 * 1024 * 1024,
    'allowed_mime_types' => [],
    'blocked_mime_types' => [
        'application/x-httpd-php',
        'application/x-php',
    ],
    'collision' => 'unique',
    'checksum_algorithm' => 'sha256',
    'temporary_url_ttl' => 5,
    'model' => Mattmy\FileMagic\Models\StoredFile::class,
    'table' => 'stored_files',
    'image' => [
        'quality' => 80,
        'max_width' => 1920,
    ],
    'zip' => [
        'max_files' => 100,
        'max_size' => 1024 * 1024 * 1024,
    ],
    'remote' => [
        'connect_timeout' => 5,
        'timeout' => 30,
        'max_redirects' => 3,
        'allowed_hosts' => [],
        'allowed_ports' => [80, 443],
    ],
];
```

| 設定 | 用途 |
| --- | --- |
| `disk` | 預設的 Filesystem disk |
| `directory` | 預設的相對儲存目錄 |
| `visibility` | `private` 或 `public` |
| `max_size` | 偵測後允許的最大檔案大小，單位為 bytes |
| `allowed_mime_types` | MIME type 白名單；空陣列代表允許所有未被封鎖的類型 |
| `blocked_mime_types` | 預設一律拒絕的 MIME type |
| `collision` | 檔名碰撞策略：`unique`、`error` 或 `overwrite` |
| `checksum_algorithm` | PHP hash 演算法；無效值會回退為 `sha256` |
| `temporary_url_ttl` | temporary URL 預設有效分鐘數 |
| `model` | 必須繼承 `StoredFile` 的 Model class |
| `table` | 儲存檔案紀錄的資料表 |
| `image.quality` | 圖片處理的預設品質 |
| `image.max_width` | 圖片處理的預設最大寬度 |
| `zip.max_files` | 單次 ZIP 下載允許的最大檔案數 |
| `zip.max_size` | 單次 ZIP 下載允許的未壓縮來源總 bytes |
| `remote.connect_timeout` | 預設連線逾時秒數 |
| `remote.timeout` | 預設完整下載逾時秒數 |
| `remote.max_redirects` | 預設 redirect 上限，範圍為 `0` 至 `10` |
| `remote.allowed_hosts` | 精確 public host allowlist；空陣列允許通過 SSRF 檢查的 public host |
| `remote.allowed_ports` | 不可為空的 port allowlist；預設為 HTTP 與 HTTPS 標準 port |

可以透過環境變數覆寫常用設定：

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```


## 核心操作流程

FileMagic 的操作分成三個階段：

1. 使用 `fromUpload()`、`fromPath()`、`fromUrl()`、`fromContent()`、`fromBase64()`、`text()`、`json()` 或 `csv()` 建立 `PendingFile`。
2. 使用 `onDisk()`、`inDirectory()`、`named()`、`visibility()` 等方法設定儲存方式。
3. 呼叫 `store()` 儲存實體檔案及資料庫紀錄。

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('contract')
    ->store();
```

只有來源方法與最後的 `store()` 是必要步驟，中間的設定方法皆為選用。

| 目的 | 方法 |
| --- | --- |
| 建立待儲存檔案 | `fromUpload()`、`fromPath()`、`fromUrl()`、`fromContent()`、`fromBase64()` |
| 產生文件 | `text()`、`json()`、`csv()` |
| 設定儲存位置 | `onDisk()`、`inDirectory()` |
| 設定檔名 | `named()` |
| 完成儲存 | `store()` |
| 查詢與操作已儲存檔案 | `find()` |
| 將多個檔案下載為 ZIP | `find()->downloadZip()` |


