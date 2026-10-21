# Performance and security

## Performance

Each `store()` attempt reads the original source once into a bounded local snapshot. Inspection,
image processing, and writing use those captured bytes, avoiding source changes after inspection.
Even a local source needs this extra temporary space.

Budget for resources that can coexist: the source snapshot, Base64 decoding or remote-download
file, processed-image snapshot, and old-object backup for an overwrite. These costs add up.

- `contents()` loads the complete file into memory. Use `readStream()` for large files and
  close the returned stream after use.
- Oversized Base64 is rejected from decoded size before decoding. Valid Base64 is decoded in
  bounded chunks into a temporary stream, so the encoded input remains in memory while decoded
  bytes require temporary disk space. Prefer uploads, paths, or remote sources for large inputs.
- `csv()` consumes its iterable immediately and fully materializes the generated output in PHP
  memory before returning `PendingFile`. A later `maxSize()` does not limit generation memory.
  For large exports, stream to a local file in application code, then use `fromPath()`.
- Source size and MIME rules are applied before image processing, but accepted images can still
  need much more memory than their compressed size. Test with the largest dimensions your
  application accepts.
- `Overwrite` needs local temporary space close to the existing file size and takes longer
  than normal storage. Prefer `Unique` unless the path must stay the same.
- When collision locking is enabled, stores, batch deletion, and audit cleanup wait for canonical
  disk/path locks. For N paths, acquisition can approach `N × collision_lock.wait_seconds`.
  Leases do not renew automatically; allow time to acquire every lock and finish the operation,
  and monitor timeouts.
- ZIP downloads need temporary space for the source data and ZIP archive. Set suitable
  `zip.max_files` and `zip.max_size` limits.
- Remote download files and source snapshots can coexist, using close to twice the downloaded
  size before other processing. The worker stays busy throughout storage. Timeouts apply per
  HTTP request; run large or slow imports from an application queue job.
- Pass multiple targets to `find()` instead of repeating single lookups. Use
  `FileQuery::delete()` for batch deletion.
- `file-magic:audit` checks every selected record on storage. Remote disks can add network
  latency and request charges; `--chunk` limits batch memory, not storage checks. Cleanup rechecks
  initially missing records with unchanged identities.
- `urls()` also makes an existence check per file; budget for these extra remote requests.

Measure memory, temporary disk space, execution time, and remote request cost with the
largest files and batches your application accepts.

## Security

- Authorize every store, read, URL, download, ZIP, delete, and audit-cleanup operation in your application.
- Keep Laravel request validation in front of uploaded files.
- Treat original names, client MIME values, metadata, remote content, and stored bytes as
  untrusted data.
- Use `fromGeneratedContent()` only when application code created the bytes and guarantees their
  format. It is not recommended to pass uploads, HTTP responses, Data URIs, user-selected paths,
  or other untrusted bytes with a Symfony-recognized MIME type; use the ordinary source method so
  `finfo` inspects them.
- Prefer MIME allowlists for sensitive workflows. Consider blocking HTML and SVG when files
  are served from the same origin.
- Keep sensitive files on private disks and use short-lived temporary URLs.
- Never pass a user-controlled server path to `fromPath()`.
- Validate every target before creating a ZIP download.
- Configure web-server and PHP request limits in addition to FileMagic's `max_size`.
- Add antivirus or content scanning when required by the application's threat model.
- Remote imports verify TLS and block private network targets by default. Keep these defaults,
  and use an outbound firewall as an additional boundary in production.
- Keep downloaded HTML and other active content private unless it is safely isolated. Serve
  untrusted files as attachments with `X-Content-Type-Options: nosniff`.
- Avoid logging file contents, credentials, private URLs, or sensitive metadata.

When enabled, collision locks are cooperative: they protect standard FileMagic stores, batch deletion,
and audit cleanup that derive the same key, share the same cache backend, and finish within the lease.
Direct model deletion, direct storage writers, and isolated cache clusters
remain outside that boundary. The lock is not an ACID transaction, so operational recovery
should still include audit and reconciliation after process or infrastructure failures.

Report vulnerabilities privately according to the repository's
[security policy](https://github.com/mattmy/laravel-file-magic/blob/main/SECURITY.md).
