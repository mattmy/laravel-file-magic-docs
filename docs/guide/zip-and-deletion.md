# ZIP and deletion

## Download multiple files as ZIP

PHP `ext-zip` must be installed and enabled.

Let FileMagic generate the ZIP filename.

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

FileMagic writes ZIP entries and the archive to local temporary storage. `zip.max_files` limits
the file count, and `zip.max_size` limits the total uncompressed size. FileMagic fails the whole
download if the result is empty or any file is missing or unreadable. It removes the archive after
sending the response and creates no `StoredFile` record.


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

`find()` skips targets without a matching record. If a matched record cannot be safely deleted,
FileMagic keeps it, deletes the confirmed records, and throws `PartialFileDeletion`. Check
`deletedCount()`, `failedCount()`, and `failedKeys()`. Before retrying with a fresh `find()`,
confirm that the failed records still point to the files you intend to delete.

Storage and the database delete independently. Some files may already be gone when a later file
fails. Batch deletion creates no backups.

Success returns the number of deleted records; an empty result returns `0`. A database deletion
failure or affected-row mismatch throws `FileRecordFailed`, even though physical files may
already be gone. Batch deletion does not dispatch individual Eloquent `deleting` or `deleted` events.


