# Consistency audits

FileMagic can compare stored-file database records with their Laravel
Filesystem objects:

```bash
php artisan file-magic:audit
```

The command checks only from the database toward storage:

- a successful `exists()` result is healthy;
- `false` means the object is missing;
- an exception means the state is unknown, so the record is preserved.

It does not list storage, find objects without database records, delete
physical objects, or recreate missing objects.

## Read-only audit

The default mode does not change the database or storage:

```bash
php artisan file-magic:audit
php artisan file-magic:audit --disk=s3
php artisan file-magic:audit --chunk=250
```

| Option | Type and default | Behavior |
| --- | --- | --- |
| `--disk` | `?non-empty-string`, default `null` | Audit exactly one disk configured in `filesystems.disks`; omit it to audit all records |
| `--chunk` | `int<1, 5000>`, default `500` | Number of database records loaded per batch |
| `--delete-missing-records` | Boolean flag, default `false` | Delete database records whose objects are confirmed missing |
| `--force` | Boolean flag, default `false` | Skip confirmation in cleanup mode; invalid without `--delete-missing-records` |

Invalid option values exit with code `2` before scanning or changing data.
The command uses the configured FileMagic model, including its connection,
table, and primary key, and ignores global scopes so maintenance does not
silently skip records.

Each missing finding shows only its database key, disk, and storage-relative
path. The final summary includes `checked`, `healthy`, `missing`, `deleted`,
and `failed`.

## Cleaning missing records

To remove database records whose storage objects are confirmed missing:

```bash
php artisan file-magic:audit --delete-missing-records
```

Interactive execution asks for confirmation before scanning. Declining exits
without scanning or changing data. Non-interactive environments must explicitly
accept the risk:

```bash
php artisan file-magic:audit --delete-missing-records --force --no-interaction
```

`--force` is invalid without `--delete-missing-records`. Storage checks that
throw exceptions remain unknown and their records are never deleted.

Cleanup performs one unscoped bulk delete for the confirmed missing keys in
each chunk. Bulk queries do not dispatch individual Eloquent `deleting` or
`deleted` model events.

## Cost, performance, and consistency

Laravel Filesystem does not provide one portable bulk existence check.
FileMagic therefore performs exactly one `exists()` call for every database
record it audits. On S3 and other remote disks, those calls can add network
latency and billable request charges.

`--chunk` controls database query size and PHP memory use only. It does not
reduce the number of storage requests. Use `--disk` to limit scope, choose an
appropriate chunk size, and avoid running the command more often than the
application needs.

The result is a point-in-time observation, not an atomic snapshot shared with
storage. A different process can create or remove an object between the check
and database cleanup. Avoid concurrent external operations on the same paths
while cleanup is running.

Storage, network, adapter, and permission exceptions are reported as unknown
failures rather than missing objects. They produce exit code `2` and preserve
the affected records.

Cleanup is not wrapped in one command-wide database transaction. Every chunk
is deleted separately. If a database exception or affected-row mismatch occurs,
the command stops further deletion and exits with code `2`, but records from
earlier chunks may already have been deleted and are not automatically rolled
back. The command never deletes storage objects.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No unresolved missing records, or cleanup removed every confirmed missing record |
| `1` | The read-only audit completed and missing records remain |
| `2` | Invalid input, an unknown storage state, a database failure, or partial cleanup |

Use `--quiet` when automation needs only the exit code.

## Scheduling

FileMagic does not schedule audits automatically. A Laravel application can
add one explicitly:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('file-magic:audit --disk=s3')
    ->daily()
    ->withoutOverlapping();
```

Use `withoutOverlapping()` because remote audits can run longer than expected.
On multi-server deployments, consider `onOneServer()` with a shared cache
driver. Select the frequency only after accounting for the record count,
remote request latency, and provider charges.
