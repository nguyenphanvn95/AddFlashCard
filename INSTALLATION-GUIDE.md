# 🚀 Hướng dẫn Cài đặt Extension AddFlashcard Enhanced

## Tính năng mới (v2.7.0)

### ✨ Image Occlusion Quick Access

Extension đã được nâng cấp với 3 tính năng mới để tạo Image Occlusion flashcard nhanh hơn:

1. **🎯 Hover Icon** - Icon xuất hiện khi di chuột lên ảnh
2. **⌨️ Alt+Click** - Alt+Click vào ảnh để tạo occlusion
3. **⚙️ Settings** - Bật/tắt các tính năng trong popup

---

## Cài đặt Extension

### Bước 1: Giải nén file
1. Giải nén file `AddFlashcard-ImageOcclusion-Enhanced.zip`
2. Bạn sẽ có thư mục `extension-fixed`

### Bước 2: Load extension vào Chrome/Edge

#### Chrome:
1. Mở Chrome
2. Vào `chrome://extensions/`
3. Bật **Developer mode** (góc trên phải)
4. Click **Load unpacked**
5. Chọn thư mục `extension-fixed`
6. Extension sẽ xuất hiện trong danh sách

#### Edge:
1. Mở Edge
2. Vào `edge://extensions/`
3. Bật **Developer mode** (góc dưới trái)
4. Click **Load unpacked**
5. Chọn thư mục `extension-fixed`
6. Extension sẽ xuất hiện trong danh sách

### Bước 3: Pin extension lên toolbar (tùy chọn)
1. Click vào icon Extensions (hình mảnh ghép) trên toolbar
2. Tìm **AddFlashcard + Image Occlusion**
3. Click vào icon pin 📌 để ghim lên toolbar

---

## Sử dụng tính năng mới

### 🎯 Sử dụng Hover Icon

1. **Mở bất kỳ trang web nào có ảnh**
   - Ví dụ: Wikipedia, blog, trang học tập, etc.

2. **Di chuột lên ảnh bạn muốn tạo flashcard**
   - Icon màu xanh dương sẽ xuất hiện ở góc trên phải của ảnh
   - Chỉ hoạt động với ảnh lớn hơn 50x50px

3. **Click vào icon**
   - Image Occlusion Editor sẽ mở với ảnh đã sẵn sàng
   - Vẽ các vùng che (rectangles) lên ảnh
   - Click "Add to Cards" để tạo flashcard

### ⌨️ Sử dụng Alt+Click

1. **Mở trang web có ảnh**

2. **Giữ phím Alt**
   - Windows/Linux: Alt
   - Mac: Option (⌥)

3. **Click vào ảnh**
   - Ảnh sẽ được gửi ngay vào Image Occlusion Editor
   - Nhanh hơn phương pháp hover icon

### ⚙️ Cấu hình Settings

1. **Mở extension popup**
   - Click vào icon extension trên toolbar
   - Hoặc: Right click → Extension options

2. **Click nút ⚙️ Settings**

3. **Cấu hình Image Occlusion Quick Access**
   ```
   🖼️ Image Occlusion Quick Access
   ☑️ Show icon when hovering over images
   ☑️ Alt+Click on image to create occlusion
   ```

4. **Click Save**
   - Settings sẽ được áp dụng cho tất cả các tab

---

## Các phím tắt

| Phím tắt | Chức năng |
|----------|-----------|
| `Alt + A` | Thêm văn bản đã chọn vào Front |
| `Alt + B` | Thêm văn bản đã chọn vào Back |
| `Alt + Q` | Toggle sidebar |
| `Alt + Click (trên ảnh)` | Tạo Image Occlusion |

---

## Các tính năng khác

### 📚 Quản lý thẻ
- Xem, chỉnh sửa, xóa flashcards
- Import/Export APKG
- Sync với Anki qua AnkiConnect

### 📖 Học thẻ
- Học flashcards với spaced repetition
- Đánh dấu Good/Again/Hard
- Track tiến độ học tập

### 📄 PDF Viewer
- Xem PDF và tạo flashcard từ PDF
- Highlight và annotate PDF

### 🔄 Notion Sync
- Sync flashcards với Notion database
- Import cards từ Notion

### 🖼️ Image Occlusion
- Tạo flashcards từ ảnh
- Vẽ vùng che để ẩn thông tin
- Tạo nhiều cards từ một ảnh

---

## Troubleshooting

### Icon không xuất hiện khi hover?
- ✅ Kiểm tra Settings → bật "Show icon when hovering over images"
- ✅ Refresh lại trang
- ✅ Ảnh có thể quá nhỏ (< 50x50px)

### Alt+Click không hoạt động?
- ✅ Kiểm tra Settings → bật "Alt+Click on image to create occlusion"
- ✅ Đảm bảo giữ đúng phím Alt (không phải Ctrl/Cmd)
- ✅ Reload extension và refresh trang

### Ảnh không load vào editor?
- ✅ Ảnh có thể bị CORS restriction
- ✅ Thử dùng "Chụp một vùng" từ context menu
- ✅ Download ảnh và upload vào editor

### Extension không hoạt động?
- ✅ Kiểm tra extension đã được enable
- ✅ Reload extension: Extensions → Reload
- ✅ Refresh trang web
- ✅ Kiểm tra console log (F12 → Console)

---

## Support & Feedback

Nếu gặp vấn đề:
1. Kiểm tra phần Troubleshooting ở trên
2. Mở Console (F12) và xem error logs
3. Tạo issue với thông tin chi tiết về lỗi

---

## Changelog v2.7.0

### Tính năng mới
- ✅ Hover icon trên ảnh để tạo Image Occlusion
- ✅ Alt+Click vào ảnh để tạo Image Occlusion
- ✅ Settings để bật/tắt các tính năng hover và alt-click
- ✅ Auto-detect ảnh lớn hơn 50x50px
- ✅ Hỗ trợ cả `<img>` tags và background-image
- ✅ Bỏ qua SVG và icon nhỏ

### Files mới
- `image-hover-handler.js` - Script xử lý hover và alt-click

### Files được cập nhật
- `manifest.json` - Thêm content script mới
- `background.js` - Thêm message handler
- `popup.js` - Thêm UI settings
- `README-IMAGE-HOVER.md` - Tài liệu chi tiết

### Storage keys mới
- `afc_image_hover_icon` - Enable/disable hover icon
- `afc_image_alt_click` - Enable/disable alt-click

---

## Tips & Best Practices

### Khi nào dùng Hover Icon?
- Khi bạn đang browse web và thấy ảnh hay
- Khi muốn tạo flashcard nhanh từ diagram, chart
- Khi cần UI visual để chọn ảnh

### Khi nào dùng Alt+Click?
- Khi bạn đã quen với phím tắt
- Khi muốn tốc độ nhanh nhất
- Khi không muốn icon xuất hiện liên tục

### Khi nào dùng Context Menu?
- Khi muốn chụp toàn bộ trang
- Khi muốn chụp một vùng cụ thể (không phải ảnh)
- Khi cần control chính xác hơn

---

Enjoy creating flashcards! 🎉
