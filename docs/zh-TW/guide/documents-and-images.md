# 文件與圖片

## 產生 TXT、JSON 與 CSV 文件

產生 UTF-8 TXT 文件：

```php
$file = FileMagic::text("第一行\n第二行")
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('notes')
    ->store();
```

`text()` 會完整保留輸入內容，包括空白與換行。空字串會產生空的 `.txt` 檔案。

從 array 或 `JsonSerializable` 物件產生容易閱讀的 JSON：

```php
$file = FileMagic::json([
    'message' => '我是文字',
    'items' => ['第一筆', '第二筆'],
])
    ->named('messages')
    ->store();
```

JSON 使用 pretty print、保留 Unicode 與未跳脫的 slash，並在文件結尾加入換行。

產生 CSV 文件：

```php
$file = FileMagic::csv([
    ['name' => '第一筆', 'content' => '我是文字'],
    ['name' => '第二筆', 'content' => '我是文字 2'],
])
    ->named('messages')
    ->store();
```

Associative rows 會使用第一列的 key 自動產生 header；list rows 不會產生 header。每列必須使用相同的 key 與順序，每個值必須是 scalar 或 `null`。CSV 固定使用不含 BOM 的 UTF-8、逗號 delimiter、雙引號 enclosure 與 CRLF 行尾。

三個方法都會回傳一般的 `PendingFile`，因此仍可使用 disk、directory、filename、visibility、collision、owner、metadata、MIME 與 size 設定。`PendingFile` 固定使用 `store()` 完成儲存，不提供 `storage()`、`toTxt()`、`toJson()` 或 `toCsv()` 別名。儲存後可直接使用既有的 `StoredFile` 與 `FileQuery` API。

無效 UTF-8、無法編碼的 JSON 值，以及結構不一致的 CSV rows 會拋出 `InvalidDocumentData`。


## 圖片縮放

先安裝 optional dependency：

```bash
composer require "intervention/image:^4.0"
```

確認 GD 或 Imagick 已啟用後，即可按比例縮放：

```php
$file = FileMagic::fromUpload($image)
    ->resizeImage(maxWidth: 1600, quality: 82)
    ->store();
```

使用設定檔的預設尺寸及品質：

```php
$file = FileMagic::fromUpload($image)
    ->resizeImage()
    ->store();
```

目前會在使用中的 driver 支援時處理 JPEG、PNG、WebP 與 BMP。

`resizeImage()` 採用 best-effort 行為：非圖片、GIF、SVG、不支援的格式，以及 Intervention Image 無法解碼或編碼的內容，都會忽略圖片設定並原樣儲存，不會拋出圖片處理例外。無效的圖片選項，以及處理受支援圖片時缺少 Intervention Image、GD 或 Imagick，仍會拋出明確例外。


