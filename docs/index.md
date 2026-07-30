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
  - title: Laravel-native workflow
    details: Store through Laravel Filesystem and persist records with a configurable Eloquent model.
  - title: Safe by default
    details: Includes strict validation, SSRF protection, overwrite recovery, and consistent batch deletion.
  - title: Operational visibility
    details: Audit database records against storage with explicit cleanup, bounded memory, and predictable exit codes.
---

## Requirements

FileMagic supports PHP 8.3 or later and Laravel 12 or 13. PHP `ext-fileinfo` is
required and checked by Composer during installation. PHP `ext-curl` is
optional and needed only for remote HTTP(S) imports through `fromUrl()`.
Image resizing needs Intervention Image 4 with GD or Imagick, while ZIP
downloads need PHP `ext-zip`.

```bash
composer require mattmy/laravel-file-magic
```

Start with the [complete documentation](/guide/getting-started) or review the
[source repository](https://github.com/mattmy/laravel-file-magic).
