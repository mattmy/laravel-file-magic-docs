# 一致性稽核

`file-magic:audit` 會逐筆確認資料庫紀錄對應的檔案是否仍存在。
稽核從資料庫開始，因此沒有紀錄的檔案不在檢查範圍內。

## 唯讀稽核

預設模式不會修改資料庫或 storage：

```bash
php artisan file-magic:audit
php artisan file-magic:audit --disk=s3
php artisan file-magic:audit --chunk=250
```

| 選項 | 型別與預設 | 行為 |
| --- | --- | --- |
| `--disk` | `?non-empty-string`，預設 `null` | 指定 `filesystems.disks` 中的一個磁碟。省略時稽核全部紀錄 |
| `--chunk` | `int<1, 5000>`，預設 `500` | 每批載入的資料庫紀錄數 |
| `--delete-missing-records` | 布林旗標，預設 `false` | 刪除已確認遺失檔案的資料庫紀錄 |
| `--force` | 布林旗標，預設 `false` | 清理時略過確認。單獨使用會回傳結束代碼 `2` |

選項無效時，指令會在掃描或修改資料前回傳結束代碼 `2`。稽核使用設定的 Model、連線、資料表與主鍵，
並略過全域範圍及預設的關聯預先載入。

每筆遺失結果會顯示資料庫主鍵、磁碟及相對路徑。摘要會列出 `checked`、`healthy`、
`missing`、`deleted` 和 `failed`。

## 清理遺失檔案的紀錄

要刪除已確認遺失檔案的資料庫紀錄，可執行：

```bash
php artisan file-magic:audit --delete-missing-records
```

互動執行會在掃描前要求確認；拒絕時不掃描、不修改資料。排程或 CI 等非互動環境必須
明確加上 `--force`，否則指令會拒絕執行：

```bash
php artisan file-magic:audit --delete-missing-records --force --no-interaction
```

清理會先重新查詢初步判定遺失的紀錄，再檢查一次實體檔案。啟用路徑鎖定時，
這兩步會在鎖內進行。只有紀錄身分相同、檔案仍遺失時才刪除紀錄。

檔案重新出現時，指令會保留紀錄並計為 `healthy`。紀錄已刪除時會略過。磁碟、路徑或位置識別值
變更，或無法確認檔案狀態時，會保留紀錄並計為 `failed`。

清理採批次刪除，不會逐筆觸發 Eloquent `deleting` 或 `deleted` 事件。
如果應用程式仰賴這些事件執行後續工作，請另行安排清理流程。

## 成本、效能與一致性

唯讀稽核會對每筆紀錄檢查一次實體檔案是否存在。使用 S3 或其他遠端 disk 時，
這些檢查可能增加等待時間與請求費用。

用 `--chunk` 控制每批載入的紀錄數，用 `--disk` 減少要檢查的紀錄。清理時，若初步判定檔案遺失，
且紀錄的識別資訊未變，指令會再檢查一次檔案是否存在。

唯讀結果只代表各筆資料被檢查當下的狀態。啟用路徑鎖定後，清理會在鎖內重新確認，
與 FileMagic 的儲存及批次刪除互相協調。直接刪除 Model、外部寫入、使用不同快取後端，
或超過鎖有效期限的操作，都不受這項保護。

檢查檔案是否存在時若拋出例外，指令會將該筆計為 `failed`，並以結束代碼 `2` 結束。
清理時會保留該筆紀錄。

遇到資料庫錯誤時，稽核會以結束代碼 `2` 停止。先前批次已刪除的紀錄不會還原。
指令只會刪除資料庫紀錄。

## 結束代碼

| 代碼 | 意義 |
| --- | --- |
| `0` | 稽核完成且無遺失紀錄、清理完成，或使用者取消清理 |
| `1` | 唯讀稽核完成，但仍有遺失檔案的紀錄 |
| `2` | 輸入無效、無法確認檔案狀態、資料庫失敗或只完成部分清理 |

自動化流程只需要結束代碼時，可使用 `--quiet`。

## 排程

FileMagic 不會自動註冊稽核排程。Laravel 應用程式可自行加入：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('file-magic:audit --disk=s3')
    ->daily()
    ->withoutOverlapping();
```

遠端稽核可能耗時較久，可用 `withoutOverlapping()` 避免同一工作重疊執行。
多伺服器環境可搭配共享快取與 `onOneServer()`。請先衡量紀錄數量、遠端請求延遲
及供應商費用，再決定執行頻率。
