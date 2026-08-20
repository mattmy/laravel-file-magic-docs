# 設定參考

發佈並執行 migration 後，FileMagic 可以直接使用預設設定。只有應用程式需要調整
storage、驗證、URL、圖片、ZIP 或遠端下載預設值時，才需發佈設定檔：

```bash
php artisan vendor:publish --tag=file-magic-config
```

## 設定選項

| 設定 | 預設值 | 用途 |
| --- | --- | --- |
| `disk` | `FILESYSTEM_DISK` 或 `local` | 未呼叫 `onDisk()` 時使用的 Filesystem disk。 |
| `directory` | `files` | 未呼叫 `inDirectory()` 時使用的相對目錄。 |
| `visibility` | `private` | 未呼叫 `visibility()` 時使用 `private` 或 `public`。 |
| `max_size` | `104857600` | 偵測後允許的最大檔案 bytes。 |
| `allowed_mime_types` | `[]` | 允許的 MIME types；空陣列允許所有未被下列設定封鎖的類型。 |
| `blocked_mime_types` | PHP MIME types | 拒絕的 MIME types；可用 `blockMimeTypes()` 覆寫單一檔案的設定。 |
| `collision` | `unique` | 目標路徑存在時使用 `unique`、`error` 或 `overwrite`。 |
| `collision_lock.enabled` | `false` | 啟用 store operation 的 cooperative atomic lock。 |
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
| `remote.timeout` | `30` | `fromUrl()` 的完整下載逾時秒數。 |
| `remote.max_redirects` | `3` | Redirect 上限，範圍為 `0` 至 `10`。 |
| `remote.allowed_hosts` | `[]` | 精確 public host allowlist；空陣列允許通過 SSRF 檢查的 public hosts。 |
| `remote.allowed_ports` | `[80, 443]` | 遠端下載允許使用的非空 destination port 清單。 |

預設封鎖的 MIME types 是 `application/x-httpd-php` 與 `application/x-php`。

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

## Optional collision lock 部署

Collision lock 預設停用，因此一般 store operation 不要求 cache store 支援 lock。停用模式保留
既有行為，但不保護 concurrent writers 的 TOCTOU 競爭。將 `collision_lock.enabled` 設為 `true`
才會啟用。

啟用後，每次儲存都會先鎖定 canonical disk 與候選 path，再檢查目標是否存在。請使用支援
atomic lock 的 Laravel cache store：Redis、Memcached、DynamoDB、database、file 或 array。
找不到或不支援 lock 的 store 會被拒絕。停用時不會解析或驗證 `store`、`lease_seconds` 與
`wait_seconds`。

所有已啟用 lock 且可能寫入相同 storage path 的應用程式 processes 必須使用同一個共享 cache
backend。Array store 只適合單一 process 測試；file store 只有在多台伺服器確實共享
同一 filesystem 時才能跨機協調。`lease_seconds` 應長於最壞情況下 backup、write、
database 與 recovery 的總時間。等待逾時會拋出 `FileWriteFailed`，不會自動重試；
lock 設定無效則會在檢查或變更目標前拋出 `InvalidConfiguration`。

## 環境變數

套件提供的設定檔會讀取以下環境變數：

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```

`FILE_MAGIC_DISK` 會回退至 Laravel 的 `FILESYSTEM_DISK`。其他選項可在發佈後的
`config/file-magic.php` 修改。
