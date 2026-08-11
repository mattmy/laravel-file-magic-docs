# Configuration

FileMagic works with its defaults after you publish and run the migration. Publish the
configuration file only when your application needs different storage, validation, URL, image,
ZIP, or remote-download defaults:

```bash
php artisan vendor:publish --tag=file-magic-config
```

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `disk` | `FILESYSTEM_DISK` or `local` | Filesystem disk used when `onDisk()` is not called. |
| `directory` | `files` | Relative directory used when `inDirectory()` is not called. |
| `visibility` | `private` | `private` or `public` when `visibility()` is not called. |
| `max_size` | `104857600` | Maximum detected file size in bytes. |
| `allowed_mime_types` | `[]` | Allowed MIME types; empty allows every type not blocked below. |
| `blocked_mime_types` | PHP MIME types | MIME types rejected unless replaced for one file with `blockMimeTypes()`. |
| `collision` | `unique` | `unique`, `error`, or `overwrite` when a target path exists. |
| `checksum_algorithm` | `sha256` | PHP hash algorithm used for checksums; invalid values fall back to `sha256`. |
| `temporary_url_ttl` | `5` | Default temporary URL lifetime in minutes. |
| `model` | Package `StoredFile` | Eloquent model class; a custom class must extend the package model. |
| `table` | `stored_files` | Database table used by the model and published migration. |
| `image.quality` | `80` | Output quality used when `resizeImage()` receives no quality. |
| `image.max_width` | `1920` | Maximum width used when `resizeImage()` receives no width. |
| `zip.max_files` | `100` | Maximum records in one ZIP download. |
| `zip.max_size` | `1073741824` | Maximum uncompressed source bytes in one ZIP download. |
| `remote.connect_timeout` | `5` | Connection timeout in seconds for `fromUrl()`. |
| `remote.timeout` | `30` | Total download timeout in seconds for `fromUrl()`. |
| `remote.max_redirects` | `3` | Redirect limit from `0` to `10`. |
| `remote.allowed_hosts` | `[]` | Exact public-host allowlist; empty permits public hosts that pass SSRF checks. |
| `remote.allowed_ports` | `[80, 443]` | Non-empty list of destination ports permitted for downloads. |

The default blocked MIME types are `application/x-httpd-php` and `application/x-php`.

Changing `table` after the published migration has run does not rename existing data. Create a
new migration for an already deployed application. See [Models and exceptions](/guide/models-and-exceptions)
when replacing `model` or `table`.

## Environment overrides

The shipped configuration reads these environment variables:

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```

`FILE_MAGIC_DISK` falls back to Laravel's `FILESYSTEM_DISK`. Other options can be changed in the
published `config/file-magic.php` file.
