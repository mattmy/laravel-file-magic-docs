# ZIP 與刪除

## 將多個檔案下載為 ZIP

必須先安裝並啟用 PHP `ext-zip`。

使用安全的自動產生下載名稱：

```php
return FileMagic::find([
    $firstId,
    $secondUuid,
    $fileModel,
])->downloadZip();
```

自訂 ZIP 下載名稱：

```php
return FileMagic::find($targets)->downloadZip('project-documents');
```

傳入 `project-documents` 或 `project-documents.zip` 都會產生
`project-documents.zip`。ZIP 內優先使用原始檔名。FileMagic 會移除目錄、清理不安全的字元，
必要時改用儲存檔名。檔案依查詢順序加入，名稱重複時會加上序號，例如 `report (2).pdf`、
`report (3).pdf`。

ZIP 使用本機暫存空間，不會把所有來源內容同時載入記憶體。每次操作受到
`zip.max_files` 與 `zip.max_size` 限制。`zip.max_size` 以來源檔案未壓縮的總位元組數計算。
查詢結果為空，或有檔案遺失、無法讀取時，整次下載會失敗。ZIP 會在送出回應後刪除，
也不會新增 `StoredFile` 紀錄。


## 刪除檔案

刪除單筆實體檔案與資料庫紀錄：

```php
$deleted = FileMagic::find($target)->delete();
```

批次刪除：

```php
$deleted = FileMagic::find($targets)->delete();
```

FileMagic 會依磁碟批次刪除，只有某個磁碟的批次失敗時，才逐一檢查該磁碟的路徑。
確認檔案已刪除或遺失後才移除紀錄，其餘保留供後續重試。

FileMagic 會在刪除前重新查詢紀錄，略過已移除的紀錄，並保留磁碟、路徑或位置識別值已變更的紀錄。
啟用路徑鎖定後，會在重查前取得鎖，並持有到整批操作完成。

只要有目標未完成，FileMagic 就會先刪除已確認的紀錄，再拋出 `PartialFileDeletion`。
可用 `deletedCount()`、`failedCount()` 和 `failedKeys()` 查看結果。重新呼叫 `find()` 重試前，
請先確認失敗的紀錄仍指向你要刪除的檔案。

檔案儲存空間與資料庫各自執行刪除，因此同一批可能只有部分檔案刪除成功。批次刪除不會建立備份。

成功時回傳刪除的紀錄數，空結果回傳 `0`。資料庫刪除失敗，或實際刪除筆數與已確認的
紀錄數不符時，會拋出 `FileRecordFailed`，此時實體檔案可能已刪除。批次刪除不會
逐筆觸發 Eloquent `deleting`／`deleted` 事件。


