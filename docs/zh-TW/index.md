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
      link: https://github.com/mattmy/laravel-file-magic

features:
  - title: 多種檔案來源
    details: 支援上傳、本機路徑、二進位內容、Base64、產生文件與遠端 HTTP(S) 檔案。
  - title: 專為 Laravel 設計
    details: 使用 Laravel Filesystem disks，並透過 Eloquent 保存可查詢的檔案紀錄。
  - title: 更安全地處理檔案
    details: 限制檔案類型與大小、保護遠端下載，並在取代失敗時還原檔案。
  - title: 找出缺少的檔案
    details: 檢查 database records 是否仍有對應檔案，並可選擇移除缺少檔案的紀錄。
---

## 系統需求

FileMagic 支援 PHP 8.3 以上與 Laravel 12、13。PHP `ext-fileinfo` 是 Composer
會在安裝階段檢查的必要依賴；PHP `ext-curl` 則只在透過 `fromUrl()` 匯入遠端
HTTP(S) 檔案時需要。
圖片縮放需要 Intervention Image 4 搭配 GD 或 Imagick；ZIP 批次下載則需要 PHP
`ext-zip`。

```bash
composer require mattmy/laravel-file-magic
```

從[完整繁體中文文件](/zh-TW/guide/getting-started)開始，或前往
[原始碼倉庫](https://github.com/mattmy/laravel-file-magic)。
