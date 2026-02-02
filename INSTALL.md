# Hướng dẫn cài đặt AddFlashcard Extension

## Bước 1: Chuẩn bị

### Kiểm tra trình duyệt
- Chrome phiên bản 88 trở lên
- Hoặc Microsoft Edge phiên bản 88 trở lên
- Hoặc các trình duyệt Chromium khác

### Tải extension
Đảm bảo bạn đã có thư mục `AddFlashcard` với đầy đủ các file:
```
AddFlashcard/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.css
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
└── LICENSE
```

## Bước 2: Cài đặt Extension

### 2.1. Mở trang Extensions
Có 3 cách:

**Cách 1:** 
- Nhập vào thanh địa chỉ: `chrome://extensions/`
- Nhấn Enter

**Cách 2:**
- Menu (⋮) > More tools > Extensions

**Cách 3:**
- Phím tắt: `Ctrl + Shift + E` (Windows/Linux) hoặc `Cmd + Shift + E` (Mac)

### 2.2. Bật Developer Mode
- Tìm công tắc **Developer mode** ở góc trên bên phải
- Bật nó lên (màu xanh)

### 2.3. Load Extension
1. Click nút **Load unpacked** (góc trên bên trái)
2. Duyệt đến thư mục `AddFlashcard`
3. Click **Select Folder**

### 2.4. Kiểm tra
Extension sẽ xuất hiện trong danh sách với:
- Tên: **AddFlashcard**
- Icon: Thẻ flashcard màu xanh
- Trạng thái: Enabled (màu xanh)

## Bước 3: Ghim Extension (Tùy chọn)

Để dễ dàng truy cập:
1. Click icon puzzle (🧩) trên thanh công cụ
2. Tìm **AddFlashcard**
3. Click icon ghim (📌) bên cạnh

Extension sẽ xuất hiện cố định trên thanh công cụ.

## Bước 4: Kiểm tra hoạt động

### Test Context Menu
1. Truy cập bất kỳ trang web nào
2. Bôi đen một đoạn văn bản
3. Click chuột phải
4. Bạn sẽ thấy menu **AddFlashcard** với 2 option:
   - Send to Front
   - Send to Back

### Test Popup
1. Click icon extension trên thanh công cụ
2. Popup sẽ mở ra với giao diện tạo flashcard
3. Thử nhập text và click **ADD CARD**
4. Card sẽ xuất hiện trong danh sách bên dưới

## Xử lý sự cố

### Extension không xuất hiện
- Kiểm tra Developer mode đã bật chưa
- Đảm bảo chọn đúng thư mục (có file manifest.json)
- Refresh lại trang extensions (F5)

### Context menu không hiện
- Refresh lại trang web (F5)
- Kiểm tra extension có được enable không
- Thử disable rồi enable lại extension

### Popup không mở
- Kiểm tra console có lỗi không (F12)
- Đảm bảo tất cả file đều có trong thư mục
- Thử remove và load lại extension

### Không lưu được card
- Kiểm tra permissions trong manifest.json
- Xóa cache của extension:
  - Extensions page > Remove > Load unpacked lại

## Update Extension

Khi có thay đổi code:
1. Sửa file trong thư mục AddFlashcard
2. Quay lại trang `chrome://extensions/`
3. Tìm AddFlashcard extension
4. Click nút refresh (🔄)
5. Extension sẽ reload với code mới

## Gỡ cài đặt

Nếu muốn gỡ extension:
1. Vào `chrome://extensions/`
2. Tìm AddFlashcard
3. Click **Remove**
4. Confirm

**Lưu ý:** Tất cả dữ liệu flashcard sẽ bị xóa!

## Export/Backup dữ liệu

Để backup flashcard (tính năng nâng cao):
1. Mở Console: F12 > Console tab
2. Paste code:
```javascript
chrome.storage.local.get(['cards'], (result) => {
  console.log(JSON.stringify(result.cards, null, 2));
});
```
3. Copy kết quả và lưu vào file `.json`

## Tips & Tricks

### Phím tắt
- Chrome cho phép tạo keyboard shortcut cho extension
- Vào `chrome://extensions/shortcuts`
- Tìm AddFlashcard và set phím tắt

### Multiple profiles
- Extension hoạt động độc lập cho mỗi Chrome profile
- Mỗi profile có dữ liệu riêng

### Development
- Khi đang develop, bật "Enable errors" để xem lỗi chi tiết
- Dùng Chrome DevTools để debug popup và background script

## Liên hệ hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra lại các bước cài đặt
2. Xem console có lỗi không
3. Thử với Chrome profile mới
4. Check file manifest.json có đúng format không

---

Chúc bạn sử dụng AddFlashcard hiệu quả! 🎉
