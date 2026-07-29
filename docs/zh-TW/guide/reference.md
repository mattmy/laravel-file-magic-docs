# 參考資料

## 測試

搭配 Laravel fake storage：

```php
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mattmy\FileMagic\Facades\FileMagic;

Storage::fake('documents');

$file = FileMagic::fromUpload(
    UploadedFile::fake()->createWithContent('notes.txt', 'hello'),
)->onDisk('documents')->store();

Storage::disk('documents')->assertExists($file->path);

expect($file->contents())->toBe('hello');
```

需要進行 database assertion 時，請使用 `RefreshDatabase` 並確保測試環境已載入套件 migration。


## 效能注意事項

- Upload 與本機路徑會使用 stream 檢查及儲存。
- Checksum 會分段計算。
- `contents()` 會將整個檔案載入記憶體，大型檔案應使用 `readStream()`。
- Base64 一定會使用額外記憶體。
- 圖片解碼後的記憶體用量可能遠高於壓縮檔案大小。
- `Overwrite` 會將完整舊 object 落地到本機暫存硬碟並增加額外 I/O；不需要固定 path 時應優先使用 `Unique`。
- ZIP 下載會使用本機暫存空間，最高可能同時包含未壓縮來源檔案及 archive。
- URL 匯入只執行一次同步 streaming GET，並使用最高接近下載檔案大小的本機暫存空間。
- 應依呼叫流程的可靠性需求設定 URL connect timeout 與 total timeout。
- 將多個目標一次傳給 `find()`，套件會合併資料庫查詢。
- 大量查詢應使用 `find()`，大量刪除應使用 `FileQuery::delete()`。


## 安全性注意事項

- 每個儲存、讀取、下載及刪除操作都必須先進行 authorization。
- 在套件前保留 Laravel request validation。
- 將原始檔名與 client MIME type 視為不可信任的 metadata。
- 高敏感度上傳流程應採用 MIME type 白名單。
- 從同一網域提供檔案時，應考慮封鎖 HTML 與 SVG。
- 私密檔案應放在 private disk，並使用短效 temporary URL。
- 不要把使用者控制的伺服器路徑直接傳給 `fromPath()`。
- 對敏感或大型檔案啟用 `Overwrite` 前，確認 PHP 系統暫存目錄的權限及可用容量。
- ZIP 下載前必須先對每個 target 進行 authorization。
- 除了 `max_size`，也應設定 Web Server 與 PHP request limit。
- 威脅模型有需求時，應額外串接防毒掃描服務。
- URL 匯入預設驗證 TLS，除非明確開啟，否則拒絕 HTTP。
- URL 匯入封鎖 SSRF target 並重新驗證每個 redirect；正式環境仍應搭配 outbound firewall。
- 下載的 HTML 與其他 active content 應保持 private，並以 attachment 與 `nosniff` 提供。


## API 參考

### `FileMagic`

```php
fromUpload(UploadedFile $file): PendingFile
fromPath(string $path): PendingFile
fromUrl(string $url, ?RemoteFileOptions $options = null): PendingFile
fromContent(string $contents, ?string $originalFilename = null, ?string $mimeType = null): PendingFile
fromBase64(string $base64, ?string $originalFilename = null): PendingFile
text(string $text): PendingFile
json(array|\JsonSerializable $data): PendingFile
csv(iterable $rows): PendingFile
find(int|string|StoredFile|array|Collection ...$targets): FileQuery
```

### `PendingFile`

```php
onDisk(string $disk): self
inDirectory(string $directory): self
named(string|int $filename): self
visibility(FileVisibility $visibility): self
onCollision(CollisionPolicy $policy): self
maxSize(int $bytes): self
allowMimeTypes(array $mimeTypes): self
blockMimeTypes(array $mimeTypes): self
withMetadata(array $metadata): self
ownedBy(Model $owner): self
resizeImage(?int $maxWidth = null, ?int $quality = null): self
store(): StoredFile
```

### `FileQuery`

```php
one(): ?StoredFile
get(): Collection
urls(): Collection
exists(): bool
url(): string
temporaryUrl(?DateTimeInterface $expiration = null): string
contents(): string
readStream(): resource
download(?string $name = null): StreamedResponse
downloadZip(?string $name = null): BinaryFileResponse
delete(): int
```

`get()` 回傳 `Illuminate\Support\Collection<int, StoredFile>`，可直接使用 `map()`、`filter()`、`groupBy()`、`pluck()`、`values()` 等 Laravel Collection 方法。涉及檔案系統的批次行為仍應保留在 `FileQuery`，請在捨棄 query 物件前呼叫 `urls()` 或 `delete()`。


## 常見問題

### MIME type 與瀏覽器提供的值不同

這是正常行為。FileMagic 信任 `finfo` 根據檔案內容偵測的結果，而不是瀏覽器提供的 MIME type。

### 檔案被指定為 `.bin`

Symfony Mime 找不到偵測到的 MIME type 所對應的副檔名。請檢查紀錄中的 `mime_type`，再決定該工作流程是否應允許這種檔案。

### 本機 temporary URL 無法使用

在 Laravel local disk 啟用 `serve => true`，或改用支援 temporary URL 的 driver。

### 圖片處理拋出 `ImageProcessingUnavailable`

安裝 `intervention/image` 並啟用 GD 或 Imagick。非圖片與不支援格式會自動略過圖片處理，不會拋出此例外。

### 實體檔案被外部系統移除

`existsOnDisk()` 會回傳 `false`；`contents()` 與 `readStream()` 會拋出 `FileNotFound`。外部 storage 變更應由應用程式專用的維護流程進行同步。

### 發佈 migration 後檔名包含時間

Service Provider 會為發佈的 migration 加上 timestamp，確保 Laravel 按正確順序執行。每個專案只需發佈一次，並將產生的 migration 納入版本控制。

### ZIP 下載功能無法使用

請安裝並啟用 PHP `ext-zip`，同時確認 PHP process 可以寫入系統暫存目錄，且暫存
空間足以容納來源檔案及 ZIP archive。

### 一般官網網址被拒絕

網頁會偵測為 HTML 並預設拒絕。只有確實要保存 HTML 時，才使用
`new RemoteFileOptions(allowHtml: true)`。FileMagic 會將允許的內容保存為 HTML，
不會靜默轉換為 TXT。

### 開發環境的 HTTPS certificate 驗證失敗

應優先修正 certificate。只有受控環境可傳入
`RemoteFileOptions::withoutTlsVerification()`。這會降低 TLS authenticity，但不會
開啟 HTTP、private network、任意 port 或不安全 redirect。


## 授權

FileMagic 是使用 [MIT License](https://github.com/mattmy/laravel-file-magic/blob/main/LICENSE) 發佈的開源軟體。


## 專案維護

- 提交 Pull Request 前請閱讀 [CONTRIBUTING.md](https://github.com/mattmy/laravel-file-magic/blob/main/CONTRIBUTING.md)。
- 安全性問題請依照 [SECURITY.md](https://github.com/mattmy/laravel-file-magic/blob/main/SECURITY.md) 私下回報。
- 發布版本遵守 [Semantic Versioning](https://semver.org/)，變更內容記錄於
  [CHANGELOG.md](https://github.com/mattmy/laravel-file-magic/blob/main/CHANGELOG.md)。

