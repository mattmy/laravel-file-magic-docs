---
layout: home

hero:
  name: FileMagic
  text: Laravel 檔案管理套件
  tagline: 透過一致的 Laravel 流程完成檔案儲存、辨識、查詢、轉換、下載與刪除。
  actions:
    - theme: brand
      text: 閱讀文件
      link: /zh-TW/guide/getting-started
    - theme: alt
      text: 前往 GitHub
      link: https://github.com/mattmy/file-magic

features:
  - title: 多種檔案來源
    details: 支援上傳、本機路徑、二進位內容、Base64、產生文件與遠端 HTTP(S) 檔案。
  - title: Laravel 原生流程
    details: 透過 Laravel Filesystem 儲存，並以可自訂的 Eloquent Model 維護紀錄。
  - title: 安全預設
    details: 提供嚴格驗證、SSRF 防護、Overwrite 還原與一致的批次刪除。
---

## 系統需求

FileMagic 支援 PHP 8.3 以上與 Laravel 12、13。

```bash
composer require mattmy/file-magic
```

從[完整繁體中文文件](/zh-TW/guide/getting-started)開始，或前往
[原始碼倉庫](https://github.com/mattmy/file-magic)。
