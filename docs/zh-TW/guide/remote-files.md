# 遠端檔案

## 從網址儲存檔案

匯入遠端檔案需要 PHP `ext-curl`。未啟用時，遠端來源的 `store()` 會拋出
`RemoteDownloadUnavailable`。可用 `php --ri curl` 檢查命令列環境。

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

FileMagic 會拒絕含有登入資訊或片段（`#fragment`）的網址。

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

省略 `RemoteFileOptions` 時會使用應用程式的 `remote` 設定。傳入選項後，未指定的參數會使用下表的預設值。

| 選項 | 型別 | 預設值 | 行為 |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | 驗證 HTTPS 憑證、主機名稱與憑證鏈 |
| `allowHttp` | `bool` | `false` | 明確允許未加密 HTTP |
| `allowHtml` | `bool` | `false` | 允許偵測為 HTML 或 XHTML 的內容 |
| `connectTimeoutSeconds` | `int` | `5` | 連線逾時，必須大於零 |
| `timeoutSeconds` | `int` | `30` | 每次 HTTP 請求的逾時，不得小於連線逾時 |
| `maxRedirects` | `int` | `3` | `0` 至 `10`，每一跳都重新驗證 |
| `allowedHosts` | `list<string>` | `[]` | 依完整主機名稱比對。空陣列允許通過檢查的公開主機 |
| `allowedPorts` | `list<int>` | `[80, 443]` | 不可為空，每個值必須介於 `1` 至 `65535` |
| `allowedPrivateHosts` | `list<string>` | `[]` | 明確允許解析至私有位址的主機名稱 |

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

FileMagic 預設會驗證 HTTPS 憑證。HTTPS 重新導向到 HTTP 時，必須設定 `allowHttp: true`，且目的網址
仍須通過一般檢查。在受控的開發或內部環境，可明確停用憑證驗證。

```php
$file = FileMagic::fromUrl(
    'https://development.example.test/manual.pdf',
    RemoteFileOptions::withoutTlsVerification(),
)->store();
```

> 停用 TLS 驗證後，中間人可能替換下載內容。請限於受控的網路使用。HTTP 與私有網路存取仍依各自的設定處理。

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

FileMagic 依偵測到的 MIME 類型決定副檔名，例如 `.html` 或 `.xhtml`。與應用程式同源顯示的 HTML
可能執行指令碼。請維持私人可見性並以附件下載，除非應用程式已清理且隔離內容。
設定 `allowHtml: true` 後，仍會套用全域與單次操作的 MIME 允許及封鎖清單。

### 網址下載的安全性與效能

FileMagic 會檢查起始網址和每次重新導向的通訊協定、主機名稱、連接埠及 DNS 解析出的 IP，
並固定連線至通過檢查的 IP。預設會封鎖本機、私有、保留及雲端中繼資料位址。
要允許特定內部主機，請使用 `allowedPrivateHosts`。

FileMagic 依下載內容判斷 MIME 類型與副檔名。回應標頭與網址中的檔名只供參考。套件可依
`Content-Length` 提前拒絕過大的回應，下載期間也會套用 `maxSize()` 或全域 `max_size` 上限。

下載暫存檔與後續來源快照可能同時存在，未處理圖片時就可能需要接近下載大小兩倍的
本機空間；圖片處理或覆寫還會增加用量。整個 `store()` 期間都會占用 PHP worker。
`timeoutSeconds` 是每次 HTTP 請求的上限，重新導向會各自計時，並非整次匯入的總上限。

大型或耗時的匯入可交由應用程式的佇列工作處理。正式環境的對外連線限制與不可信任內容的處理方式，
請參考[效能與安全](/zh-TW/guide/performance-and-security#安全)。


