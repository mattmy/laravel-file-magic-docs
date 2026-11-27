# Documents and images

## Generate TXT, JSON, and CSV documents

### UTF-8 text {#create-a-utf-8-txt-document}

```php
$file = FileMagic::text("First line\nSecond line")
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('notes')
    ->store();
```

`text()` preserves the input exactly, including whitespace and line endings. An empty string creates an empty `.txt` file.

### JSON {#create-a-json-document}

```php
$file = FileMagic::json([
    'message' => 'Hello',
    'items' => ['First', 'Second'],
])
    ->named('messages')
    ->store();
```

`json()` accepts an array or a `JsonSerializable` object. It indents the output, keeps Unicode
and slashes unescaped, and ends the document with a newline.

### CSV {#create-a-csv-document}

```php
$file = FileMagic::csv([
    ['name' => 'First', 'content' => 'Hello'],
    ['name' => 'Second', 'content' => 'Hello again'],
])
    ->named('messages')
    ->store();
```

Associative rows use the first row's keys as a header. List rows do not generate a header. Every row must use the same keys in the same order, and every value must be scalar or `null`. CSV uses UTF-8 without a BOM, comma delimiters, double-quote enclosures, and CRLF line endings.

`csv()` reads all rows and holds the finished CSV in PHP memory before returning a `PendingFile`.
There is no separate CSV output limit. `maxSize()` applies later, when you call `store()`.
For large exports, stream the CSV to a local file, then store it with `fromPath()`.

All three methods return a `PendingFile`. You can set the same storage options as for an upload
before calling `store()`.

Invalid UTF-8, JSON values that cannot be encoded, and inconsistent CSV rows throw `InvalidDocumentData`.


## Image resizing

```bash
composer require "intervention/image:^4.0"
```

Enable GD or Imagick, then set the maximum width and quality.

```php
$file = FileMagic::fromUpload($image)
    ->resizeImage(maxWidth: 1600, quality: 82)
    ->store();
```

Call `resizeImage()` without arguments to use the configured `image.max_width` and `image.quality`.

JPEG, PNG, WebP, and BMP are processed when supported by the active driver. Resizing preserves
aspect ratio and never enlarges an image. Imagick is preferred when both Imagick and GD are available.

`resizeImage()` keeps the original bytes for non-images, GIF, SVG, unsupported formats, and known
decoding or encoding failures. Validate uploads separately when your app requires a valid image.

Width must be positive and quality must be `1` to `100`, even for non-image sources. Processing
a supported format without Intervention Image or an available driver throws
`ImageProcessingUnavailable`. Unexpected system errors are not swallowed.

Size and MIME restrictions are checked against the original source before image decoding or
resizing, then checked again against changed output before storage. An original image above
`maxSize()` is rejected even when resizing would have produced a smaller file.


