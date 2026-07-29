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

ZIP 會透過有上限的本機暫存檔串流建立，不會把所有來源內容同時載入記憶體。
Response 傳送完成後會自動刪除暫存 archive。每次操作受到 `zip.max_files` 與
`zip.max_size` 限制；`zip.max_size` 計算未壓縮的來源總 bytes。

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

批次刪除會按照 disk 分組。正常路徑中，每個 disk 只執行一次 storage bulk delete，
最後再用一筆 database query 刪除紀錄。只有 adapter 回傳 `false` 或拋出例外時，
FileMagic 才會逐一確認該 disk 的路徑：只刪除已確認不存在 object 的紀錄；仍存在或
無法確認狀態的 object 則保留紀錄供後續重試。

如果只有部分檔案完成刪除，FileMagic 會先保存已確認的一致狀態，再拋出
`PartialFileDeletion`。可透過 `deletedCount()`、`failedCount()` 與 `failedKeys()`
取得結果。你可以安全地用原本的 `FileMagic::find($targets)->delete()` 重試；
已經不存在的 object 會視為刪除完成。

Storage 與 database 不共用 ACID transaction，因此無法保證整批操作完全原子化。
批次刪除不會建立備份。


