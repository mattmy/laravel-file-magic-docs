# Remote files

## Store a file from a URL

This optional feature requires PHP `ext-curl`. Without it, `store()` for a remote file throws
`RemoteDownloadUnavailable`; uploads, local sources, generated documents, and existing-file
operations remain available. Verify your CLI environment with `php --ri curl`.

`fromUrl()` takes an absolute URL and returns a `PendingFile`. The download starts at `store()`.
By default, FileMagic requires HTTPS and verifies the certificate.

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

Use HTTPS, or explicitly allow HTTP for one download. URLs with embedded credentials or fragments
are rejected.

Use a hostname to reach an IPv6 server. A URL with a bracketed IPv6 address as its host throws
`InvalidRemoteUrl`.

### RemoteFileOptions

Pass `RemoteFileOptions` when one download needs different rules:

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

When you pass `RemoteFileOptions`, omitted arguments use the constructor defaults below.
Pass any values you need from your app's `remote` configuration explicitly.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `verifyTls` | `bool` | `true` | Verifies the HTTPS certificate, hostname, and chain |
| `allowHttp` | `bool` | `false` | Explicitly permits unencrypted HTTP |
| `allowHtml` | `bool` | `false` | Allows detected HTML or XHTML content |
| `connectTimeoutSeconds` | `int` | `5` | Connection timeout; must be greater than zero |
| `timeoutSeconds` | `int` | `30` | Timeout per HTTP request; must be at least the connection timeout |
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

By default, FileMagic throws `DisallowedMimeType` when it detects `text/html` or
`application/xhtml+xml` in a remote response.

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

Allowed content uses its detected MIME type and mapped extension, such as `.html` for HTML
or `.xhtml` for XHTML. HTML can execute script when served from an application origin, so keep it private and
download it as an attachment unless the application sanitizes and isolates it.
`allowHtml: true` only removes the remote HTML-specific rejection; the normal
`allowed_mime_types`, `blocked_mime_types`, `allowMimeTypes()`, and
`blockMimeTypes()` rules still apply.

### URL download security and performance

For the initial URL and each redirect, FileMagic checks the scheme, hostname, port, and resolved
IP addresses, then pins the connection to a validated IP. Local, private, reserved, and cloud
metadata addresses are blocked by default. Use `allowedPrivateHosts` to allow a specific internal host.

Remote response headers and URL filenames are untrusted hints. MIME and extension
come from the downloaded bytes. `Content-Length` may reject an oversized response
early, but the actual streamed bytes are always limited by `maxSize()` or the global
`max_size`.

The download file and source snapshot can coexist, requiring close to twice the downloaded size
in local temporary space even without image processing. Images and overwrites add more. The PHP
worker stays busy throughout `store()`. `timeoutSeconds` applies to each HTTP request; redirects
start another request, so it is not a deadline for the whole import.

For large or slow imports, call FileMagic from an application queue job; the package does not
dispatch jobs itself. Configure network egress controls as an additional production boundary.

Stored bytes are not automatically safe. Prefer private visibility, attachment
downloads, MIME allowlists, `X-Content-Type-Options: nosniff`, and an antivirus or
content-scanning service for untrusted or high-risk workflows.


