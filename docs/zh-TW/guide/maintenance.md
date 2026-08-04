# 一致性稽核

FileMagic 可以比較 stored-file database records 與 Laravel Filesystem objects：

```bash
php artisan file-magic:audit
```

指令只會由 database 往 storage 檢查：

- `exists()` 成功回傳 `true` 代表 healthy；
- 回傳 `false` 代表 object missing；
- 拋出例外代表狀態 unknown，因此保留 record。

它不會列舉 storage、不會尋找沒有 database record 的 objects、不會刪除實體檔案，
也不會重建缺失的 object。

## 唯讀稽核

預設模式不會修改 database 或 storage：

```bash
php artisan file-magic:audit
php artisan file-magic:audit --disk=s3
php artisan file-magic:audit --chunk=250
```

| Option | 型別與預設 | 行為 |
| --- | --- | --- |
| `--disk` | `?non-empty-string`，預設 `null` | 只稽核一個已設定於 `filesystems.disks` 的 disk；省略時稽核全部 records |
| `--chunk` | `int<1, 5000>`，預設 `500` | 每批載入的 database records 數量 |
| `--delete-missing-records` | Boolean flag，預設 `false` | 刪除已確認 object 缺失的 database records |
| `--force` | Boolean flag，預設 `false` | 在清理模式略過確認；未搭配 `--delete-missing-records` 時無效 |

無效的 option 會在掃描或修改資料前以 exit code `2` 結束。指令會使用 FileMagic
設定的 Model、connection、table 與 primary key。即使 Model 有 global scopes，仍會
檢查全部 records；需要縮小範圍時請使用 `--disk`。

每筆 missing finding 只顯示 database key、disk 與 storage 相對 path。最後摘要會
列出 `checked`、`healthy`、`missing`、`deleted` 及 `failed`。

## 清理 missing records

刪除已確認缺少 storage object 的 database records：

```bash
php artisan file-magic:audit --delete-missing-records
```

互動執行會在掃描前要求確認；拒絕時不掃描、不修改資料並正常結束。非互動環境必須
明確承擔風險：

```bash
php artisan file-magic:audit --delete-missing-records --force --no-interaction
```

`--force` 沒有搭配 `--delete-missing-records` 時屬於無效輸入。Storage 檢查拋出
例外時仍屬於 unknown，絕不刪除該 record。

清理不會逐筆觸發 Eloquent `deleting` 或 `deleted` model events。應用程式需要為每筆
移除紀錄執行這些 events 時，不要使用此清理功能。

## 成本、效能與一致性

稽核會對每筆選定的 database record 執行一次 storage existence check。使用 S3 或
其他遠端 disk 時，這些 checks 可能增加網路延遲與可計費的 request 費用。

`--chunk` 只控制 database query 大小與 PHP memory 使用量，不會減少 storage
requests 數量。請使用 `--disk` 限制範圍、選擇適當 chunk size，並避免以超過實際
需求的頻率執行。

結果是檢查當下的觀察，不是 database 與 storage 共用的原子快照。其他程序可能在
檢查與 database 清理之間新增或移除 object。執行清理時，應避免外部程序同時操作
相同 paths。

Storage、網路、adapter 或權限例外都會被視為 unknown failure，而不是 missing。
指令會保留相關 records 並回傳 exit code `2`。

清理不是全部成功才生效。發生 database error 時，指令會停止並回傳 exit code `2`，
但先前處理的 records 可能已經刪除。指令永遠不會刪除 storage objects。

## Exit codes

| Code | 意義 |
| --- | --- |
| `0` | 沒有尚未解決的 missing records，或清理已刪除全部確認 missing 的 records |
| `1` | 唯讀稽核完成，但仍有 missing records |
| `2` | 輸入無效、storage 狀態 unknown、database 失敗或只完成部分清理 |

自動化流程只需要 exit code 時可以使用 `--quiet`。

## 排程

FileMagic 不會自動註冊稽核排程。Laravel 應用程式可自行加入：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('file-magic:audit --disk=s3')
    ->daily()
    ->withoutOverlapping();
```

遠端稽核可能比預期耗時，因此應使用 `withoutOverlapping()`。多伺服器環境可以搭配
shared cache driver 考慮使用 `onOneServer()`。請先衡量 record 數量、遠端 request
延遲與供應商費用，再決定執行頻率。
