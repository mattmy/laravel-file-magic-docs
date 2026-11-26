# 遠端檔案

## 從網址儲存檔案

這項選用功能需要 PHP `ext-curl`。未啟用時，遠端檔案呼叫 `store()` 會拋出
`RemoteDownloadUnavailable`；上傳、本機來源、產生文件及既有檔案操作仍可使用。
可以執行 `php --ri curl` 確認 CLI 環境。

`fromUrl()` 接受絕對網址，回傳 `PendingFile`。呼叫 `store()` 才會開始下載。
FileMagic 預設要求使用 HTTPS，並驗證憑證。

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

請使用 HTTPS，或針對單次下載明確允許 HTTP。內嵌帳號密碼或含有片段（`#fragment`）的網址會被拒絕。

連線至 IPv6 伺服器時，請使用網域名稱。若網址直接以方括號內的 IPv6 位址作為主機，會拋出 `InvalidRemoteUrl`。

### RemoteFileOptions

單次下載需要不同規則時，傳入 `RemoteFileOptions`：

```php
use Mattmy\FileMagic\Data\RemoteFileOptions;

$options = new RemoteFileOptions(
    allowedHosts: ['downloads.example.com'],
);

$file = FileMagic::fromUrl(
    'https://downloads.example.com/report.pdf',
    $options,
)->store();
```

傳入 `RemoteFileOptions` 時，省略的參數會使用下表的預設值。如果需要沿用應用程式的
`remote` 設定，請明確傳入對應的值。

| 選項 | 型別 | 預設值 | 行為 |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | 驗證 HTTPS 憑證、主機名稱與憑證鏈 |
| `allowHttp` | `bool` | `false` | 明確允許未加密 HTTP |
| `allowHtml` | `bool` | `false` | 允許偵測為 HTML 或 XHTML 的內容 |
| `connectTimeoutSeconds` | `int` | `5` | 連線逾時，必須大於零 |
| `timeoutSeconds` | `int` | `30` | 每次 HTTP 請求的逾時，不得小於連線逾時 |
| `maxRedirects` | `int` | `3` | `0` 至 `10`，每一跳都重新驗證 |
| `allowedHosts` | `list<string>` | `[]` | 精確 host allowlist；空陣列允許通過檢查的 public host |
| `allowedPorts` | `list<int>` | `[80, 443]` | 不可為空，每個值必須介於 `1` 至 `65535` |
| `allowedPrivateHosts` | `list<string>` | `[]` | 明確允許解析到 private address 的精確 host |

若要透過連接埠 `80` 使用 HTTP，請設定 `allowHttp: true`。預設的連接埠清單已包含 `80`。

```php
$file = FileMagic::fromUrl(
    'http://downloads.example.com/manual.pdf',
    new RemoteFileOptions(allowHttp: true),
)->store();
```

若要使用其他連接埠，請將它加到允許清單。

```php
$file = FileMagic::fromUrl(
    'https://downloads.example.com:8443/manual.pdf',
    new RemoteFileOptions(allowedPorts: [80, 443, 8443]),
)->store();
```

主機清單會比對正規化後的完整名稱。`allowedHosts` 為空時，通過 DNS 與 IP 檢查的公開主機無須列入清單。
若要允許解析到私有位址的主機，請將它加入 `allowedPrivateHosts`。如果也設定了非空的 `allowedHosts`，
該主機要同時出現在兩份清單中。

### TLS 驗證

TLS 驗證預設開啟。FileMagic 不會靜默關閉驗證，也不會把 HTTPS 降級為 HTTP。在受控的開發或內部環境使用自簽憑證時，可以明確停用驗證。

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

### 網頁與 HTML 回應 {#官網與-html-回應}

FileMagic 偵測到遠端回應是 `text/html` 或 `application/xhtml+xml` 時，預設會拋出
`DisallowedMimeType`。

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

允許後會依偵測到的 MIME type 決定副檔名，例如 HTML 的 `.html` 或 XHTML 的 `.xhtml`。HTML 從應用程式同源顯示時可能執行
script；除非應用程式會隔離並清理內容，否則應保持 private 並以 attachment 下載。
`allowHtml: true` 只會略過遠端 HTML 專用的拒絕規則；一般的
`allowed_mime_types`、`blocked_mime_types`、`allowMimeTypes()` 與
`blockMimeTypes()` 規則仍然有效。

### 網址下載的安全性與效能

FileMagic 會檢查起始網址和每次重新導向的通訊協定、主機名稱、連接埠及 DNS 解析出的 IP，
並固定連線至通過檢查的 IP。預設會封鎖本機、私有、保留及雲端中繼資料位址。
要允許特定內部主機，請使用 `allowedPrivateHosts`。

遠端 response headers 與 URL filename 都是不可信任提示；MIME 與 extension 由下載
內容判斷。`Content-Length` 可提前拒絕過大回應，但實際串流 bytes 仍一定受到
`maxSize()` 或全域 `max_size` 限制。

下載暫存檔與後續來源快照可能同時存在，未處理圖片時就可能需要接近下載大小兩倍的
本機空間；圖片處理或覆寫還會增加用量。整個 `store()` 期間都會占用 PHP worker。
`timeoutSeconds` 是每次 HTTP 請求的上限，重新導向會各自計時，並非整次匯入的總上限。

大型或緩慢匯入可由應用程式放入 queue job 執行；FileMagic 本身不會派送工作。
正式環境仍應搭配對外連線防火牆。

儲存完成不代表內容一定無惡意。處理不可信任或高風險來源時，建議使用 private
visibility、attachment download、MIME allowlist、`X-Content-Type-Options: nosniff`
以及 antivirus／content scanning service。


