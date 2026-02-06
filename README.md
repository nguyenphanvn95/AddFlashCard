# AddFlashcard Extension - Tích hợp Allow Copy

Extension AddFlashcard đã được tích hợp thêm tính năng Allow Copy để cho phép copy nội dung trên mọi trang web.

## Tính năng mới

### Allow Copy
- **Bật/tắt** cho phép copy trên tất cả các trang web
- **Quản lý danh sách** các trang web đã lưu (whitelist)
- **Export/Import** danh sách domains dưới dạng JSON
- Tự động loại bỏ các hạn chế copy, select, right-click

## Cách sử dụng

### 1. Cài đặt Extension

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode" (góc trên bên phải)
3. Click "Load unpacked"
4. Chọn thư mục `integrated-extension`

### 2. Sử dụng Allow Copy

#### Từ Popup chính:
1. Click vào icon extension
2. Click vào nút "Allow Copy" (icon 📋)
3. Popup Allow Copy sẽ mở ra

#### Trong Popup Allow Copy:
- **Toggle switch**: Bật/tắt Allow Copy cho tất cả trang
- **Current site**: Hiển thị domain hiện tại
- **Add to whitelist**: Thêm trang hiện tại vào danh sách
- **Export domains.json**: Xuất danh sách domains ra file JSON
- **Import domains.json**: Import danh sách domains từ file JSON
- **Whitelist**: Hiển thị và quản lý các domain đã lưu

### 3. Export/Import Domains

#### Export:
1. Mở Allow Copy popup
2. Click "📥 Export domains.json"
3. File sẽ được tải về với tên `domains-[timestamp].json`

#### Import:
1. Mở Allow Copy popup
2. Click "📤 Import domains.json"
3. Chọn file JSON đã export trước đó
4. Danh sách sẽ được merge với danh sách hiện có

### 4. Định dạng file domains.json

```json
{
  "domains": [
    "example.com",
    "test.com",
    "another-site.org"
  ],
  "exportDate": "2024-02-06T12:00:00.000Z",
  "version": "1.0"
}
```

## Tính năng AddFlashcard gốc

Extension vẫn giữ nguyên tất cả các tính năng của AddFlashCard:

- ✏️ **Add Card**: Thêm flashcard từ text selection
- 📚 **Manage**: Quản lý các flashcard
- 📖 **Study**: Học flashcard với spaced repetition
- 📄 **PDF Viewer**: Xem và tạo flashcard từ PDF
- 🖼️ **Image Occlusion**: Tạo flashcard từ hình ảnh
- 🔄 **Sync with Anki**: Đồng bộ với Anki qua AnkiConnect
- 📦 **Export APKG**: Xuất ra file Anki package

## Cấu trúc File

```
integrated-extension/
├── manifest.json                 # Manifest chính
├── background.js                 # Service worker
├── content.js                    # Content script chính
├── popup.html/js/css            # Popup chính
├── allow-copy-popup.html/js/css # Popup Allow Copy
├── allow-copy-content.js        # Content script Allow Copy
├── manage.html/js/css           # Manager page
├── study.html/js/css            # Study page
└── icons/                       # Icons
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── allow-copy-icon.png
```

## Lưu ý

1. **Allow Copy** hoạt động ngay lập tức khi bật/tắt
2. Danh sách domains được lưu trong `chrome.storage.local`
3. Khi import domains, danh sách mới sẽ được merge (không ghi đè)
4. Extension cần quyền `storage` và `<all_urls>` để hoạt động

## Changelog

### Version 2.7.1
- ✅ Tích hợp Allow Copy feature
- ✅ Thêm nút Allow Copy vào popup chính
- ✅ Popup riêng cho Allow Copy với UI đẹp
- ✅ Export/Import domains.json
- ✅ Bật/tắt realtime trên tất cả các tab
- ✅ Quản lý whitelist domains

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Check console log (F12)
2. Kiểm tra extension permissions
3. Reload extension tại `chrome://extensions/`

## Tác giả

- **AddFlashcard**: Nguyễn Văn Phán
- **Allow Copy Integration**: 2024
