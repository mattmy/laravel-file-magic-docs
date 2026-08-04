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
Archive entries use each file's original name. Duplicate names become `report (2).pdf`,
`report (3).pdf`, and so on, while preserving query order.

ZIP creation uses local temporary space instead of loading every source into memory.
`zip.max_files` and `zip.max_size` limit each operation; `zip.max_size` measures the
uncompressed source bytes. Temporary files are removed after the response finishes.

An empty result or any missing physical file fails the complete operation. FileMagic does
not silently return a partial archive. `downloadZip()` creates only a temporary HTTP
download and does not create another `StoredFile` record.


## Delete

Single file:

```php
$deleted = FileMagic::find($target)->delete();
```

Batch deletion:

```php
$deleted = FileMagic::find($targets)->delete();
```

Batch deletion removes records only for physical files confirmed as deleted or already
missing. Records for files that still exist or cannot be checked remain available for retry.

If only part of the operation completes, FileMagic first persists the confirmed state and
then throws `PartialFileDeletion`. Use `deletedCount()`, `failedCount()`, and `failedKeys()`
to report the result. You may safely retry the original `FileMagic::find($targets)->delete()`;
already missing objects are treated as deleted.

A batch is not all-or-nothing because storage and the database cannot share one transaction.
Earlier files may already be deleted when a later file fails. Batch deletion does not create
backups.


