# Remote files

## Store a file from a URL

This optional feature requires PHP `ext-curl`. Without it, `store()` for a remote file throws
`RemoteDownloadUnavailable`; uploads, local sources, generated documents, and existing-file
operations remain available. Verify your CLI environment with `php --ri curl`.

`fromUrl()` accepts absolute HTTP or HTTPS file URLs and returns the normal
`PendingFile`. HTTPS is the default and TLS certificate verification is enabled:

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

Typical supported URLs include:

```text
https://cdn.example.com/images/avatar.jpg
https://downloads.example.com/documents/manual.pdf
https://media.example.com/videos/introduction.mp4
https://files.example.com/archive.zip
```

Only HTTP(S) is supported. `file:`, `ftp:`, `gopher:`, `data:`, URLs containing
credentials or fragments, disallowed ports, and URLs that resolve to protected
networks are rejected.

### RemoteFileOptions

Pass `RemoteFileOptions` when one download needs different rules:

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

Passing `RemoteFileOptions` replaces the configured `remote` defaults for that
operation; the values are not merged. Include every non-default host, port, and
timeout required by the request.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | Verifies the HTTPS certificate, hostname, and chain |
| `allowHttp` | `bool` | `false` | Explicitly permits unencrypted HTTP |
| `allowHtml` | `bool` | `false` | Allows detected HTML or XHTML content |
| `connectTimeoutSeconds` | `int` | `5` | Connection timeout; must be greater than zero |
| `timeoutSeconds` | `int` | `30` | Total timeout; must be at least the connection timeout |
| `maxRedirects` | `int` | `3` | Redirect limit from `0` to `10`; every hop is revalidated |
| `allowedHosts` | `list<string>` | `[]` | Exact hostname allowlist; empty permits validated public hosts |
| `allowedPorts` | `list<int>` | `[80, 443]` | Non-empty port allowlist; values must be between `1` and `65535` |
| `allowedPrivateHosts` | `list<string>` | `[]` | Exact hosts explicitly allowed to resolve to private addresses |

Port `80` being present does not enable HTTP. With the default `allowHttp: false`,
HTTP is still rejected. Enable standard HTTP without repeating the default ports:

```php
$file = FileMagic::fromUrl(
    'http://downloads.example.com/manual.pdf',
    new RemoteFileOptions(allowHttp: true),
)->store();
```

Non-standard ports must be listed explicitly:

```php
$file = FileMagic::fromUrl(
    'https://downloads.example.com:8443/manual.pdf',
    new RemoteFileOptions(allowedPorts: [80, 443, 8443]),
)->store();
```

An empty `allowedPorts` array is invalid; it never means every port. Host lists are
normalized and compared exactly. `allowedHosts: []` permits public hosts only after
all DNS and IP checks. Private networks remain blocked unless an exact hostname is
present in `allowedPrivateHosts`.

### TLS verification

TLS verification is enabled by default and FileMagic never silently disables it or
downgrades HTTPS to HTTP. For a controlled development or internal environment with
a self-signed certificate, explicitly disable verification:

```php
$file = FileMagic::fromUrl(
    'https://development.example.test/manual.pdf',
    RemoteFileOptions::withoutTlsVerification(),
)->store();
```

> **Security warning:** disabling TLS verification permits man-in-the-middle
> replacement of the downloaded bytes. Do not use it for public or untrusted
> networks. It does not enable HTTP or disable SSRF protection.

To combine disabled TLS verification with other settings, construct the options
explicitly:

```php
$options = new RemoteFileOptions(
    verifyTls: false,
    timeoutSeconds: 60,
    allowedHosts: ['development.example.test'],
);
```

### Website and HTML responses

A normal website usually returns `text/html` rather than a downloadable document.
FileMagic rejects detected `text/html` and `application/xhtml+xml` by default with
`DisallowedMimeType`. It does not disguise website source as a `.txt` file.

If storing HTML is intentional:

```php
use Mattmy\FileMagic\Enums\FileVisibility;

$file = FileMagic::fromUrl(
    'https://www.example.com/page',
    new RemoteFileOptions(allowHtml: true),
)
    ->visibility(FileVisibility::Private)
    ->store();
```

Allowed HTML is stored with its detected HTML MIME type and `.html` extension. HTML
can execute script when served from an application origin, so keep it private and
download it as an attachment unless the application sanitizes and isolates it.
`allowHtml: true` only removes the remote HTML-specific rejection; the normal
`allowed_mime_types`, `blocked_mime_types`, `allowMimeTypes()`, and
`blockMimeTypes()` rules still apply.

### URL download security and performance

FileMagic blocks local, private, reserved, and cloud metadata destinations, including after
redirects. `allowedPrivateHosts` can allow specific known internal services; it does not
allow every private-network destination.

Remote response headers and URL filenames are untrusted hints. MIME and extension
come from the downloaded bytes. `Content-Length` may reject an oversized response
early, but the actual streamed bytes are always limited by `maxSize()` or the global
`max_size`.

Remote downloads use local temporary space close to the downloaded size and keep the current
PHP worker busy until the download finishes. Use a queue for large or slow downloads, and
configure application and network egress controls as additional production boundaries.

Stored bytes are not automatically safe. Prefer private visibility, attachment
downloads, MIME allowlists, `X-Content-Type-Options: nosniff`, and an antivirus or
content-scanning service for untrusted or high-risk workflows.


