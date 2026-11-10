# Getting started

FileMagic gives Laravel applications one workflow for accepting, storing, finding, downloading,
and deleting files. Store an upload to a Filesystem disk and receive a searchable Eloquent record.

## Requirements

| Requirement | Supported versions |
| --- | --- |
| PHP | 8.3–8.x |
| Laravel | 12 or 13 |
| PHP extension | `ext-fileinfo` |

CI tests Laravel 12 and 13 on PHP 8.3, 8.4, and 8.5. Your app also needs a configured
Laravel Filesystem disk and database connection.

- Remote imports through `fromUrl()` require `ext-curl`.
- ZIP downloads require `ext-zip`.
- Image resizing requires Intervention Image 4 and GD or Imagick.


## Installation

```bash
composer require mattmy/laravel-file-magic
php artisan vendor:publish --tag=file-magic-migrations
php artisan migrate
```

If you need image resizing, also install Intervention Image 4 and enable PHP GD or Imagick:

```bash
composer require intervention/image:^4.0
```

## Configuration

FileMagic works with its defaults after the migration is published and run. By default, it stores
private files in the `files` directory on `FILE_MAGIC_DISK` (falling back to `FILESYSTEM_DISK`,
then `local`), limits files to 100 MiB, and gives
colliding filenames a unique suffix.

Publish the configuration only when you need to change these defaults:

```bash
php artisan vendor:publish --tag=file-magic-config
```

See [Configuration](/guide/configuration) for every option and environment override.

## Quick start

This example for `routes/web.php` validates an upload and returns its ID, UUID, and detected MIME
type. Add your application's authentication and upload authorization before exposing the route.

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

To change how this upload is stored, [set options before calling `store()`](/guide/storing-files#customize-storage).

## Next steps

- [Store uploads, local files, content, and Base64](/guide/storing-files)
- [Import remote HTTP(S) files safely](/guide/remote-files)
- [Query, read, and download stored files](/guide/querying-files)
- [Look up every application-facing method and field](/guide/reference)

