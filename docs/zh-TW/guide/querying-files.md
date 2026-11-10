# 查詢檔案

## 選擇要操作的檔案

將正整數 ID、UUID 或已儲存的 `StoredFile` Model 傳給 `find()`。

```php
$file = FileMagic::find($id)->one();
$file = FileMagic::find($uuid)->one();
$file = FileMagic::find($fileModel)->one();
```

不需要先取出 Model，也可以直接操作第一個符合的檔案：

```php
FileMagic::find($uuid)->contents();
FileMagic::find($fileModel)->download();
FileMagic::find($id)->delete();
```

批次查詢可逐一傳入目標，也可傳入陣列或 Laravel Collection。

```php
$variadic = FileMagic::find(
    $firstId,
    $secondUuid,
    $fileModel,
)->get();

$array = FileMagic::find([
    $firstId,
    $secondUuid,
    $fileModel,
])->get();

$collection = FileMagic::find(collect([
    $firstId,
    $secondUuid,
    $fileModel,
]))->get();
```

三種形式都會保留輸入順序並去除重複紀錄。第一次操作 `FileQuery` 時，會用一筆查詢取得目前的紀錄，
並套用設定 Model 的全域 scope。傳入的 Model 只提供主鍵。同一個 `FileQuery` 的後續操作會沿用查詢結果。
空陣列或空 Collection 不會查詢資料庫。

陣列與 Collection 必須是一維結構，且每個元素都必須是正整數 ID、合法 UUID 或已儲存的 `StoredFile`。
有無效元素時會拋出 `InvalidFileTarget`。

UUID 不區分大小寫。`"123"` 這類數字字串不算整數 ID，請先驗證並轉換 request 的值。
Model 必須符合設定的檔案 Model、連線、資料表與主鍵名稱，且主鍵不可有未儲存的修改。

合法但找不到紀錄的 ID 或 UUID 會從結果中省略，因此 `one()` 會回傳第一個符合的
`StoredFile` 或 `null`；`download()`、`contents()` 等必須取得檔案的操作在沒有任何
結果時則會拋出 `FileNotFound`。`get()` 會回傳
`Illuminate\Support\Collection<int, StoredFile>`，可以使用 `map()`、`filter()`、
`pluck()` 等一般 Laravel Collection 方法。


## 取得 URL

公開 URL：

```php
$url = FileMagic::find($target)->url();
```

使用設定檔預設有效時間的 temporary URL：

```php
$url = FileMagic::find($target)->temporaryUrl();
```

自訂到期時間：

```php
$url = FileMagic::find($target)
    ->temporaryUrl(now()->addMinutes(30));
```

`StoredFile::temporaryUrl()` 必須明確傳入到期時間。需要使用設定的 `temporary_url_ttl` 時，請使用此查詢 API。

批次取得公開 URL：

```php
$urls = FileMagic::find([
    $firstUuid,
    $secondUuid,
])->urls();
```

`urls()` 會回傳以 Model key 為索引的 `Illuminate\Support\Collection<int|string, string>`。實體檔案不存在於 disk 的紀錄不會包含在結果中。每筆結果都會檢查一次 storage，
使用遠端 disk 時會增加請求數與等待時間。

使用的 disk 必須支援對應的 URL 操作。本機 temporary URL 需要在 Laravel local disk 設定 `serve => true`；S3 等 cloud disk 則需要完成正常的憑證及 bucket 設定。


## 讀取與串流

檢查實體檔案是否存在：

```php
$file = FileMagic::find($target);

if ($file->exists()) {
    // 實體檔案存在。
}
```

將小型檔案完整讀入記憶體：

```php
$contents = FileMagic::find($target)->contents();
```

大型檔案應使用 stream：

```php
$stream = FileMagic::find($target)->readStream();

try {
    while (\feof($stream) === false) {
        $chunk = \fread($stream, 8192);

        if ($chunk === false) {
            throw new \RuntimeException('The file stream could not be read.');
        }

        // 處理目前讀取到的內容。
    }
} finally {
    \fclose($stream);
}
```

呼叫端必須負責關閉 `readStream()` 回傳的串流。`exists()` 在找不到資料庫紀錄時
會拋出 `FileNotFound`；只有紀錄存在、實體檔案遺失時才回傳 `false`。


## 下載

使用原始檔名下載：

```php
return FileMagic::find($target)->download();
```

自訂下載檔名：

```php
return FileMagic::find($target)->download('invoice-2026.pdf');
```

Laravel Filesystem 會以串流回傳下載，使用紀錄中的 MIME type：一般來源由內容偵測，
可信任產物則使用宣告的類型。自訂下載檔名不會轉換檔案格式。


