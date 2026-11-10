# ZIP and deletion

## Download multiple files as ZIP

PHP `ext-zip` must be installed and enabled.

Use the safe generated download name:

```php
return FileMagic::find([
    $firstId,
    $secondUuid,
    $fileModel,
])->downloadZip();
```

Choose the ZIP download name:

```php
return FileMagic::find($targets)->downloadZip('project-documents');
```

Both `project-documents` and `project-documents.zip` produce `project-documents.zip`.
ZIP entries use the original filename when available. FileMagic strips directory components,
cleans unsafe characters, and falls back to the stored name when needed. It keeps query order
and adds suffixes such as `report (2).pdf` and `report (3).pdf` for duplicate names.

ZIP creation uses local temporary space instead of loading every source into memory.
`zip.max_files` and `zip.max_size` limit each operation; `zip.max_size` measures the
uncompressed source bytes. An empty result or any missing or unreadable file fails the download.
The archive is deleted after the response is sent. It has no `StoredFile` record.


## Delete

Single file:

```php
$deleted = FileMagic::find($target)->delete();
```

Batch deletion:

```php
$deleted = FileMagic::find($targets)->delete();
```

FileMagic groups storage deletions by disk and checks individual paths only if a disk's batch
fails. It removes records for files confirmed deleted or missing and keeps the rest for retry.

FileMagic reloads records before deletion. It skips records that are already gone and keeps those
whose disk, path, or location identifier changed. With path locking enabled, FileMagic takes the
locks before reloading and holds them until the operation finishes.

If any targets remain unresolved, FileMagic deletes the confirmed records and throws
`PartialFileDeletion`. Check `deletedCount()`, `failedCount()`, and `failedKeys()`. Before retrying
with a fresh `find()`, verify that the failed records still point to files you intend to delete.

A batch is not all-or-nothing because storage and the database cannot share one transaction.
Earlier files may already be deleted when a later file fails. Batch deletion does not create
backups.

Success returns the number of deleted records; an empty result returns `0`. A database deletion
failure or affected-row mismatch throws `FileRecordFailed`, even though physical files may
already be gone. Batch deletion does not dispatch individual Eloquent `deleting` or `deleted` events.


