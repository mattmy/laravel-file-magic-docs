# 遠端檔案

## 從網址儲存檔案

這項選用功能需要 PHP `ext-curl`。未啟用時，遠端檔案呼叫 `store()` 會拋出
`RemoteDownloadUnavailable`；上傳、本機來源、產生文件及既有檔案操作仍可使用。
可以執行 `php --ri curl` 確認 CLI 環境。

`fromUrl()` 接受絕對 HTTP 或 HTTPS 檔案網址，並回傳一般的 `PendingFile`。預設只接受
HTTPS，而且會驗證 TLS certificate：

```php
use Mattmy\FileMagic\Facades\FileMagic;

$file = FileMagic::fromUrl(
    'https://downloads.example.com/manual.pdf',
)
    ->onDisk('s3')
    ->inDirectory('manuals')
    ->named('product-manual')
    ->maxSize(20 * 1024 * 1024)
    ->withMetadata(['source' => 'vendor'])
    ->store();
```

支援的常見網址例如：

```text
https://cdn.example.com/images/avatar.jpg
https://downloads.example.com/documents/manual.pdf
https://media.example.com/videos/introduction.mp4
https://files.example.com/archive.zip
```

只支援 HTTP(S)。`file:`、`ftp:`、`gopher:`、`data:`、包含帳號密碼或 fragment 的
網址、不允許的 port，以及解析到受保護網路的網址都會被拒絕。

### RemoteFileOptions

單次下載需要不同規則時，傳入 `RemoteFileOptions`：

```php
use Mattmy\FileMagic\Data\RemoteFileOptions;

$options = new RemoteFileOptions(
    verifyTls: true,
    allowHttp: false,
    allowHtml: false,
    connectTimeoutSeconds: 5,
    timeoutSeconds: 30,
    maxRedirects: 3,
    allowedHosts: ['downloads.example.com'],
    allowedPorts: [80, 443],
    allowedPrivateHosts: [],
);

$file = FileMagic::fromUrl(
    'https://downloads.example.com/report.pdf',
    $options,
)->store();
```

傳入 `RemoteFileOptions` 時，該物件會取代這次操作的 `remote` 全域預設值，不會與
設定檔合併。請在物件中完整列出該請求需要的非預設 host、port 與 timeout。

| Option | 型別 | 預設值 | 行為 |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | 驗證 HTTPS certificate、hostname 與 certificate chain |
| `allowHttp` | `bool` | `false` | 明確允許未加密 HTTP |
| `allowHtml` | `bool` | `false` | 允許偵測為 HTML 或 XHTML 的內容 |
| `connectTimeoutSeconds` | `int` | `5` | 連線逾時，必須大於零 |
| `timeoutSeconds` | `int` | `30` | 完整下載逾時，不得小於連線逾時 |
| `maxRedirects` | `int` | `3` | `0` 至 `10`，每一跳都重新驗證 |
| `allowedHosts` | `list<string>` | `[]` | 精確 host allowlist；空陣列允許通過檢查的 public host |
| `allowedPorts` | `list<int>` | `[80, 443]` | 不可為空，每個值必須介於 `1` 至 `65535` |
| `allowedPrivateHosts` | `list<string>` | `[]` | 明確允許解析到 private address 的精確 host |

清單包含 port `80` 不代表預設會允許 HTTP；預設 `allowHttp: false` 仍會拒絕 HTTP。
如需使用標準 HTTP，不必重複設定預設 port：

```php
$file = FileMagic::fromUrl(
    'http://downloads.example.com/manual.pdf',
    new RemoteFileOptions(allowHttp: true),
)->store();
```

非標準 port 必須明確加入：

```php
$file = FileMagic::fromUrl(
    'https://downloads.example.com:8443/manual.pdf',
    new RemoteFileOptions(allowedPorts: [80, 443, 8443]),
)->store();
```

`allowedPorts` 空陣列是無效設定，絕不代表允許全部 port。Host 名單不區分大小寫，
並使用完整名稱比對。`allowedHosts: []` 只允許通過全部 DNS 與 IP 檢查的 public host；private
network 仍會被封鎖，除非精確 host 已列在 `allowedPrivateHosts`。

### TLS 驗證

TLS 驗證預設開啟。FileMagic 不會靜默關閉驗證，也不會把 HTTPS 降級為 HTTP。在受控
的開發或內部環境使用 self-signed certificate 時，可以明確停用：

```php
$file = FileMagic::fromUrl(
    'https://development.example.test/manual.pdf',
    RemoteFileOptions::withoutTlsVerification(),
)->store();
```

> **安全警告：**停用 TLS 驗證後，中間人可能替換下載內容。請勿在 public 或不可信任
> 網路使用。這個選項不會開啟 HTTP，也不會停用 SSRF 防護。

如需同時自訂其他項目：

```php
$options = new RemoteFileOptions(
    verifyTls: false,
    timeoutSeconds: 60,
    allowedHosts: ['development.example.test'],
);
```

### 官網與 HTML 回應

一般官網通常回傳 `text/html`，而不是可下載文件。FileMagic 預設會拒絕偵測為
`text/html` 或 `application/xhtml+xml` 的內容並拋出 `DisallowedMimeType`，不會把
網頁原始碼偽裝成 `.txt`。

確實需要保存 HTML 時：

```php
use Mattmy\FileMagic\Enums\FileVisibility;

$file = FileMagic::fromUrl(
    'https://www.example.com/page',
    new RemoteFileOptions(allowHtml: true),
)
    ->visibility(FileVisibility::Private)
    ->store();
```

允許後會使用實際 HTML MIME 與 `.html` 儲存。HTML 從應用程式同源顯示時可能執行
script；除非應用程式會隔離並清理內容，否則應保持 private 並以 attachment 下載。
`allowHtml: true` 只會略過遠端 HTML 專用的拒絕規則；一般的
`allowed_mime_types`、`blocked_mime_types`、`allowMimeTypes()` 與
`blockMimeTypes()` 規則仍然有效。

### 網址下載的安全性與效能

FileMagic 會封鎖 local、private、reserved 與 cloud metadata destinations，redirect
後也會重新檢查。`allowedPrivateHosts` 可以允許指定的已知內部服務，但不會一次允許
所有 private network destinations。

遠端 response headers 與 URL filename 都是不可信任提示；MIME 與 extension 由下載
內容判斷。`Content-Length` 可提前拒絕過大回應，但實際串流 bytes 仍一定受到
`maxSize()` 或全域 `max_size` 限制。

遠端下載會使用接近下載檔案大小的本機暫存空間，完成前也會持續占用目前的 PHP
worker。大型或緩慢下載建議使用 queue；正式環境仍應搭配 outbound firewall。

儲存完成不代表內容一定無惡意。處理不可信任或高風險來源時，建議使用 private
visibility、attachment download、MIME allowlist、`X-Content-Type-Options: nosniff`
以及 antivirus／content scanning service。


