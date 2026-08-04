# Getting started

FileMagic is a file-management package built exclusively for Laravel.

## Requirements

- PHP 8.3 or later
- Laravel 12 or 13
- PHP `ext-fileinfo`
- A configured Laravel Filesystem disk

FileMagic uses `ext-fileinfo` to determine the stored file type. The filename and MIME type
reported by the client are not used as proof of the file's type.

Remote HTTP(S) imports through `fromUrl()` additionally need PHP `ext-curl`.
Without it, all other features remain available, while storing a remote source
throws `RemoteDownloadUnavailable`. Verify the extension used by your CLI with
`php --ri curl`.

Image resizing additionally needs `intervention/image` 4.0 or later and PHP GD
or Imagick. ZIP downloads additionally need PHP `ext-zip`.


## Installation

```bash
composer require mattmy/laravel-file-magic
php artisan vendor:publish --tag=file-magic-config
php artisan vendor:publish --tag=file-magic-migrations
php artisan migrate
```

## Configuration

The published `config/file-magic.php` contains:

```php
<?php

declare(strict_types=1);

return [
    'disk' => \env('FILE_MAGIC_DISK', \env('FILESYSTEM_DISK', 'local')),
    'directory' => \env('FILE_MAGIC_DIRECTORY', 'files'),
    'visibility' => \env('FILE_MAGIC_VISIBILITY', 'private'),
    'max_size' => 100 * 1024 * 1024,
    'allowed_mime_types' => [],
    'blocked_mime_types' => [
        'application/x-httpd-php',
        'application/x-php',
    ],
    'collision' => 'unique',
    'checksum_algorithm' => 'sha256',
    'temporary_url_ttl' => 5,
    'model' => Mattmy\FileMagic\Models\StoredFile::class,
    'table' => 'stored_files',
    'image' => [
        'quality' => 80,
        'max_width' => 1920,
    ],
    'zip' => [
        'max_files' => 100,
        'max_size' => 1024 * 1024 * 1024,
    ],
    'remote' => [
        'connect_timeout' => 5,
        'timeout' => 30,
        'max_redirects' => 3,
        'allowed_hosts' => [],
        'allowed_ports' => [80, 443],
    ],
];
```

| Option | Purpose |
| --- | --- |
| `disk` | Default Filesystem disk |
| `directory` | Default relative storage directory |
| `visibility` | `private` or `public` |
| `max_size` | Maximum detected size in bytes |
| `allowed_mime_types` | MIME allowlist; empty allows every non-blocked type |
| `blocked_mime_types` | MIME types rejected in every default operation |
| `collision` | `unique`, `error`, or `overwrite` |
| `checksum_algorithm` | PHP hash algorithm; invalid values fall back to `sha256` |
| `temporary_url_ttl` | Default temporary URL lifetime in minutes |
| `model` | Class extending `StoredFile` |
| `table` | File-record table |
| `image.quality` | Default image output quality |
| `image.max_width` | Default maximum image width |
| `zip.max_files` | Maximum files in one ZIP download |
| `zip.max_size` | Maximum uncompressed source bytes in one ZIP download |
| `remote.connect_timeout` | Default connection timeout in seconds |
| `remote.timeout` | Default total download timeout in seconds |
| `remote.max_redirects` | Default redirect limit from `0` to `10` |
| `remote.allowed_hosts` | Exact public-host allowlist; empty permits public hosts that pass SSRF validation |
| `remote.allowed_ports` | Non-empty port allowlist; defaults to standard HTTP and HTTPS ports |

Environment overrides:

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```


## Store your first file

Storing a file takes three steps:

1. Create a `PendingFile` with `fromUpload()`, `fromPath()`, `fromUrl()`, `fromContent()`, `fromBase64()`, `text()`, `json()`, or `csv()`.
2. Configure storage with methods such as `onDisk()`, `inDirectory()`, `named()`, and `visibility()`.
3. Call `store()` to persist the physical file and its database record.

```php
$file = FileMagic::fromUpload($uploadedFile)
    ->onDisk('local')
    ->inDirectory('documents')
    ->named('contract')
    ->store();
```

Only the source method and `store()` are required. Every configuration method in between is optional.

| Goal | Methods |
| --- | --- |
| Create a pending file | `fromUpload()`, `fromPath()`, `fromUrl()`, `fromContent()`, `fromBase64()` |
| Generate a document | `text()`, `json()`, `csv()` |
| Choose storage | `onDisk()`, `inDirectory()` |
| Choose a filename | `named()` |
| Persist the file | `store()` |
| Find and operate on stored files | `find()` |
| Download multiple files as ZIP | `find()->downloadZip()` |


