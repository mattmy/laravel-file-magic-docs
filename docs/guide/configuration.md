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
| `collision_lock.enabled` | `false` | Enables cooperative atomic locking for store operations. |
| `collision_lock.store` | `null` | Cache store used for collision locks; `null` uses Laravel's default store. |
| `collision_lock.lease_seconds` | `300` | Positive lock lease duration in seconds. |
| `collision_lock.wait_seconds` | `10` | Positive maximum wait for a contended lock in seconds. |
| `checksum_algorithm` | `sha256` | Supported PHP hash algorithm used for checksums. |
| `temporary_url_ttl` | `5` | Default temporary URL lifetime in minutes. |
| `model` | Package `StoredFile` | Eloquent model class; a custom class must extend the package model and use the configured table. |
| `table` | `stored_files` | Database table used by the model and published migration; custom models must set the same `$table`. |
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

Configuration values are strictly typed and are validated when the corresponding feature is
used. FileMagic does not cast string integers, discard invalid list members, or fall back from
an invalid value. Invalid values throw `InvalidConfiguration` and identify the affected key.
Unused optional image, ZIP, remote, and temporary-URL settings do not block other operations.

Before upgrading, make sure numeric settings are PHP integers rather than numeric strings,
list settings use consecutive integer keys and valid member types, enum-backed settings match
the documented values exactly, and every configured disk exists in `filesystems.disks`.

Changing `table` after the published migration has run does not rename existing data. Create a
new migration for an already deployed application. See [Models and exceptions](/guide/models-and-exceptions)
when replacing `model` or `table`.

## Optional collision-lock deployment

Collision locking is disabled by default, so normal store operations do not require a
lock-capable cache store. Disabled mode retains the existing behavior and does not protect
concurrent writers from TOCTOU races. Set `collision_lock.enabled` to `true` to opt in.

When enabled, every store locks its canonical disk and candidate path before checking whether
the target exists. Use a Laravel cache store that supports atomic locks: Redis, Memcached,
DynamoDB, database, file, or array. A missing or unsupported lock store is rejected. Disabled
mode does not resolve or validate `store`, `lease_seconds`, or `wait_seconds`.

All lock-enabled application processes that write the same storage paths must use the same shared cache
backend. The array store is suitable only for single-process tests. The file store coordinates
multiple servers only when they truly share the same filesystem. Set `lease_seconds` longer
than the worst-case backup, write, database, and recovery time. A lock timeout throws
`FileWriteFailed` without automatic retry; invalid lock configuration throws
`InvalidConfiguration` before the target is inspected or changed.

## Environment overrides

The shipped configuration reads these environment variables:

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```

`FILE_MAGIC_DISK` falls back to Laravel's `FILESYSTEM_DISK`. Other options can be changed in the
published `config/file-magic.php` file.
