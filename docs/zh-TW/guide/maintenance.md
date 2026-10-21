# 一致性稽核

FileMagic 可以檢查資料庫中的檔案紀錄，確認實體檔案是否仍存在於 Laravel Filesystem：

```bash
php artisan file-magic:audit
```

指令會逐筆查看資料庫紀錄，再向 storage 確認：

- `exists()` 回傳 `true`：檔案存在，計為 `healthy`。
- 回傳 `false`：檔案遺失，計為 `missing`。
- 拋出例外：無法確認狀態，計為 `failed` 並保留紀錄。

它不會掃描 storage 中沒有紀錄的檔案，也不會刪除或重建任何實體檔案。

## 唯讀稽核

預設模式不會修改資料庫或 storage：

```bash
php artisan file-magic:audit
php artisan file-magic:audit --disk=s3
php artisan file-magic:audit --chunk=250
```

| Option | 型別與預設 | 行為 |
| --- | --- | --- |
| `--disk` | `?non-empty-string`，預設 `null` | 只稽核一個已設定於 `filesystems.disks` 的 disk；省略時稽核全部紀錄 |
| `--chunk` | `int<1, 5000>`，預設 `500` | 每批載入的資料庫紀錄數 |
| `--delete-missing-records` | Boolean flag，預設 `false` | 刪除已確認遺失檔案的資料庫紀錄 |
| `--force` | Boolean flag，預設 `false` | 在清理模式略過確認；單獨使用會以 exit code `2` 結束 |

無效選項會在掃描或修改資料前以 exit code `2` 結束。指令會使用 FileMagic 設定的
Model、連線、資料表與主鍵。即使 Model 有全域 scope，仍會檢查全部紀錄；
需要縮小範圍時請使用 `--disk`。

每筆遺失結果只顯示資料庫主鍵、disk 與 storage 相對路徑。最後摘要會
列出 `checked`、`healthy`、`missing`、`deleted` 及 `failed`。

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

`--force` 沒有搭配 `--delete-missing-records` 時屬於無效輸入。Storage 檢查拋出
例外時仍代表狀態不明，不會刪除該紀錄。

清理會先重新查詢初步判定遺失的紀錄，再檢查一次實體檔案。啟用路徑鎖定時，
這兩步會在鎖內進行。只有紀錄身分相同、檔案仍遺失時才刪除紀錄。

檔案重新出現會保留紀錄並計為 `healthy`；紀錄已消失時略過，不計入 `deleted`；
disk、路徑或識別值改變，或無法確認檔案狀態時，保留紀錄並計為 `failed`。

清理採批次刪除，不會逐筆觸發 Eloquent `deleting` 或 `deleted` 事件。
如果應用程式仰賴這些事件執行後續工作，請另行安排清理流程。

## 成本、效能與一致性

唯讀稽核會對每筆紀錄檢查一次實體檔案是否存在。使用 S3 或其他遠端 disk 時，
這些檢查可能增加等待時間與請求費用。

`--chunk` 只控制每批資料量與 PHP 記憶體用量，不會減少 storage 請求數。
清理模式會對身分未變的初步遺失紀錄再檢查一次，因此會增加請求數。
請用 `--disk` 限制範圍，依實際需求選擇批次大小與執行頻率。

唯讀結果只代表各筆資料被檢查當下的狀態。啟用路徑鎖定後，清理會在鎖內重新確認，
與 FileMagic 的儲存及批次刪除互相協調。直接刪除 Model、外部寫入、使用不同快取後端，
或超過鎖有效期限的操作，都不受這項保護。

Storage、網路、adapter 或權限錯誤都代表無法確認狀態，不代表檔案遺失。
指令會保留相關紀錄，並以 exit code `2` 結束。

清理不是全部成功才生效。發生資料庫錯誤時，指令會停止並以 exit code `2` 結束，
先前批次已刪除的紀錄不會還原。實體檔案不會被刪除。

## 結束代碼

| Code | 意義 |
| --- | --- |
| `0` | 稽核完成且無遺失紀錄、清理完成，或使用者取消清理 |
| `1` | 唯讀稽核完成，但仍有遺失檔案的紀錄 |
| `2` | 輸入無效、無法確認檔案狀態、資料庫失敗或只完成部分清理 |

自動化流程只需要 exit code 時可以使用 `--quiet`。

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
