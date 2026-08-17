# Documents and images

## Generate TXT, JSON, and CSV documents

Create a UTF-8 TXT document:

```php
$file = FileMagic::text("First line\nSecond line")
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('notes')
    ->store();
```

`text()` preserves the input exactly, including whitespace and line endings. An empty string creates an empty `.txt` file.

Create a readable JSON document from an array or `JsonSerializable` object:

```php
$file = FileMagic::json([
    'message' => 'Hello',
    'items' => ['First', 'Second'],
])
    ->named('messages')
    ->store();
```

JSON uses pretty printing, preserves Unicode and unescaped slashes, and ends with a newline.

Create a CSV document:

```php
$file = FileMagic::csv([
    ['name' => 'First', 'content' => 'Hello'],
    ['name' => 'Second', 'content' => 'Hello again'],
])
    ->named('messages')
    ->store();
```

Associative rows use the first row's keys as a header. List rows do not generate a header. Every row must use the same keys in the same order, and every value must be scalar or `null`. CSV uses UTF-8 without a BOM, comma delimiters, double-quote enclosures, and CRLF line endings.

All three methods return `PendingFile`, so disk, directory, filename, visibility, collision,
owner, metadata, MIME, and size options remain available. Call `store()` to save the document;
the result is a normal `StoredFile` that works with every `FileQuery` operation.

Invalid UTF-8, JSON values that cannot be encoded, and inconsistent CSV rows throw `InvalidDocumentData`.


## Image resizing

```bash
composer require "intervention/image:^4.0"
```

With GD or Imagick enabled:

```php
$file = FileMagic::fromUpload($image)
    ->resizeImage(maxWidth: 1600, quality: 82)
    ->store();
```

Call `resizeImage()` without arguments to use `image.max_width` and `image.quality` from the configuration:

```php
$file = FileMagic::fromUpload($image)
    ->resizeImage()
    ->store();
```

JPEG, PNG, WebP, and BMP are processed when supported by the active driver. `resizeImage()` is best-effort: non-images, GIF, SVG, unsupported formats, and content that Intervention Image cannot decode or encode are stored unchanged without an image-processing error. Invalid resize options and missing Intervention Image, GD, or Imagick still produce explicit exceptions when a supported image requires processing.

Size and MIME restrictions are checked against the original source before image decoding or
resizing, then checked again against changed output before storage. An original image above
`maxSize()` is rejected even when resizing would have produced a smaller file.


