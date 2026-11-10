# 儲存檔案

## 儲存上傳檔案

將 Laravel 的 `UploadedFile` 傳給 `fromUpload()`。

```php
$file = FileMagic::fromUpload($uploadedFile)->store();
```

呼叫 `store()` 時，FileMagic 會套用自己的大小上限，並從檔案內容偵測 MIME 類型。


## 從其他來源儲存

### 本機路徑

路徑必須指向可讀取的本機檔案：

```php
$file = FileMagic::fromPath(storage_path('imports/report.pdf'))
    ->inDirectory('reports')
    ->store();
```

只能傳入由應用程式信任並選擇的路徑。不要直接把使用者提交的任意伺服器路徑傳入 `fromPath()`。

### 字串或二進位內容

```php
$file = FileMagic::fromContent(
    contents: $pdfContents,
    originalFilename: 'invoice.pdf',
    mimeType: 'application/pdf',
)->inDirectory('invoices')->store();
```

傳入的 MIME type 只會被視為來源提示。實際儲存的 MIME type 與副檔名會根據檔案內容重新偵測。

由應用程式產生、且應用程式能保證格式的內容，可以提供可信任 MIME type：

```php
$file = FileMagic::fromGeneratedContent(
    contents: $dxfContents,
    originalFilename: 'drawing.dxf',
    mimeType: 'image/vnd.dxf',
)->named('drawing')->store();
```

Symfony 找得到對應的副檔名時，FileMagic 才會採用傳入的 MIME 類型。例如 `image/vnd.dxf`
對應 `.dxf`。省略 MIME 或傳入找不到對應的值（如 `application/dxf`）時，會沿用
`fromContent()` 的內容偵測。找不到對應的值仍只作為來源提示。

副檔名對應無法確認內容格式或安全性。要儲存 HTTP 請求的原始內容，請使用
`fromContent($request->getContent())`。請勿把原始內容和請求的 `Content-Type` 標頭一起傳給
`fromGeneratedContent()`。
兩種方法的完整 `$contents` 字串都會占用 PHP 記憶體。大型檔案請依來源改用上傳、本機路徑或遠端網址。

### 一般 Base64

```php
$file = FileMagic::fromBase64(
    base64: \base64_encode($contents),
    originalFilename: 'document.pdf',
)->store();
```

可傳入純 Base64，或使用 `data:<mime>;base64,<payload>` 格式。Data URI 若省略 MIME 類型
或帶有 `charset` 等參數，會拋出 `InvalidBase64`。FileMagic 會依解碼後的內容判斷儲存用的
MIME 類型與副檔名。

### Base64 Data URI

```php
$file = FileMagic::fromBase64(
    base64: 'data:text/plain;base64,'.\base64_encode('Hello'),
    originalFilename: 'hello.txt',
)->store();
```

請使用 `base64_encode()` 產生的標準字元和填補字元（padding）。若使用 URL-safe Base64、
缺少填補字元，或含有空白或換行，`fromBase64()` 會拋出 `InvalidBase64`。呼叫 `store()` 時，
FileMagic 會先檢查解碼後的大小，超出上限就拋出 `FileTooLarge`。解碼會分段寫入暫存檔，
編碼字串仍占用 PHP 記憶體。大型檔案請優先使用上傳或本機路徑。


## 自訂儲存方式

```php
use Mattmy\FileMagic\Enums\CollisionPolicy;
use Mattmy\FileMagic\Enums\FileVisibility;

$file = FileMagic::fromUpload($uploadedFile)
    ->onDisk('s3')
    ->inDirectory('accounts/42/contracts')
    ->named('signed-contract')
    ->visibility(FileVisibility::Private)
    ->onCollision(CollisionPolicy::Unique)
    ->store();
```

`named()` 接受不含副檔名的檔名。副檔名會由 FileMagic 根據可信任的 MIME type 決定。

儲存目錄必須使用 `/` 分隔，且相對於 disk 根目錄；空字串代表根目錄。
路徑開頭或結尾的 `/`、反斜線、重複的 `/`、每段前後的空白、控制字元、Windows
不允許的字元、`.`、`..` 與 Windows 保留名稱都會被拒絕，不會自動修正。
檔名也有相同限制，且不可用 `.` 開頭或結尾。

### 檔名碰撞策略

```php
CollisionPolicy::Unique;
CollisionPolicy::Error;
CollisionPolicy::Overwrite;
```

- `Unique`：目標路徑已存在時，自動加入隨機字串。
- `Error`：目標路徑已存在時拋出 `FileWriteFailed`。
- `Overwrite`：覆寫既有實體檔案並更新同一筆資料庫紀錄。

`Overwrite` 會先備份舊內容與可見性，再寫入新內容。寫入或儲存紀錄失敗時，會嘗試還原備份。
這不是原子替換，其他讀取者仍可能在寫入途中存取該路徑。除了新來源的快照，
還需要接近舊檔案大小的本機備份空間。除非 storage path 必須保持不變，
否則建議使用預設的 `Unique`。如果取代與還原都失敗，會拋出 `FileRecoveryFailed`。

路徑鎖定預設關閉。將 `collision_lock.enabled` 設為 `true` 後，FileMagic 會先鎖住候選路徑，
再檢查檔案是否存在，直到檔案寫入、紀錄儲存與必要的還原或清理都完成才釋放鎖。
等待超過 `collision_lock.wait_seconds` 時，會在操作該路徑前拋出 `FileWriteFailed`。
儲存、批次刪除與稽核清理如何共用鎖，請參考[設定參考](/zh-TW/guide/configuration)。


## 檔案大小與 MIME type 限制

限制單次操作的檔案大小：

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->maxSize(10 * 1024 * 1024)
    ->store();
```

設定單次操作的 MIME type 白名單：

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->allowMimeTypes([
        'application/pdf',
        'image/jpeg',
        'image/png',
    ])
    ->store();
```

設定單次操作的 MIME type 黑名單：

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->blockMimeTypes([
        'image/svg+xml',
        'text/html',
    ])
    ->store();
```

單次操作的設定會覆寫對應的全域設定。`maxSize()` 同時限制原始輸入與圖片處理後的
最終輸出。一般來源使用 `finfo` 偵測內容，不信任瀏覽器提供的 MIME header；內建文件與
可識別 MIME 的 `fromGeneratedContent()` 則使用宣告的可信任 MIME。封鎖清單優先於允許清單；
允許清單為空時不額外限制類型。


## 附加 metadata

傳入的 metadata 陣列會以 JSON 儲存：

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->withMetadata([
        'category' => 'invoice',
        'year' => 2026,
    ])
    ->store();
```

Metadata 必須可以被 JSON 序列化，而且不應包含密碼、token 或其他機密資料。


## 關聯 owner

已儲存的 Eloquent Model 可以成為檔案 owner。主鍵必須是整數或非空字串，否則
`ownedBy()` 會立即拋出 `InvalidFileOwner`，不會讀寫檔案：

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->ownedBy($user)
    ->store();

$owner = $file->owner;
```

可以在 owner model 增加反向關聯：

```php
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Mattmy\FileMagic\Models\StoredFile;

public function files(): MorphMany
{
    return $this->morphMany(StoredFile::class, 'owner');
}
```

先從 owner Model 預先載入附件，再把檔案 Model 傳給 FileMagic：

```php
$post = Post::query()
    ->with('files')
    ->findOrFail($postId);

$attachment = $post->files->firstOrFail();

return FileMagic::find($attachment)->download();
```

將既有的 `StoredFile` Model 傳給 `find()` 時，會執行一筆套用 scope 的查詢以取得目前的
紀錄。預先載入可一次取得附件，但不會省略這筆查詢；傳入 Model 的其他屬性與已載入關聯
不會被沿用。若已設定自訂檔案 Model，反向關聯也應使用該類別。

`owner_id` 使用字串欄位，因此可支援整數、UUID 與 ULID 主鍵。


