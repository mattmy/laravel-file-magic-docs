# Performance and security

## Performance

- `contents()` loads the complete file into memory. Use `readStream()` for large files and
  close the returned stream after use.
- Oversized Base64 is rejected before decoded content is allocated. Valid Base64 still needs
  more memory than the decoded file, so prefer uploads, paths, or remote sources for large files.
- Source size and MIME rules are applied before image processing, but accepted images can still
  need much more memory than their compressed size. Test with the largest dimensions your
  application accepts.
- `Overwrite` needs local temporary space close to the existing file size and takes longer
  than normal storage. Prefer `Unique` unless the path must stay the same.
- When collision locking is enabled, every store waits for a per-candidate disk/path lock.
  Size the lock lease for the slowest complete store and monitor lock timeouts.
- ZIP downloads need temporary space for the source data and ZIP archive. Set suitable
  `zip.max_files` and `zip.max_size` limits.
- Remote imports use local temporary space close to the downloaded size and keep the current
  PHP worker busy until the download finishes. Set connection and total timeouts, and use a
  queue for large or slow imports.
- Pass multiple targets to `find()` instead of repeating single lookups. Use
  `FileQuery::delete()` for batch deletion.
- `file-magic:audit` checks every selected record on storage. Remote disks can add network
  latency and request charges; `--chunk` limits database memory but not storage checks.

Measure memory, temporary disk space, execution time, and remote request cost with the
largest files and batches your application accepts.

## Security

- Authorize every store, read, URL, download, ZIP, and delete operation in your application.
- Keep Laravel request validation in front of uploaded files.
- Treat original names, client MIME values, metadata, remote content, and stored bytes as
  untrusted data.
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

When enabled, collision locks are cooperative: they protect writers that derive the same key, share the same
cache backend, and finish within the lease. Direct storage writers and isolated cache clusters
remain outside that boundary. The lock is not an ACID transaction, so operational recovery
should still include audit and reconciliation after process or infrastructure failures.

Report vulnerabilities privately according to the repository's
[security policy](https://github.com/mattmy/laravel-file-magic/blob/main/SECURITY.md).
