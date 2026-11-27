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
    details: 可儲存上傳檔案、本機檔案、二進位內容、Base64、程式產生的文件，以及透過 HTTP(S) 取得的檔案。
  - title: 專為 Laravel 設計
    details: 使用 Laravel Filesystem 儲存檔案，並透過 Eloquent 查詢檔案紀錄。
  - title: 檔案驗證與還原
    details: 限制檔案類型與大小、檢查遠端下載網址，並在覆寫失敗時嘗試還原檔案。
  - title: 稽核遺失檔案
    details: 找出對應檔案已遺失的資料庫紀錄，並可選擇刪除這些紀錄。
---

## 系統需求

FileMagic 支援 PHP 8.3–8.x 與 Laravel 12、13。CI 在 PHP 8.3、8.4、8.5 測試兩個 Laravel 版本。
Composer 安裝時會檢查必要的 `ext-fileinfo`。遠端匯入需要 `ext-curl`，ZIP 下載需要 `ext-zip`，圖片縮放
則需要 Intervention Image 4 搭配 GD 或 Imagick。

```bash
composer require mattmy/laravel-file-magic
```
