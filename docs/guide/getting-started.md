# Getting started

FileMagic gives Laravel applications one workflow for accepting, storing, finding, downloading,
and deleting files. Store an upload to a Filesystem disk and receive a searchable Eloquent record.

## Requirements

| Requirement | Supported versions |
| --- | --- |
| PHP | 8.3–8.x |
| Laravel | 12 or 13 |
| PHP extension | `ext-fileinfo` |

These versions come from the package's Composer constraints. CI tests every Laravel 12 and 13
combination on PHP 8.3, 8.4, and 8.5. You also need a configured Laravel Filesystem disk and a
database supported by Laravel.

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
php artisan vendor:publish --tag=file-magic-migrations
php artisan migrate
```

## Configuration

FileMagic works with its defaults after the migration is published and run. By default, it stores
private files in the `files` directory on `FILESYSTEM_DISK`, limits files to 100 MiB, and gives
colliding filenames a unique suffix.

Publish the configuration only when you need to change these defaults:

```bash
php artisan vendor:publish --tag=file-magic-config
```

See [Configuration](/guide/configuration) for every option and environment override.

## Quick start

Add this route to `routes/web.php`. It validates an uploaded document, stores it with the default
settings, and returns the new record's ID, UUID, and detected MIME type as JSON.

```php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Mattmy\FileMagic\Facades\FileMagic;

Route::post('/documents', function (Request $request): array {
    $input = $request->validate([
        'document' => ['required', 'file'],
    ]);

    $file = FileMagic::fromUpload($input['document'])->store();

    return [
        'id' => $file->id,
        'uuid' => $file->uuid,
        'mime_type' => $file->mime_type,
    ];
});
```

The source method and `store()` are the only required calls. Methods between them can override
storage, naming, validation, ownership, and image options for that file.

## Next steps

- [Store uploads, local files, content, and Base64](/guide/storing-files)
- [Import remote HTTP(S) files safely](/guide/remote-files)
- [Query, read, and download stored files](/guide/querying-files)
- [Look up every application-facing method and field](/guide/reference)

