# API 參考

這裡列出 Laravel 應用程式會使用的方法與欄位。需要完整範例與行為時，可前往各段落
提供的說明頁面。

## 建立待儲存檔案

```php
FileMagic::fromUpload(UploadedFile $file): PendingFile
FileMagic::fromPath(string $path): PendingFile
FileMagic::fromContent(string $contents, ?string $originalFilename = null, ?string $mimeType = null): PendingFile
FileMagic::fromBase64(string $base64, ?string $originalFilename = null): PendingFile
FileMagic::fromUrl(string $url, ?RemoteFileOptions $options = null): PendingFile
FileMagic::text(string $text): PendingFile
FileMagic::json(array|JsonSerializable $data): PendingFile
FileMagic::csv(iterable $rows): PendingFile
```

- `fromUpload()`：接受 Laravel 上傳檔案。
- `fromPath()`：接受應用程式選擇的可讀本機路徑。
- `fromContent()`：接受文字或二進位內容。`$originalFilename` 與 `$mimeType` 是選用的
  來源資訊，儲存類型仍以內容為準。
- `fromBase64()`：接受 Base64 文字或 Base64 Data URI。
- `fromUrl()`：下載 HTTP(S) 檔案；`$options` 可調整這次下載的規則。
- `text()`、`json()`、`csv()`：產生可以像一般檔案一樣儲存的內容。

以上方法都回傳 `PendingFile`。完整說明請看[儲存檔案](/zh-TW/guide/storing-files)、
[遠端檔案](/zh-TW/guide/remote-files)及[文件與圖片](/zh-TW/guide/documents-and-images)。

## 設定並儲存 PendingFile

```php
$pending->onDisk(string $disk): self
$pending->inDirectory(string $directory): self
$pending->named(string|int $filename): self
$pending->visibility(FileVisibility $visibility): self
$pending->onCollision(CollisionPolicy $policy): self
$pending->maxSize(int $bytes): self
$pending->allowMimeTypes(array $mimeTypes): self
$pending->blockMimeTypes(array $mimeTypes): self
$pending->withMetadata(array $metadata): self
$pending->ownedBy(Model $owner): self
$pending->resizeImage(?int $maxWidth = null, ?int $quality = null): self
$pending->store(): StoredFile
```

- `onDisk()`：選擇 Laravel Filesystem disk。
- `inDirectory()`：選擇 disk 內的相對目錄。
- `named()`：設定不含副檔名的檔名。
- `visibility()`：選擇 `FileVisibility::Private` 或 `FileVisibility::Public`。
- `onCollision()`：路徑已存在時選擇 `Unique`、`Error` 或 `Overwrite`。
- `maxSize()`：設定這個檔案可接受的最大 bytes。
- `allowMimeTypes()`：這個檔案只接受指定 MIME types。
- `blockMimeTypes()`：這個檔案拒絕指定 MIME types。
- `withMetadata()`：將應用程式資料儲存在檔案紀錄的 `metadata` 欄位。
- `ownedBy()`：將檔案關聯至已儲存的 Eloquent Model。
- `resizeImage()`：設定支援圖片的最大寬度與輸出品質；參數為 `null` 時使用設定預設值。
- `store()`：儲存實體檔案並回傳 `StoredFile` 紀錄。

以下方法會回傳 `PendingFile` 目前設定的選項。回傳 `null` 代表尚未單獨設定，
`store()` 會使用套件預設值。

```php
$pending->source(): FileSource
$pending->disk(): ?string
$pending->directory(): ?string
$pending->filename(): ?string
$pending->fileVisibility(): ?FileVisibility
$pending->collisionPolicy(): ?CollisionPolicy
$pending->maximumSize(): ?int
$pending->allowedMimeTypes(): ?array
$pending->blockedMimeTypes(): ?array
$pending->metadata(): array
$pending->owner(): ?Model
$pending->imageOptions(): ?ImageOptions
```

`ImageOptions` 提供 public integer 欄位 `maxWidth` 與 `quality`。

## 尋找檔案

```php
FileMagic::find(int|string|StoredFile|array|Collection ...$targets): FileQuery
```

`$targets` 可使用 ID、UUID、已存在的 `StoredFile` Model、一維 array 及 Laravel
Collection，也能同時傳入多個不同類型的 targets。完整說明請看
[查詢檔案](/zh-TW/guide/querying-files)。

```php
$query->one(): ?StoredFile
$query->get(): Collection
$query->urls(): Collection
$query->exists(): bool
$query->url(): string
$query->temporaryUrl(?DateTimeInterface $expiration = null): string
$query->contents(): string
$query->readStream(): resource
$query->download(?string $name = null): StreamedResponse
$query->downloadZip(?string $name = null): BinaryFileResponse
$query->delete(): int
```

- `one()`：回傳第一筆符合的檔案紀錄，找不到時為 `null`。
- `get()`：以 `Collection<int, StoredFile>` 回傳全部符合的紀錄。
- `urls()`：回傳以 Model key 為索引的公開 URL；storage 上不存在的檔案會省略。
- `exists()`：確認第一筆符合的實體檔案是否存在。
- `url()`：取得第一筆符合檔案的公開 URL。
- `temporaryUrl()`：取得 temporary URL；`$expiration` 為 `null` 時使用設定的有效時間。
- `contents()`：以 string 取得第一筆符合檔案的完整內容。
- `readStream()`：取得第一筆符合檔案的 readable stream；使用完畢後必須關閉。
- `download()`：回傳 stream download；`$name` 可取代下載檔名。
- `downloadZip()`：將全部符合檔案回傳為 ZIP download；`$name` 設定 ZIP 檔名。
- `delete()`：刪除符合的實體檔案與紀錄，回傳完成刪除的數量。

除了 `one()` 與 `get()`，需要第一筆結果的方法在找不到紀錄時會拋出 `FileNotFound`。

## StoredFile 欄位

`StoredFile` 是儲存或查詢完成後取得的 Eloquent 紀錄。

| 欄位 | 型別 | 資料 |
| --- | --- | --- |
| `id` | `int` | Database key。 |
| `uuid` | `string` | 對外使用的唯一識別碼。 |
| `disk` | `string` | Laravel Filesystem disk。 |
| `path` | `string` | 相對於 disk 的完整路徑。 |
| `location_hash` | `string` | Disk 與 path 組合的識別值。 |
| `filename` | `string` | 不含副檔名的儲存檔名。 |
| `original_filename` | `?string` | 有提供時的原始檔名。 |
| `extension` | `string` | 儲存副檔名。 |
| `mime_type` | `string` | 檔案的 MIME type。 |
| `size` | `int` | 檔案 bytes。 |
| `checksum` | `?string` | 有提供時的 checksum。 |
| `visibility` | `FileVisibility` | Public 或 private visibility。 |
| `owner_type`, `owner_id` | `?string` | Polymorphic owner identifiers。 |
| `metadata` | `?array` | 與檔案一同儲存的應用程式資料。 |
| `created_at`, `updated_at` | `?Carbon` | 紀錄時間。 |
| `owner` | `?Model` | 關聯的 Eloquent Model。 |

## StoredFile 方法

```php
$file->owner(): MorphTo
$file->storage(): FilesystemAdapter
$file->existsOnDisk(): bool
$file->fullName(): string
$file->originalName(): string
$file->url(): string
$file->temporaryUrl(?DateTimeInterface $expiration = null): string
$file->contents(): string
$file->readStream(): resource
$file->download(?string $name = null): StreamedResponse
$file->delete(): ?bool
```

- `owner()`：提供 Eloquent owner relationship。
- `storage()`：取得 `disk` 對應的 Laravel Filesystem adapter。
- `existsOnDisk()`：確認 `path` 是否存在於 disk。
- `fullName()`：取得 `filename` 與 `extension` 組成的完整檔名。
- `originalName()`：取得 `original_filename`；沒有原始檔名時回傳 `fullName()`。
- URL、內容、stream、下載及刪除方法會操作這筆紀錄對應的實體檔案。

## RemoteFileOptions

`RemoteFileOptions` 用來調整單次 `fromUrl()` 下載，提供以下 public 欄位：

| 欄位 | 型別 | 預設 | 用途 |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | 要求有效的 HTTPS certificate。 |
| `allowHttp` | `bool` | `false` | 允許未加密 HTTP。 |
| `allowHtml` | `bool` | `false` | 允許 HTML 與 XHTML 內容。 |
| `connectTimeoutSeconds` | `int` | `5` | 最長連線時間。 |
| `timeoutSeconds` | `int` | `30` | 最長完整下載時間。 |
| `maxRedirects` | `int` | `3` | 最多 redirect 次數，範圍 `0` 至 `10`。 |
| `allowedHosts` | `list<string>` | `[]` | 精確 host allowlist；空陣列允許符合條件的 public hosts。 |
| `allowedPorts` | `list<int>` | `[80, 443]` | 允許的連線 ports。 |
| `allowedPrivateHosts` | `list<string>` | `[]` | 明確允許的 private hosts。 |

```php
RemoteFileOptions::withoutTlsVerification(): RemoteFileOptions
```

只有無法驗證 certificate 的受控環境才使用此 helper。它不會開啟 HTTP，也不會允許
private hosts。完整說明請看[遠端檔案](/zh-TW/guide/remote-files)。

## Enums

```php
FileVisibility::Private
FileVisibility::Public

CollisionPolicy::Unique
CollisionPolicy::Error
CollisionPolicy::Overwrite
```

`Unique` 在目標存在時更換檔名，`Error` 拒絕檔名碰撞，`Overwrite` 取代檔案並保持
相同 storage path。

## 例外結果方法

所有套件例外都繼承 `FileMagicException`。完整清單請看
[Model 與例外](/zh-TW/guide/models-and-exceptions)。

```php
$exception->deletedCount(): int
$exception->failedCount(): int
$exception->failedKeys(): array
```

`PartialFileDeletion` 的這些方法會取得完成數量、失敗數量，以及仍需處理的 Model keys。

```php
$exception->operationFailure(): Throwable
```

`FileRecoveryFailed::operationFailure()` 會取得觸發 Overwrite 還原的原始錯誤；
exception 的 previous error 則是還原失敗原因。
