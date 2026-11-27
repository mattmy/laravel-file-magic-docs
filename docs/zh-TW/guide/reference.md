# API 參考

## 建立待儲存檔案

```php
FileMagic::fromUpload(UploadedFile $file): PendingFile
FileMagic::fromPath(string $path): PendingFile
FileMagic::fromContent(string $contents, ?string $originalFilename = null, ?string $mimeType = null): PendingFile
FileMagic::fromGeneratedContent(string $contents, ?string $originalFilename = null, ?string $mimeType = null): PendingFile
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
- `fromGeneratedContent()`：接受應用程式自行產生且能保證格式的內容。Symfony 找得到對應的
  副檔名時，FileMagic 會採用傳入的 MIME 類型來套用規則及決定副檔名。沒有對應或未提供 MIME 時，
  改由 `fromContent()` 偵測內容。原始檔名用於顯示及下載，儲存檔名可用 `named()` 設定。
  請勿對不可信任的內容使用可信任 MIME。完整 `$contents` 字串會占用 PHP 記憶體。
- `fromBase64()`：接受 Base64 文字或 Base64 Data URI。
- `fromUrl()`：建立 HTTP(S) 來源，在 `store()` 時才下載；`$options` 可調整這次下載的規則。
- `text()`、`json()`、`csv()`：產生可以像一般檔案一樣儲存的內容。

使用範例請見[儲存檔案](/zh-TW/guide/storing-files)、[遠端檔案](/zh-TW/guide/remote-files)及
[文件與圖片](/zh-TW/guide/documents-and-images)。

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

- `onDisk()`：選擇已設定的 Laravel Filesystem disk，disk 名稱不可為空字串。
- `inDirectory()`：選擇以 `/` 分隔、相對於 disk 的目錄；空字串代表根目錄。不安全或模糊路徑會拋出 `InvalidStoragePath`。
- `named()`：設定檔名主體，保留其中的點號，再依 MIME 類型附加副檔名。
  名稱不安全、屬於保留名稱、為空字串或超過 200 字元時，會拋出 `InvalidFileName`。
- `visibility()`：選擇 `FileVisibility::Private` 或 `FileVisibility::Public`。
- `onCollision()`：路徑已存在時選擇 `Unique`、`Error` 或 `Overwrite`。
- `maxSize()`：以正整數設定原始輸入與最終儲存結果可接受的最大 bytes。
- `allowMimeTypes()` 只接受清單中的 MIME 類型。空清單不額外限制，清單中的項目須為非空字串。
- `blockMimeTypes()` 拒絕清單中的 MIME 類型。清單可以為空，清單中的項目須為非空字串。
- `withMetadata()`：將應用程式資料儲存在檔案紀錄的 `metadata` 欄位。
  覆寫時會取代整份 metadata。省略可保留原值，傳入 `[]` 可清空。
- `ownedBy()`：關聯已儲存且主鍵為整數或非空字串的 Eloquent Model，否則拋出 `InvalidFileOwner`。
  覆寫時省略此選項會保留原擁有者。
- `resizeImage()`：設定支援圖片的最大寬度與輸出品質；參數為 `null` 時使用設定預設值，
  寬度必須為正整數，品質必須介於 `1` 至 `100`。
- `store()`：儲存實體檔案並回傳 `StoredFile` 紀錄。

## 尋找檔案

```php
FileMagic::find(mixed ...$targets): FileQuery
```

可傳入 ID、十進位 ID 字串、UUID 或已儲存的 `StoredFile` Model。可將不同類型混合傳入，或放在一維陣列
及 Laravel Collection 中。FileMagic 會略過無效純量。詳見
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
- `download()` 以串流傳送檔案。預設使用清理過的原始檔名，沒有可用的原始檔名時使用儲存檔名。可用 `$name` 自訂名稱。
- `downloadZip()`：將全部符合檔案回傳為 ZIP 下載；`$name` 設定 ZIP 檔名。
- `delete()`：刪除符合的實體檔案與紀錄，回傳完成刪除的數量。

沒有紀錄時，`one()` 回傳 `null`，`get()` 和 `urls()` 回傳空 Collection，`delete()` 回傳 `0`。
`exists()` 等單檔操作會拋出 `FileNotFound`。`downloadZip()` 也至少需要一筆紀錄，
並會先檢查 `ext-zip` 是否可用。

## StoredFile 欄位

`StoredFile` 是儲存或查詢完成後取得的 Eloquent 紀錄。

| 欄位 | 型別 | 資料 |
| --- | --- | --- |
| `id` | `int` | 資料庫主鍵。 |
| `uuid` | `string` | 對外使用的唯一識別碼。 |
| `disk` | `string` | Laravel Filesystem disk。 |
| `path` | `string` | 相對於磁碟根目錄的路徑。 |
| `location_hash` | `string` | 磁碟與路徑組合的識別值。 |
| `filename` | `string` | 儲存檔名的主體，尚未附加套件決定的副檔名。 |
| `original_filename` | `?string` | 有提供時的原始檔名。 |
| `extension` | `string` | 儲存副檔名。 |
| `mime_type` | `string` | 檔案的 MIME 類型。 |
| `size` | `int` | 檔案大小，單位為位元組。 |
| `checksum` | `?string` | 有提供時的檔案校驗值。 |
| `visibility` | `FileVisibility` | 公開或私人可見性。 |
| `owner_type`, `owner_id` | `?string` | 多型關聯的擁有者類型與識別碼。 |
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
$file->temporaryUrl(DateTimeInterface $expiration): string
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
- Model 的 `temporaryUrl()` 必須明確傳入到期時間；要使用 `temporary_url_ttl`，請改用
  `FileMagic::find($target)->temporaryUrl()`。
- URL、內容、stream、下載及刪除方法會操作這筆紀錄對應的實體檔案。

## RemoteFileOptions

`RemoteFileOptions` 用來調整單次 `fromUrl()` 下載，提供以下 public 欄位：

| 欄位 | 型別 | 預設 | 用途 |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | 要求有效的 HTTPS certificate。 |
| `allowHttp` | `bool` | `false` | 允許未加密 HTTP。 |
| `allowHtml` | `bool` | `false` | 允許 HTML 與 XHTML 內容。 |
| `connectTimeoutSeconds` | `int` | `5` | 最長連線時間。 |
| `timeoutSeconds` | `int` | `30` | 每次 HTTP 請求的最長秒數。 |
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

`Unique` 在目標存在時更換檔名，`Error` 遇到相同路徑時拋出例外，`Overwrite` 在原路徑取代檔案。

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

`FileRecoveryFailed::operationFailure()` 會取得觸發補償的原始錯誤；`getPrevious()` 則是
舊檔案還原或新檔案清理失敗的原因。
