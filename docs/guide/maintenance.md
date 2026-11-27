# Consistency audits

`file-magic:audit` checks whether each selected database record still has a file in storage.
It starts from the database, so files without a record are outside the audit's scope.

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
| `--force` | Boolean flag, default `false` | Skip confirmation in cleanup mode; using it alone exits with code `2` |

Invalid option values exit with code `2` before scanning or changing data.
The command uses the configured FileMagic model, connection, table, and primary key. It ignores
global scopes and skips default eager loads. Use `--disk` to limit the audit.

Each missing finding shows only its database key, disk, and storage-relative
path. The final summary includes `checked`, `healthy`, `missing`, `deleted`,
and `failed`.

## Cleaning missing records

To remove database records whose storage objects are confirmed missing:

```bash
php artisan file-magic:audit --delete-missing-records
```

In an interactive session, the command asks for confirmation before scanning. Cancelling skips the
scan and cleanup. For a non-interactive run, pass `--force`:

```bash
php artisan file-magic:audit --delete-missing-records --force --no-interaction
```

Cleanup reloads initially missing records and checks their storage objects again. When locking
is enabled, both steps run under the path locks. Only an unchanged record whose object is still
missing is deleted.

If the file reappears, the command keeps the record and counts it as healthy. If the record is
already gone, the command skips it. If the disk, path, or location identifier changes, or the
storage state is unknown, the command keeps the record and counts it as failed.

Cleanup does not dispatch each model's Eloquent `deleting` or `deleted` events. Do not use
cleanup when your application requires those events for each removed record.

## Cost, performance, and consistency

The audit performs one storage existence check for every selected database record. On S3 and
other remote disks, these checks can add network latency and billable request charges.

Use `--chunk` to set the number of records loaded at once, and `--disk` to reduce the number of
records checked. Cleanup makes a second storage check for records whose files initially appeared
missing and whose identity still matches.

Read-only results describe each file at the time of its check. With path locking enabled, cleanup
rechecks records under the same locks used by FileMagic stores and batch deletes. The locks cover
only operations that share the cache backend and finish within the lease. Direct model deletion
and external storage writes bypass them.

An existence check that throws is reported as `failed`, with exit code `2`. Cleanup keeps the
affected record.

A database error stops the audit with exit code `2`. Deletions from earlier batches stay in effect.
The command only deletes database records.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Audit completed with no missing records, cleanup completed, or the user cancelled cleanup |
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
