# 常見問題

## MIME type 與瀏覽器提供的值不同

FileMagic 會依檔案內容選擇儲存的 MIME type。瀏覽器提供的值只是來源資訊，因此可能
與最後結果不同。

## 檔案使用 `.bin` 副檔名

偵測到的 MIME type 沒有已知副檔名。請檢查紀錄的 `mime_type`，再決定該流程是否應
接受這類檔案。

## 本機 temporary URL 無法使用

在 Laravel local disk 啟用 `serve => true`，或改用支援 temporary URL 的 Filesystem
driver。

## 圖片處理無法使用

安裝 Intervention Image 4，並啟用 GD 或 Imagick。圖片縮放支援 JPEG、PNG、WebP
與 BMP。

## 實體檔案被 FileMagic 以外的系統移除

`existsOnDisk()` 會回傳 `false`，`contents()` 與 `readStream()` 會拋出 `FileNotFound`。
可以使用[一致性稽核](/zh-TW/guide/maintenance)找出缺少實體檔案的紀錄。

## ZIP 下載無法使用

安裝 PHP `ext-zip`，並確認 PHP process 有權限使用暫存目錄，而且暫存空間足夠。

## 一般網站網址被拒絕

一般網頁是 HTML，預設會被拒絕。只有確實要儲存 HTML 時才使用
`new RemoteFileOptions(allowHtml: true)`；除非應用程式能安全隔離內容，否則結果應
保持 private。

## 開發環境的 HTTPS certificate 驗證失敗

可以時應先修正 certificate。只有受控環境才能使用
`RemoteFileOptions::withoutTlsVerification()`；它不會開啟 HTTP、private hosts 或
不支援的 ports。
