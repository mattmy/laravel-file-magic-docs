# 設定參考

要調整預設值，請先發布 `config/file-magic.php`。

```bash
php artisan vendor:publish --tag=file-magic-config
```

## 設定選項

| 設定 | 預設值 | 用途 |
| --- | --- | --- |
| `disk` | `FILE_MAGIC_DISK` → `FILESYSTEM_DISK` → `local` | 未呼叫 `onDisk()` 時使用的 Laravel 儲存磁碟。 |
| `directory` | `files` | 未呼叫 `inDirectory()` 時使用的相對目錄。 |
| `visibility` | `private` | 未呼叫 `visibility()` 時使用 `private` 或 `public`。 |
| `max_size` | `104857600` | 原始檔案與圖片處理後的大小上限，以位元組計算。 |
| `allowed_mime_types` | `[]` | MIME 類型允許清單。空陣列不額外限制。 |
| `blocked_mime_types` | PHP 的 MIME 類型 | MIME 類型封鎖清單。單次儲存可用 `blockMimeTypes()` 覆寫。 |
| `collision` | `unique` | 目標路徑存在時使用 `unique`、`error` 或 `overwrite`。 |
| `collision_lock.enabled` | `false` | 啟用儲存、批次刪除與稽核清理的 cooperative atomic lock。 |
| `collision_lock.store` | `null` | 路徑鎖使用的快取儲存區。`null` 使用 Laravel 預設值。 |
| `collision_lock.lease_seconds` | `300` | 鎖的有效秒數，須為正整數。 |
| `collision_lock.wait_seconds` | `10` | 每把鎖最多等待的秒數，須為正整數。 |
| `checksum_algorithm` | `sha256` | 計算檔案校驗值的 PHP 雜湊演算法。 |
| `temporary_url_ttl` | `5` | 暫時網址的預設有效分鐘數。 |
| `model` | 套件 `StoredFile` | 自訂 Eloquent Model 必須繼承 `StoredFile` 並使用設定的資料表。 |
| `table` | `stored_files` | Model 與 migration 使用的資料表。自訂 Model 的 `$table` 必須相符。 |
| `image.quality` | `80` | `resizeImage()` 未指定品質時使用的輸出品質。 |
| `image.max_width` | `1920` | `resizeImage()` 未指定寬度時使用的最大寬度。 |
| `zip.max_files` | `100` | 單次 ZIP 下載的紀錄數量上限。 |
| `zip.max_size` | `1073741824` | 單次 ZIP 下載的未壓縮總大小上限，單位為位元組。 |
| `remote.connect_timeout` | `5` | `fromUrl()` 的連線逾時秒數。 |
| `remote.timeout` | `30` | 每次 HTTP 請求的逾時秒數。重新導向會重新計時。 |
| `remote.max_redirects` | `3` | 重新導向次數上限，範圍為 `0` 至 `10`。 |
| `remote.allowed_hosts` | `[]` | 依完整主機名稱比對的允許清單。空陣列允許通過 SSRF 檢查的公開主機。 |
| `remote.allowed_ports` | `[80, 443]` | 允許的目的地連接埠，清單不可為空。 |

預設封鎖 `application/x-httpd-php` 與 `application/x-php`。封鎖清單優先於允許清單；
省略 `blocked_mime_types` 會保留預設封鎖，明確設為 `[]` 才會取消。
`allowMimeTypes()` 與 `blockMimeTypes()` 都會取代對應的全域清單，不會合併。

數值請用 PHP 整數，清單索引從 `0` 開始且須連續。請在 `filesystems.disks` 設定磁碟名稱。
FileMagic 會在使用功能時驗證大部分設定。全域 `directory` 無效時拋出 `InvalidConfiguration`。
傳給 `inDirectory()` 的路徑無效時則拋出 `InvalidStoragePath`。

部署後若要重新命名資料表，請新增 migration，並將 `table` 改成新的表名。更換 `model` 或 `table` 時，另請參考
[Model 與例外](/zh-TW/guide/models-and-exceptions)。

## 啟用檔案路徑鎖定

要協調同一路徑上的寫入與刪除，請將 `collision_lock.enabled` 設為 `true`。路徑鎖定預設關閉。

啟用後，儲存、批次刪除與稽核清理會共用同一套 disk／路徑鎖。批次操作先按固定順序
取得所有鎖，再重新確認資料庫紀錄。請使用支援 Laravel atomic lock 的快取儲存區，
例如 Redis、Memcached、DynamoDB、database、file 或 array。不支援鎖定或不存在的
儲存區會被拒絕；停用時不會解析或驗證 `store`、`lease_seconds` 與 `wait_seconds`。

需要協調同一路徑的行程必須共用快取後端。`array` 快取只適合單一行程測試。跨伺服器使用 `file`
快取時，伺服器必須共用檔案系統。`lease_seconds` 應涵蓋取得所有鎖、儲存讀寫、資料庫修改及還原的時間。

等待鎖逾時時，儲存會拋出 `FileWriteFailed`，批次刪除會拋出 `PartialFileDeletion`，稽核清理則以
結束代碼 `2` 結束。啟用鎖定後，FileMagic 會在初始化鎖定服務時驗證設定。設定無效時會拋出
`InvalidConfiguration`，純查詢或唯讀稽核也可能因此無法啟動。

每個不同路徑都需要取得一把鎖。N 個路徑的最長等待時間可能接近
`N × collision_lock.wait_seconds`；鎖的有效期限不會自動延長。詳細限制請看
[效能與安全](/zh-TW/guide/performance-and-security)。

## 環境變數

套件提供的設定檔會讀取以下環境變數：

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```

其他選項可在發布後的 `config/file-magic.php` 修改。
