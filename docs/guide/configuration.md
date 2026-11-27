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

Use PHP integers for numeric settings, zero-indexed lists with consecutive keys, and the values
shown in the table. Configure disk names in `filesystems.disks`. FileMagic checks most settings
when the feature uses them. An invalid default `directory` throws `InvalidConfiguration`.
An invalid directory passed to `inDirectory()` throws `InvalidStoragePath`.

To rename a table after deployment, create a new migration and update `table` to match. See [Models and exceptions](/guide/models-and-exceptions)
when replacing `model` or `table`.

## Optional collision-lock deployment

To coordinate writes and deletes on the same path, set `collision_lock.enabled` to `true`.
Locking is off by default.

When enabled, stores, batch deletion, and audit cleanup use the same canonical disk/path lock.
Batch operations acquire distinct keys in a stable order and revalidate current database identity
before mutation. Use a Laravel cache store that supports atomic locks: Redis, Memcached,
DynamoDB, database, file, or array. A missing or unsupported lock store is rejected. Disabled
mode does not resolve or validate `store`, `lease_seconds`, or `wait_seconds`.

Use the same cache backend in every process that coordinates access to the same paths. Use the array
store only for single-process tests. The file store can coordinate servers that share a filesystem.
Set `lease_seconds` to cover lock acquisition, storage I/O, database changes, and any recovery.

On timeout, `store()` throws `FileWriteFailed`, batch deletion throws `PartialFileDeletion`, and audit
cleanup exits with code `2`. FileMagic validates enabled lock settings when it initializes the lock
service. An `InvalidConfiguration` error at that point can also prevent a lookup or read-only audit.

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

Change other options in the published `config/file-magic.php`.
