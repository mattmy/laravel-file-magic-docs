# Remote files

## Store a file from a URL

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

Pass an immutable `RemoteFileOptions` when one operation needs different behavior:

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

### URL download security and performance

FileMagic resolves every A and AAAA record, blocks loopback, private, link-local,
reserved, multicast, unspecified, and cloud-metadata addresses, pins the validated
IP to the connection, disables automatic redirects, and repeats validation for
every redirect. `allowedPrivateHosts` is an explicit escape hatch for known internal
services; there is no option that enables every private network.

Remote response headers and URL filenames are untrusted hints. MIME and extension
come from the downloaded bytes. `Content-Length` may reject an oversized response
early, but the actual streamed bytes are always limited by `maxSize()` or the global
`max_size`.

Each URL is fetched once with a streaming GET. The temporary file is reused for
inspection, checksum, optional image processing, and storage, then removed on
success or failure. This avoids loading the whole response into PHP memory, but it
uses local temporary disk roughly equal to the downloaded size and occupies the
current PHP worker until the synchronous download finishes. Configure application
and network egress controls as defense in depth.

Stored bytes are not automatically safe. Prefer private visibility, attachment
downloads, MIME allowlists, `X-Content-Type-Options: nosniff`, and an antivirus or
content-scanning service for untrusted or high-risk workflows.


