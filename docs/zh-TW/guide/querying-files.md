# 查詢檔案

## 選擇要操作的檔案

將正整數 ID、`'123'` 這類十進位 ID 字串、UUID 或已儲存的 `StoredFile` Model 傳給 `find()`。

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

`FileQuery` 第一次使用時才查詢檔案紀錄，後續操作會沿用結果。檔案紀錄最多查詢一次，
會套用設定的 Model 全域範圍、保留輸入順序並去除重複紀錄。Eloquent 預先載入關聯時可能另外查詢。
傳入的 Model 只提供主鍵。沒有有效目標時會略過資料庫查詢。

`find()` 會略過 `null`、布林值、浮點數、非正整數，以及無法解析成正整數 ID 或合法 UUID 的字串。
直接參數、陣列與 Collection 內的值都遵循同一規則。十進位 ID 字串只接受 ASCII 數字，可含前導零，
且須在 PHP 整數範圍內。UUID 不區分大小寫。

巢狀陣列或 Collection、其他不支援的型別及無效的 Model 會拋出 `InvalidFileTarget`。
Model 必須已儲存，且符合設定的檔案 Model、連線、資料表與主鍵名稱。主鍵值須與已儲存的值相同。

合法但找不到紀錄的 ID 或 UUID 會從結果中省略，因此 `one()` 會回傳第一個符合的
`StoredFile` 或 `null`。`download()`、`contents()` 等需要檔案的操作在查無結果時會拋出
`FileNotFound`。`get()` 會回傳
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

`urls()` 會回傳以 Model 主鍵為索引的 `Illuminate\Support\Collection<int|string, string>`。
每筆符合的紀錄都會檢查一次檔案是否存在，結果只包含仍有實體檔案的紀錄。使用遠端磁碟時，
逐筆檢查會增加請求數與等待時間。

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

大型檔案請用串流逐段讀取。

```php
$stream = FileMagic::find($target)->readStream();

try {
    while (\feof($stream) === false) {
        $chunk = \fread($stream, 8192);

        if ($chunk === false || ($chunk === '' && \feof($stream) === false)) {
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

`download()` 優先使用清理過的原始檔名，沒有可用的原始檔名時使用儲存檔名。
Laravel 會依紀錄中的 MIME 類型串流傳送檔案。自訂名稱只會改變下載時顯示的檔名。


