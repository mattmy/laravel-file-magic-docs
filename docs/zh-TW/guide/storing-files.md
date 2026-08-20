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

Base64 採用嚴格解碼。無效或非標準化的內容會拋出 `InvalidBase64`；超限內容則會依解碼後大小在解碼前拋出 `FileTooLarge`。合法內容會以有界線的區塊解碼至暫存 stream：編碼後輸入保留於記憶體，解碼後 bytes 使用暫存磁碟空間。編碼後輸入本身很大時，請優先使用 upload 或本機路徑來源。


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

儲存目錄必須是使用 forward slash 分隔的 canonical 相對路徑；空字串代表 disk root。
前後 separator、backslash、重複 separator、segment 前後空白、control 或 Windows unsafe
字元、`.`、`..` 與 Windows 保留名稱都會被拒絕，不會被自動正規化。檔名套用相同的
字元與保留名稱規則，且不可用 dot 開頭或結尾。

### 檔名碰撞策略

```php
CollisionPolicy::Unique;
CollisionPolicy::Error;
CollisionPolicy::Overwrite;
```

- `Unique`：目標路徑已存在時，自動加入隨機字串。
- `Error`：目標路徑已存在時拋出 `FileWriteFailed`。
- `Overwrite`：覆寫既有實體檔案並更新同一筆資料庫紀錄。

`Overwrite` 在取代失敗時會盡量保留原有檔案。它需要接近原檔案大小的本機暫存空間，
也會增加 storage 與 disk 操作，因此比一般儲存慢。除非 storage path 必須保持不變，
否則建議使用預設的 `Unique`。如果取代與還原都失敗，會拋出 `FileRecoveryFailed`。

Collision lock 預設停用；這能維持相容性，但不保護 concurrent writers 的 TOCTOU 競爭。當
`collision_lock.enabled` 為 `true` 時，所有 collision policy 都會在持有候選 disk 與 path 的
atomic cache lock 時判斷目標是否存在。File write、database record，以及任何 delete 或 restore
補償完成前都不會釋放 lock。這會協調使用同一 lock backend 的 FileMagic writers。若無法在
`collision_lock.wait_seconds` 內取得 lock，會在檢查或變更目標前拋出 `FileWriteFailed`。


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
最終輸出。FileMagic 使用 `finfo` 偵測內容，不信任瀏覽器提供的 MIME header。


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
    ->with('files')
    ->findOrFail($postId);

$attachment = $post->files->firstOrFail();

return FileMagic::find($attachment)->download();
```

傳入既有的 `StoredFile` Model 不會再次執行資料庫查詢。

`owner_id` 使用字串欄位，因此可支援整數、UUID 與 ULID 主鍵。


