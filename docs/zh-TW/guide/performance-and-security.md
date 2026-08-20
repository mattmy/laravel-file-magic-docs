# 效能與安全

## 效能

- `contents()` 會把完整檔案放入記憶體。大型檔案請使用 `readStream()`，並在使用後
  關閉回傳的 stream。
- 超限 Base64 會依解碼後大小在解碼前被拒絕；合法 Base64 會以有界線的區塊解碼至暫存 stream，
  編碼後輸入保留於記憶體，解碼後 bytes 需要暫存磁碟空間。大型輸入請優先使用 upload、path 或 remote source。
- 原始來源會先通過 size 與 MIME 規則，但合格圖片的處理記憶體仍可能遠高於壓縮大小；
  請使用應用程式接受的最大圖片尺寸測試。
- `Overwrite` 需要接近現有檔案大小的本機暫存空間，耗時也高於一般儲存。除非 path
  必須保持不變，否則請優先使用 `Unique`。
- 啟用 collision lock 時，每次儲存都會等待候選 disk/path 的 lock。Lock lease 應涵蓋最慢的
  完整儲存流程，並監控 lock timeout。
- ZIP 下載需要容納來源資料與 ZIP archive 的暫存空間，請設定合適的
  `zip.max_files` 與 `zip.max_size`。
- 遠端匯入需要接近下載檔案大小的本機暫存空間，下載完成前也會持續占用目前的 PHP
  worker。請設定連線與完整下載 timeout，大型或緩慢下載建議使用 queue。
- 多個 targets 請一次傳給 `find()`，不要重複執行單筆查詢；批次刪除請使用
  `FileQuery::delete()`。
- `file-magic:audit` 會在 storage 檢查每筆選定紀錄。遠端 disk 可能增加網路延遲與
  request 費用；`--chunk` 只限制 database memory，不會減少 storage checks。

請用應用程式允許的最大檔案與批次，實際測量記憶體、暫存空間、執行時間及遠端費用。

## 安全

- 應用程式必須授權每個儲存、讀取、URL、下載、ZIP 與刪除操作。
- 上傳檔案前仍須保留 Laravel request validation。
- 原始檔名、client MIME、metadata、遠端內容與儲存 bytes 都是不可信任資料。
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

啟用後，collision lock 是合作式保護：writers 必須產生相同 key、共用相同 cache backend，並在
lease 內完成。直接寫入 storage 的程式與彼此隔離的 cache clusters 不在此邊界內。
Lock 不是 ACID transaction，因此 process 或 infrastructure 故障後仍應透過 audit 與
reconciliation 進行營運復原。

安全性問題請依照倉庫的
[安全政策](https://github.com/mattmy/laravel-file-magic/blob/main/SECURITY.md)私下回報。
