# 效能與安全

## 效能

每次 `store()` 都會將原始來源讀取一次，建立有大小上限的本機快照；內容檢查、圖片處理與
寫入都使用這份資料，避免檢查後來源被替換。即使來源已在本機，也需要這份額外暫存空間。

估算尖峰空間時，請把來源快照、Base64 解碼或遠端下載暫存檔、圖片輸出快照，以及覆寫時
的舊檔案備份相加，不要只計算其中一項。

- `contents()` 會把完整檔案放入記憶體。大型檔案請使用 `readStream()`，並在使用後
  關閉回傳的 stream。
- 超限 Base64 會依解碼後大小在解碼前被拒絕；合法 Base64 會以有界線的區塊解碼至暫存 stream，
  編碼後輸入保留於記憶體，解碼後 bytes 需要暫存磁碟空間。大型輸入請優先使用 upload、path 或 remote source。
- `csv()` 會立即走訪 iterable，並在回傳 `PendingFile` 前把產生的完整輸出放入 PHP 記憶體。
  之後的 `maxSize()` 無法限制產生階段的記憶體；大型匯出請先串流寫入本機檔案，再用 `fromPath()`。
- 原始來源會先通過 size 與 MIME 規則，但合格圖片的處理記憶體仍可能遠高於壓縮大小；
  請使用應用程式接受的最大圖片尺寸測試。
- `Overwrite` 需要接近現有檔案大小的本機暫存空間，耗時也高於一般儲存。除非 path
  必須保持不變，否則請優先使用 `Unique`。
- 啟用 collision lock 時，儲存、批次刪除與稽核清理都會等待 canonical disk/path locks。
  N 個路徑的等待時間可能接近 `N × collision_lock.wait_seconds`。鎖不會自動續期，
  有效期限必須涵蓋取得所有鎖與完成整次操作的時間，並應監控等待逾時。
- ZIP 下載需要容納來源資料與 ZIP archive 的暫存空間，請設定合適的
  `zip.max_files` 與 `zip.max_size`。
- 遠端下載暫存檔與來源快照可能同時存在，基本用量接近下載大小的兩倍，整次儲存都會占用
  PHP worker。逾時上限是逐次 HTTP 請求計算；大型或緩慢匯入可放入應用程式的 queue job。
- 多個 targets 請一次傳給 `find()`，不要重複執行單筆查詢；批次刪除請使用
  `FileQuery::delete()`。
- `file-magic:audit` 會在 storage 檢查每筆選定紀錄。遠端 disk 可能增加網路延遲與
  請求費用；`--chunk` 只限制每批資料量。清理會對身分未變的初步遺失紀錄再檢查一次。
- `urls()` 也會逐檔確認是否存在，使用遠端 disk 時請計入這些額外請求。

請用應用程式允許的最大檔案與批次，實際測量記憶體、暫存空間、執行時間及遠端費用。

## 安全

- 應用程式必須檢查每次儲存、讀取、URL、下載、ZIP、刪除與稽核清理的權限。
- 上傳檔案前仍須保留 Laravel request validation。
- 原始檔名、client MIME、metadata、遠端內容與儲存 bytes 都是不可信任資料。
- 只有應用程式自行產生 bytes 並保證格式時才能使用 `fromGeneratedContent()`。不建議把 upload、
  HTTP response、Data URI、使用者選擇的 path 或其他不可信任 bytes 連同 Symfony 可識別 MIME type
  傳入；請使用一般來源入口，讓 `finfo` 檢查內容。
- 高敏感度流程請優先使用 MIME allowlist。同源提供檔案時，應考慮封鎖 HTML 與 SVG。
- 敏感檔案請使用 private disk 與短效 temporary URL。
- 不要將使用者控制的伺服器路徑傳給 `fromPath()`。
- 建立 ZIP 前必須驗證每個 target 的操作權限。
- 除了 FileMagic 的 `max_size`，也要設定 Web Server 與 PHP request limits。
- 應用程式風險模型需要時，請加入 antivirus 或 content scanning。
- 遠端匯入預設驗證 TLS 並封鎖 private network targets。正式環境請保留這些預設，
  並使用 outbound firewall 增加另一層限制。
- 除非能安全隔離，下載的 HTML 與其他 active content 應保持 private。不可信任檔案
  應以 attachment 與 `X-Content-Type-Options: nosniff` 提供。
- 避免記錄檔案內容、credentials、private URLs 或敏感 metadata。

路徑鎖定需要所有操作互相配合：FileMagic 的儲存、批次刪除與稽核清理必須使用相同的鎖定鍵、
共用同一個快取後端，並在鎖的有效期限內完成。直接刪除 Model、直接寫入 storage 的程式，
以及彼此隔離的快取叢集，都不受保護。

鎖定無法讓 storage 與資料庫共用交易。行程或基礎設施故障後，仍需透過稽核與狀態核對復原。

安全性問題請依照倉庫的
[安全政策](https://github.com/mattmy/laravel-file-magic/blob/main/SECURITY.md)私下回報。
