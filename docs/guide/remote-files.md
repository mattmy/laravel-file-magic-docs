# Remote files

## Store a file from a URL

Remote imports require PHP `ext-curl`. If it's missing, `store()` throws `RemoteDownloadUnavailable`
for remote files. Run `php --ri curl` to check the CLI environment.

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

FileMagic rejects URLs with embedded credentials or fragments.

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

Omit `RemoteFileOptions` to use your app's `remote` configuration. When you provide options,
the constructor supplies defaults for any arguments you leave out.

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

To use HTTP on port `80`, set `allowHttp: true`. The default port list already includes `80`.

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

Host lists match normalized names exactly. With `allowedHosts: []`, public hosts can pass
without being listed, provided they pass DNS and IP checks. To allow a host that resolves to a
private address, list it in `allowedPrivateHosts`. If `allowedHosts` is non-empty, include that host there too.

### TLS verification

FileMagic verifies HTTPS certificates by default. An HTTPS redirect to HTTP requires `allowHttp: true`
and must pass the usual URL checks. In a controlled development or internal environment, you can
disable certificate verification explicitly:

```php
$file = FileMagic::fromUrl(
    'https://development.example.test/manual.pdf',
    RemoteFileOptions::withoutTlsVerification(),
)->store();
```

> **Security warning:** disabling TLS verification permits man-in-the-middle
> replacement of the downloaded bytes. Do not use it for public or untrusted
> networks. HTTP and private-network access still follow their own settings.

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

FileMagic uses the downloaded bytes to determine MIME type and extension. Response headers
and filenames are hints. FileMagic can reject a response early based on `Content-Length` and
enforces `maxSize()` or the global `max_size` while downloading.

The download file and source snapshot can coexist, requiring close to twice the downloaded size
in local temporary space even without image processing. Images and overwrites add more. The PHP
worker stays busy throughout `store()`. `timeoutSeconds` applies to each HTTP request; redirects
start another request, so it is not a deadline for the whole import.

Run large or slow imports in an application queue job. For production network controls and
handling untrusted content, see [Performance and security](/guide/performance-and-security#security).


