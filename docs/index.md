---
layout: home

hero:
  name: FileMagic
  text: File management for Laravel
  tagline: Store, inspect, query, transform, download, and delete files through one consistent Laravel workflow.
  actions:
    - theme: brand
      text: Read the documentation
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/mattmy/laravel-file-magic

features:
  - title: Multiple file sources
    details: Accept uploads, local paths, binary content, Base64, generated documents, and remote HTTP(S) files.
  - title: Built for Laravel
    details: Use Laravel Filesystem disks and keep searchable file records in Eloquent.
  - title: Safer file handling
    details: Limit file types and sizes, protect remote downloads, and recover failed replacements.
  - title: Find missing files
    details: Check whether database records still have matching files and optionally remove missing records.
---

## Requirements

FileMagic supports PHP 8.3–8.x and Laravel 12 or 13. CI tests both Laravel versions on
PHP 8.3, 8.4, and 8.5. PHP `ext-fileinfo` is required and checked by Composer during
installation. PHP `ext-curl` is optional and needed only for remote HTTP(S) imports through
`fromUrl()`. Image resizing needs Intervention Image 4 with GD or Imagick, while ZIP downloads
need PHP `ext-zip`.

```bash
composer require mattmy/laravel-file-magic
```

Start with the [complete documentation](/guide/getting-started) or review the
[source repository](https://github.com/mattmy/laravel-file-magic).
