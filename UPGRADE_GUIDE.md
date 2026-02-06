# AddFlashcard Extension v2.8.0 - Upgrade Guide

## 🎉 Tính năng mới trong v2.8.0

### 1. Menu Allow Copy tích hợp vào Popup chính
- Giống như Image Occlusion, bây giờ Allow Copy có menu popup riêng
- Không cần mở tab mới nữa, tất cả thao tác trong một popup
- 3 tùy chọn nhanh:
  - 🟢/🔴 Bật/Tắt Allow Copy
  - ➕ Thêm trang hiện tại vào danh sách
  - ⚙️ Quản lý danh sách (mở tab manage.html)

### 2. Tự động đồng bộ dữ liệu Domain
- File `domains.json` được tự động sync cùng với `flashcards.json`
- Domains được lưu song song: Browser Storage + File System
- Auto-sync mỗi 5 phút (giống flashcards)
- Hỗ trợ import/export domains.json

## 📦 Các file đã thay đổi

### File chính:
1. **popup.js** - Thêm menu Allow Copy tích hợp
2. **storage-manager.js** - Thêm tính năng sync domains
3. **manifest.json** - Cập nhật version lên 2.8.0
4. **popup.html** - Cập nhật version display

## 🔧 Hướng dẫn cài đặt

### Cách 1: Cài đặt Extension mới (Khuyến nghị)
1. Giải nén file `integrated-extension-upgraded.zip`
2. Mở Chrome/Edge: `chrome://extensions/`
3. Bật "Developer mode"
4. Click "Load unpacked"
5. Chọn thư mục vừa giải nén
6. Xong! Extension đã được nâng cấp

### Cách 2: Thay thế file trong extension hiện tại
1. Tìm thư mục extension hiện tại của bạn
2. Backup các file: `popup.js`, `storage-manager.js`
3. Copy 2 file mới từ thư mục `integrated-extension-upgraded`:
   - `popup.js`
   - `storage-manager.js`
4. Cập nhật `manifest.json`: Đổi version thành "2.8.0"
5. Cập nhật `popup.html`: Đổi version display thành "v2.8.0"
6. Reload extension trong `chrome://extensions/`

## 🎯 Cách sử dụng tính năng mới

### Allow Copy Menu:
1. Click icon extension
2. Click nút "Allow Copy" (📋)
3. Chọn một trong các tùy chọn:
   - **Bật/Tắt**: Toggle Allow Copy on/off
   - **Thêm trang hiện tại**: Thêm domain hiện tại vào whitelist
   - **Quản lý danh sách**: Mở trang quản lý để xem/sửa/xóa domains

### Auto-sync Domains:
1. Trong manage.html, click "Select Sync Folder"
2. Chọn thư mục để sync (ví dụ: GitHub repo của bạn)
3. Extension tự động tạo file `domains.json` trong thư mục đó
4. Domains sẽ được sync tự động mỗi 5 phút
5. File `domains.json` có cấu trúc:
```json
{
  "domains": ["example.com", "test.com"],
  "enabled": true,
  "lastUpdate": 1738807200000,
  "version": "1.0"
}
```

## 📋 Cấu trúc thư mục sync
Sau khi chọn sync folder, cấu trúc sẽ như sau:
```
your-sync-folder/
├── flashcards.json  (dữ liệu thẻ)
└── domains.json     (dữ liệu domains Allow Copy)
```

## ⚙️ Các thay đổi kỹ thuật

### popup.js:
- Thêm function `showAllowCopyMenu()` giống `showImageOcclusionMenu()`
- Xử lý 3 actions: toggle, add-current, manage
- Style gradient xanh cyan (#06b6d4 → #0891b2)

### storage-manager.js:
- Thêm `loadDomainsFromFile()` và `saveDomainsToFile()`
- Thêm `syncDomainsBothWays()` để sync 2 chiều
- Thêm `saveDomains()` để lưu domains vào cả browser + file
- Auto-save domains khi có thay đổi trong browser storage
- Merge thông minh khi có conflict

## 🐛 Troubleshooting

### Nếu sync không hoạt động:
1. Kiểm tra quyền truy cập thư mục
2. Thử chọn lại sync folder
3. Check console log (F12) để xem lỗi

### Nếu menu không hiển thị:
1. Reload extension
2. Hard refresh popup (Ctrl+Shift+R)
3. Kiểm tra popup.js đã được update chưa

## 📝 Notes
- Domains sẽ được merge nếu có conflict thay vì overwrite
- Auto-sync có thể tắt bằng cách clear sync folder selection
- Tất cả dữ liệu vẫn được lưu trong browser storage làm primary

## 🔗 Links
- GitHub: https://github.com/nguyenphanvn95/AddFlashCard
- Issues: https://github.com/nguyenphanvn95/AddFlashCard/issues

---
**Version**: 2.8.0  
**Date**: February 2026  
**Author**: Nguyễn Văn Phán
