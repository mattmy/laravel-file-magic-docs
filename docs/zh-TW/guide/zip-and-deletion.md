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
`project-documents.zip`。ZIP entry 預設使用每個檔案的原始名稱；名稱重複時會依
query 順序產生 `report (2).pdf`、`report (3).pdf`。

ZIP 使用本機暫存空間，不會把所有來源內容同時載入記憶體。每次操作受到
`zip.max_files` 與 `zip.max_size` 限制；`zip.max_size` 計算未壓縮的來源總 bytes。
Response 完成後會移除暫存檔案。

查詢結果為空或任一實體檔案不存在時，整個操作都會失敗，不會靜默回傳不完整的
ZIP。`downloadZip()` 只建立暫時的 HTTP 下載，不會新增 `StoredFile` 紀錄。


## 刪除檔案

刪除單筆實體檔案與資料庫紀錄：

```php
$deleted = FileMagic::find($target)->delete();
```

批次刪除：

```php
$deleted = FileMagic::find($targets)->delete();
```

批次刪除只會移除已確認刪除完成或本來就不存在的實體檔案紀錄。仍存在或無法確認
狀態的檔案會保留紀錄，讓應用程式稍後重試。

FileMagic 會在刪除前重新查詢紀錄，避免使用已失效的路徑。紀錄已消失時略過；
disk、路徑或識別值改變時保留紀錄，並以 `PartialFileDeletion` 回報。啟用路徑鎖定後，
還會按固定順序取得所有候選路徑的鎖，並持有到整批操作完成。

如果只有部分檔案完成刪除，FileMagic 會先保存已確認的一致狀態，再拋出
`PartialFileDeletion`。可透過 `deletedCount()`、`failedCount()` 與 `failedKeys()`
取得結果。你可以安全地用原本的 `FileMagic::find($targets)->delete()` 重試；
已經不存在的 object 會視為刪除完成。

Storage 與 database 無法共用同一個 transaction，因此批次刪除不是全部成功才生效；
後面的檔案失敗時，前面的檔案可能已刪除。批次刪除不會建立備份。

成功時回傳刪除的紀錄數，空結果回傳 `0`。資料庫刪除失敗，或實際刪除筆數與已確認的
紀錄數不符時，會拋出 `FileRecordFailed`，此時實體檔案可能已刪除。批次刪除不會
逐筆觸發 Eloquent `deleting`／`deleted` 事件。


