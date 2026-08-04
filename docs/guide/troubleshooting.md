# Troubleshooting

## MIME type differs from the browser value

FileMagic uses the file contents to choose the stored MIME type. Browser-provided MIME values
are only source information and may be different.

## A file gets a `.bin` extension

The detected MIME type does not have a known extension. Check the record's `mime_type` and
decide whether your workflow should accept that file type.

## Temporary local URLs fail

Enable `serve => true` on the Laravel local disk, or use a Filesystem driver that supports
temporary URLs.

## Image processing is unavailable

Install Intervention Image 4 and enable GD or Imagick. Image resizing supports JPEG, PNG,
WebP, and BMP.

## A physical file was removed outside FileMagic

`existsOnDisk()` returns `false`. `contents()` and `readStream()` throw `FileNotFound`.
Use the [consistency audit](/guide/maintenance) to find records whose files are missing.

## ZIP downloads are unavailable

Install PHP `ext-zip`. The PHP process also needs permission and enough free space in its
temporary directory.

## A normal website URL is rejected

Web pages are HTML and are rejected by default. Use
`new RemoteFileOptions(allowHtml: true)` only when storing HTML is intentional, then keep
the result private unless your application safely isolates it.

## A development HTTPS URL fails certificate verification

Fix the certificate when possible. In a controlled environment only, use
`RemoteFileOptions::withoutTlsVerification()`. This does not enable HTTP, private hosts, or
unsupported ports.
