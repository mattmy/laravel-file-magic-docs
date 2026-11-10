# 文件與圖片

## 產生 TXT、JSON 與 CSV 文件

### 產生 UTF-8 TXT 文件：

```php
$file = FileMagic::text("第一行\n第二行")
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('notes')
    ->store();
```

`text()` 會完整保留輸入內容，包括空白與換行。空字串會產生空的 `.txt` 檔案。

### 產生 JSON：

```php
$file = FileMagic::json([
    'message' => '我是文字',
    'items' => ['第一筆', '第二筆'],
])
    ->named('messages')
    ->store();
```

輸出會加上縮排及結尾換行，保留原有的 Unicode 字元與斜線。

### 產生 CSV 文件：

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

`csv()` 會立即走訪 iterable，並在回傳 `PendingFile` 前把產生的完整輸出放入 PHP 記憶體。
CSV 沒有獨立的輸出上限，之後設定 `maxSize()` 也無法限制產生 CSV 時的記憶體用量。
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

支援 JPEG、PNG、WebP 與 BMP，實際可處理的格式取決於 driver。縮放會維持比例、只縮小不放大；
同時安裝 Imagick 與 GD 時會優先使用 Imagick。

`resizeImage()` 會盡可能處理圖片。非圖片、GIF、SVG、不支援的格式，以及已知的解碼或編碼
失敗，都會保留原始內容。因此，不能用這個方法驗證上傳內容一定是合法圖片。

最大寬度必須是正整數，品質必須介於 `1` 至 `100`，即使來源不是圖片也會驗證。
處理支援格式時若缺少 Intervention Image 或可用的 driver，會拋出
`ImageProcessingUnavailable`；未預期的系統錯誤也不會被忽略。

FileMagic 會在圖片解碼或縮放前先對原始來源套用 size 與 MIME 限制；輸出有變更時，
也會在儲存前再次檢查最終內容。原始圖片超過 `maxSize()` 時，即使縮放後可能變小，
仍會被拒絕。


