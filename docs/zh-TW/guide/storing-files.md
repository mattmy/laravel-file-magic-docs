# 儲存檔案

## 儲存上傳檔案

將檔案傳給 FileMagic 前，仍應先在 HTTP 邊界進行 Laravel request validation：

```php
use Illuminate\Http\Request;
use Mattmy\FileMagic\Facades\FileMagic;

public function store(Request $request)
{
    $validated = $request->validate([
        'document' => ['required', 'file', 'max:10240'],
    ]);

    $file = FileMagic::fromUpload($validated['document'])->store();

    return response()->json($file);
}
```

FileMagic 會再次根據檔案內容進行檢查。Laravel request validation 與套件內部檢查保護的是不同的信任邊界，不應省略其中任何一層。


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

### 一般 Base64

```php
$file = FileMagic::fromBase64(
    base64: \base64_encode($contents),
    originalFilename: 'document.pdf',
)->store();
```

Data URI 前綴是選用的。省略前綴時，FileMagic 會根據解碼後的實際內容偵測 MIME type，不需要呼叫端自行提供。

### Base64 Data URI

```php
$file = FileMagic::fromBase64(
    base64: 'data:text/plain;base64,'.\base64_encode('Hello'),
    originalFilename: 'hello.txt',
)->store();
```

Base64 採用嚴格解碼。無效或非標準化的內容會拋出 `InvalidBase64`。

Base64 字串本身及解碼後的內容都會占用記憶體。大型檔案應優先使用 upload 或本機路徑來源。


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

儲存目錄必須是相對路徑。絕對路徑、Windows drive path、null byte、`.` 與 `..` 都會被拒絕。

### 檔名碰撞策略

```php
CollisionPolicy::Unique;
CollisionPolicy::Error;
CollisionPolicy::Overwrite;
```

- `Unique`：目標路徑已存在時，自動加入隨機字串。
- `Error`：目標路徑已存在時拋出 `FileWriteFailed`。
- `Overwrite`：覆寫既有實體檔案並更新同一筆資料庫紀錄。

`Overwrite` 會先把完整舊 object 以 stream 落地備份到 PHP 伺服器的本機暫存硬碟。
如果新內容寫入 storage 或更新 database 失敗，FileMagic 會先還原原始內容及
visibility，再回報原本的失敗。操作結束後會關閉並刪除暫存備份。

這項安全機制會產生成本：伺服器需要接近舊檔案大小的本機暫存空間，而且會增加
storage 讀取及本機硬碟 I/O，因此 `Overwrite` 的整體效能會低於一般儲存。除非應用
程式確實需要維持相同 storage path，否則建議使用預設的 `Unique`。


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

單次操作的設定會覆寫對應的全域設定。FileMagic 使用 `finfo` 偵測內容，不信任瀏覽器提供的 MIME header。


## 附加 metadata

Metadata 會轉換為陣列並以 JSON 儲存：

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

任何已儲存的 Eloquent Model 都可以成為檔案 owner：

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

從 owner model eager load relation，再把已取得的 File Model 傳給 FileMagic：

```php
$post = Post::query()
    ->with('attachment')
    ->findOrFail($postId);

return FileMagic::find($post->attachment)->download();
```

傳入既有的 `StoredFile` Model 不會再次執行資料庫查詢。

`owner_id` 使用字串欄位，因此可支援整數、UUID 與 ULID 主鍵。


