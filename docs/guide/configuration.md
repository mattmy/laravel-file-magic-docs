# Configuration

To change the defaults, publish `config/file-magic.php`.

```bash
php artisan vendor:publish --tag=file-magic-config
```

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `disk` | `FILE_MAGIC_DISK` → `FILESYSTEM_DISK` → `local` | Filesystem disk used when `onDisk()` is not called. |
| `directory` | `files` | Relative directory used when `inDirectory()` is not called. |
| `visibility` | `private` | `private` or `public` when `visibility()` is not called. |
| `max_size` | `104857600` | Maximum original source and processed image size, in bytes. |
| `allowed_mime_types` | `[]` | Allowed MIME types; empty allows every type not blocked below. |
| `blocked_mime_types` | PHP MIME types | MIME types rejected unless replaced for one file with `blockMimeTypes()`. |
| `collision` | `unique` | `unique`, `error`, or `overwrite` when a target path exists. |
| `collision_lock.enabled` | `false` | Enables cooperative atomic locking for stores, batch deletion, and audit cleanup. |
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
| `remote.timeout` | `30` | Timeout per HTTP request in seconds, not for the whole redirect chain. |
| `remote.max_redirects` | `3` | Redirect limit from `0` to `10`. |
| `remote.allowed_hosts` | `[]` | Exact public-host allowlist; empty permits public hosts that pass SSRF checks. |
| `remote.allowed_ports` | `[80, 443]` | Non-empty list of destination ports permitted for downloads. |

The default blocked MIME types are `application/x-httpd-php` and `application/x-php`.
The blocklist takes priority over the allowlist. Omitting `blocked_mime_types` keeps the default
blocklist; setting it to `[]` explicitly disables it. `allowMimeTypes()` and `blockMimeTypes()`
replace their corresponding global lists rather than merging with them.

FileMagic validates settings when the feature uses them. Use PHP integers for numeric settings,
lists with consecutive keys starting at zero, and the exact enum values shown in the table. Disk names
must exist in `filesystems.disks`. Invalid settings throw `InvalidConfiguration` with the setting name.

Changing `table` after the published migration has run does not rename existing data. Create a
new migration for an already deployed application. See [Models and exceptions](/guide/models-and-exceptions)
when replacing `model` or `table`.

## Optional collision-lock deployment

To coordinate writes and deletes on the same path, set `collision_lock.enabled` to `true`.
Locking is off by default.

When enabled, stores, batch deletion, and audit cleanup use the same canonical disk/path lock.
Batch operations acquire distinct keys in a stable order and revalidate current database identity
before mutation. Use a Laravel cache store that supports atomic locks: Redis, Memcached,
DynamoDB, database, file, or array. A missing or unsupported lock store is rejected. Disabled
mode does not resolve or validate `store`, `lease_seconds`, or `wait_seconds`.

All lock-enabled application processes that write the same storage paths must use the same shared cache
backend. The array store is suitable only for single-process tests. The file store coordinates
multiple servers only when they truly share the same filesystem. Set `lease_seconds` longer
than the worst-case multi-lock wait, storage I/O, reconciliation, database mutation, and recovery
time. Store lock timeout throws `FileWriteFailed`; batch deletion reports `PartialFileDeletion`,
and audit cleanup exits with code `2`. Invalid lock configuration raises `InvalidConfiguration`
before target mutation; it can also prevent the audit command from being constructed.

Each distinct path needs its own lock. For N paths, the worst-case acquisition wait can approach
`N × collision_lock.wait_seconds`. Leases are not automatically extended. See
[Performance and security](/guide/performance-and-security) for the limits.

## Environment overrides

The shipped configuration reads these environment variables:

```dotenv
FILE_MAGIC_DISK=s3
FILE_MAGIC_DIRECTORY=uploads
FILE_MAGIC_VISIBILITY=private
```

`FILE_MAGIC_DISK` falls back to Laravel's `FILESYSTEM_DISK`, then `local`. Other options can be changed in the
published `config/file-magic.php` file.
