# 查詢檔案

## 查詢檔案

一般檔案查詢全部透過唯一的 `find()` 入口。它可以接受正整數 ID、UUID 或已存在的 `StoredFile` Model：

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

批次查詢支援 variadic targets、array 及 Laravel Collection：

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

三種形式都會保留輸入順序並移除重複 Model。已存在的 Model target 會直接使用。
空 array 或 Collection 會回傳空的 `Illuminate\Support\Collection`。

Array 與 Collection 必須是一維結構，每個元素都必須是正整數 ID、合法 UUID 或已儲存的 `StoredFile`。無效元素會拋出 `InvalidFileTarget`，不會被靜默移除。

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

批次取得公開 URL：

```php
$urls = FileMagic::find([
    $firstUuid,
    $secondUuid,
])->urls();
```

`urls()` 會回傳以 Model key 為索引的 `Illuminate\Support\Collection<int|string, string>`。實體檔案不存在於 disk 的紀錄不會包含在結果中。

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
            break;
        }

        // 處理目前讀取到的內容。
    }
} finally {
    \fclose($stream);
}
```

呼叫端擁有 `readStream()` 回傳的 stream，並且必須負責關閉它。


## 下載

使用原始檔名下載：

```php
return FileMagic::find($target)->download();
```

自訂下載檔名：

```php
return FileMagic::find($target)->download('invoice-2026.pdf');
```

Laravel Filesystem 會以 stream 回傳 response，並使用從內容偵測到的 MIME type。


