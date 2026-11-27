# 文件與圖片

## 產生 TXT、JSON 與 CSV 文件

### UTF-8 純文字 {#產生-utf-8-txt-文件}

```php
$file = FileMagic::text("第一行\n第二行")
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('notes')
    ->store();
```

`text()` 會完整保留輸入內容，包括空白與換行。空字串會產生空的 `.txt` 檔案。

### JSON {#產生-json}

```php
$file = FileMagic::json([
    'message' => '我是文字',
    'items' => ['第一筆', '第二筆'],
])
    ->named('messages')
    ->store();
```

`json()` 接受陣列或 `JsonSerializable` 物件。輸出會加上縮排及結尾換行，並保留原有的 Unicode 字元與斜線。

### CSV {#產生-csv-文件}

```php
$file = FileMagic::csv([
    ['name' => '第一筆', 'content' => '我是文字'],
    ['name' => '第二筆', 'content' => '我是文字 2'],
])
    ->named('messages')
    ->store();
```

使用關聯式陣列時，第一列的鍵會成為欄名。使用清單時，CSV 會直接從資料列開始。
各列的鍵與順序都必須一致，每個值必須是純量或 `null`。CSV 使用不含 BOM 的 UTF-8，
以逗號分隔、雙引號包住需要引號的欄位，並以 CRLF 換行。

`csv()` 會讀完所有資料列，並在回傳 `PendingFile` 前把整份 CSV 放進 PHP 記憶體。
產生 CSV 時沒有獨立的大小上限。`maxSize()` 會在呼叫 `store()` 時才生效。
大型匯出請先由應用程式串流寫入本機檔案，再用 `fromPath()` 儲存。

三個方法都會回傳 `PendingFile`，可像上傳檔案一樣，在呼叫 `store()` 前調整儲存選項。

無效的 UTF-8、無法編碼的 JSON 值及欄位不一致的 CSV 資料列，都會拋出 `InvalidDocumentData`。


## 圖片縮放

先安裝 Intervention Image 4。

```bash
composer require "intervention/image:^4.0"
```

啟用 GD 或 Imagick 後，即可指定最大寬度和輸出品質。

```php
$file = FileMagic::fromUpload($image)
    ->resizeImage(maxWidth: 1600, quality: 82)
    ->store();
```

直接呼叫 `resizeImage()` 會使用設定的 `image.max_width` 和 `image.quality`。

支援 JPEG、PNG、WebP 與 BMP，實際可處理的格式取決於圖片驅動程式。縮放會維持比例，且只縮小。
同時啟用 Imagick 與 GD 時會優先使用 Imagick。

`resizeImage()` 會保留非圖片、GIF、SVG、不支援格式和已知編解碼失敗的原始內容。應用程式若只接受
有效圖片，請另外驗證上傳內容。

最大寬度必須是正整數，品質必須介於 `1` 至 `100`，即使來源不是圖片也會驗證。
處理支援格式時，若缺少 Intervention Image 或可用的圖片驅動程式，會拋出
`ImageProcessingUnavailable`。其他未預期的系統錯誤會直接傳出。

FileMagic 會在圖片解碼或縮放前先對原始來源套用 size 與 MIME 限制；輸出有變更時，
也會在儲存前再次檢查最終內容。原始圖片超過 `maxSize()` 時，即使縮放後可能變小，
仍會被拒絕。


