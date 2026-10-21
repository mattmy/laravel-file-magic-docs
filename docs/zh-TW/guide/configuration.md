# 設定參考

發佈並執行 migration 後，FileMagic 可以直接使用預設設定。只有應用程式需要調整
storage、驗證、URL、圖片、ZIP 或遠端下載預設值時，才需發佈設定檔：

```bash
php artisan vendor:publish --tag=file-magic-config
```

## 設定選項

| 設定 | 預設值 | 用途 |
| --- | --- | --- |
| `disk` | `FILE_MAGIC_DISK` → `FILESYSTEM_DISK` → `local` | 未呼叫 `onDisk()` 時使用的 Filesystem disk。 |
| `directory` | `files` | 未呼叫 `inDirectory()` 時使用的相對目錄。 |
| `visibility` | `private` | 未呼叫 `visibility()` 時使用 `private` 或 `public`。 |
| `max_size` | `104857600` | 原始來源與圖片處理後輸出的大小上限，單位為 bytes。 |
| `allowed_mime_types` | `[]` | 允許的 MIME types；空陣列允許所有未被下列設定封鎖的類型。 |
| `blocked_mime_types` | PHP MIME types | 拒絕的 MIME types；可用 `blockMimeTypes()` 覆寫單一檔案的設定。 |
| `collision` | `unique` | 目標路徑存在時使用 `unique`、`error` 或 `overwrite`。 |
| `collision_lock.enabled` | `false` | 啟用儲存、批次刪除與稽核清理的 cooperative atomic lock。 |
| `collision_lock.store` | `null` | Collision lock 使用的 cache store；`null` 使用 Laravel 預設 store。 |
| `collision_lock.lease_seconds` | `300` | Lock lease 的正整數秒數。 |
| `collision_lock.wait_seconds` | `10` | 等待競爭中 lock 的正整數秒數上限。 |
| `checksum_algorithm` | `sha256` | 計算 checksum 的受支援 PHP hash 演算法。 |
| `temporary_url_ttl` | `5` | Temporary URL 的預設有效分鐘數。 |
| `model` | 套件 `StoredFile` | Eloquent Model class；自訂 class 必須繼承套件 Model 並使用設定的資料表。 |
| `table` | `stored_files` | Model 與已發佈 migration 使用的資料表；自訂 Model 必須設定相同的 `$table`。 |
| `image.quality` | `80` | `resizeImage()` 未指定品質時使用的輸出品質。 |
| `image.max_width` | `1920` | `resizeImage()` 未指定寬度時使用的最大寬度。 |
| `zip.max_files` | `100` | 單次 ZIP 下載的紀錄數量上限。 |
| `zip.max_size` | `1073741824` | 單次 ZIP 下載的未壓縮來源總 bytes 上限。 |
| `remote.connect_timeout` | `5` | `fromUrl()` 的連線逾時秒數。 |
| `remote.timeout` | `30` | 每次 HTTP 請求的逾時秒數，不含整條重新導向鏈的總時間。 |
| `remote.max_redirects` | `3` | Redirect 上限，範圍為 `0` 至 `10`。 |
| `remote.allowed_hosts` | `[]` | 精確 public host allowlist；空陣列允許通過 SSRF 檢查的 public hosts。 |
| `remote.allowed_ports` | `[80, 443]` | 遠端下載允許使用的非空 destination port 清單。 |

預設封鎖 `application/x-httpd-php` 與 `application/x-php`。封鎖清單優先於允許清單；
省略 `blocked_mime_types` 會保留預設封鎖，明確設為 `[]` 才會取消。
`allowMimeTypes()` 與 `blockMimeTypes()` 都會取代對應的全域清單，不會合併。

設定值採嚴格型別，並在使用對應功能時驗證。FileMagic 不會轉換字串整數、移除錯誤的
清單成員，或在設定值無效時回退至預設值。無效值會拋出 `InvalidConfiguration`，並指出
受影響的 key。未使用的 optional 圖片、ZIP、遠端下載與 temporary URL 設定不會阻擋
其他操作。

升級前請確認數值設定使用 PHP integer 而非數字字串、清單使用連續整數 keys 並包含正確
型別、enum-backed 設定完全符合表列值，而且每個指定 disk 都存在於
`filesystems.disks`。

已執行發佈的 migration 後再修改 `table`，不會重新命名既有資料。已部署的應用程式應
建立新的 migration。更換 `model` 或 `table` 時，另請參考
[Model 與例外](/zh-TW/guide/models-and-exceptions)。

## 啟用檔案路徑鎖定

路徑鎖定預設停用。這時不需要支援鎖定的快取儲存區，但同時儲存或刪除同一路徑仍可能
互相衝突。將 `collision_lock.enabled` 設為 `true` 即可啟用。

啟用後，儲存、批次刪除與稽核清理會共用同一套 disk／路徑鎖。批次操作先按固定順序
取得所有鎖，再重新確認資料庫紀錄。請使用支援 Laravel atomic lock 的快取儲存區，
例如 Redis、Memcached、DynamoDB、database、file 或 array。不支援鎖定或不存在的
儲存區會被拒絕；停用時不會解析或驗證 `store`、`lease_seconds` 與 `wait_seconds`。

所有可能修改相同 storage 路徑的應用程式行程，都必須使用同一個共享快取後端。
Array store 只適合單一行程測試；file store 要跨伺服器協調時，必須確實共用同一個檔案系統。
`lease_seconds` 應長於最壞情況下取得所有鎖、storage 讀寫、狀態確認、資料庫修改及失敗還原
所需的總時間。

儲存等待逾時會拋出 `FileWriteFailed`；批次刪除回報 `PartialFileDeletion`；稽核清理則以
exit code `2` 結束。無效鎖定設定會拋出 `InvalidConfiguration`，
也可能在稽核指令建立時就使它無法執行。

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

`FILE_MAGIC_DISK` 未設定時會使用 Laravel 的 `FILESYSTEM_DISK`，再未設定則使用 `local`。其他選項可在發佈後的
`config/file-magic.php` 修改。
