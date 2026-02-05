# AddFlashcard + Image Occlusion - Extension Tích Hợp

## Giới thiệu

Extension này tích hợp đầy đủ tính năng của **AddFlashCard** và **Anki Image Occlusion** vào một extension duy nhất, mang lại trải nghiệm liền mạch và tiện lợi hơn cho người dùng.

## Tính Năng Mới

### 1. Menu Chuột Phải (Context Menu)

Khi click chuột phải trên trang web, bạn sẽ thấy menu **AddFlashcard - Image Occlusion** với 2 tùy chọn:

- **Chụp một vùng**: Chọn vùng cụ thể trên trang web để tạo Image Occlusion
- **Chụp toàn bộ trang**: Chụp toàn bộ vùng nhìn thấy để tạo Image Occlusion

Sau khi chụp, overlay editor sẽ xuất hiện ngay trên trang để bạn vẽ các khối che mờ và tạo thẻ Anki.

### 2. Xử Lý Ảnh trong Front/Back Area

Khi bạn thêm hoặc paste ảnh vào ô nhập liệu Front hoặc Back của sidebar:

1. **Tooltip tự động**: Xuất hiện tooltip nhắc nhở "💡 Click vào ảnh để tạo Image Occlusion" khi ảnh mới được thêm vào
2. **Menu tương tác**: Click vào bất kỳ ảnh nào trong ô nhập liệu sẽ hiển thị menu với các tùy chọn:
   - ✏️ **Tạo Image Occlusion**: Mở overlay editor với ảnh này
   - 👁️ **Xem ảnh gốc**: Xem ảnh ở kích thước đầy đủ
   - 🗑️ **Xóa ảnh**: Xóa ảnh khỏi flashcard

### 3. Tab Image Occlusion trong Popup

Click vào icon extension, bạn sẽ thấy nút **🖼️ Image Occlusion** với giao diện gradient đẹp mắt. Click vào sẽ hiển thị submenu:

- **📐 Chụp một vùng**: Chụp vùng trên tab hiện tại
- **📱 Chụp toàn bộ trang**: Chụp toàn bộ tab hiện tại
- **✏️ Mở Editor**: Mở editor trong tab mới (có thể upload ảnh riêng)

## Cách Sử Dụng

### Workflow 1: Tạo Image Occlusion từ Trang Web

1. Duyệt đến trang web có nội dung bạn muốn tạo flashcard
2. Click chuột phải → **AddFlashcard - Image Occlusion** → Chọn chế độ chụp
3. Nếu chọn "Chụp một vùng": Click và kéo để chọn vùng muốn chụp
4. Overlay editor xuất hiện với ảnh đã chụp
5. Chọn công cụ vẽ (hình chữ nhật hoặc ellipse)
6. Vẽ các khối che mờ trên các phần cần ẩn
7. Nhập tiêu đề thẻ và click "Xuất file .apkg"
8. File APKG sẽ được tải xuống, import vào Anki để học

### Workflow 2: Tạo Image Occlusion từ Ảnh trong Flashcard

1. Mở sidebar AddFlashCard (Alt+Q hoặc chọn văn bản → Send to Front/Back)
2. Paste hoặc thêm ảnh vào ô Front hoặc Back
3. Click vào ảnh đó
4. Chọn "✏️ Tạo Image Occlusion" từ menu
5. Overlay editor mở với ảnh, tiếp tục vẽ và tạo thẻ như bình thường

### Workflow 3: Mở Editor Trực Tiếp

1. Click vào icon extension
2. Click nút **🖼️ Image Occlusion**
3. Chọn "✏️ Mở Editor"
4. Editor mở trong tab mới
5. Kéo thả hoặc paste ảnh vào editor
6. Vẽ và tạo thẻ

## Chế Độ Tạo Thẻ

Extension hỗ trợ 2 chế độ:

- **Hide One, Reveal One** (mặc định): Mỗi khối che mờ = 1 thẻ riêng
- **Hide All, Reveal One**: Tất cả khối che mờ trên cùng 1 thẻ

Chọn chế độ trong dropdown "Hide Mode" trước khi xuất APKG.

## Tính Năng Gốc Được Bảo Toàn

Tất cả tính năng của AddFlashCard vẫn hoạt động bình thường:

- ✅ Tạo flashcard từ văn bản, ảnh, audio
- ✅ PDF Viewer tích hợp
- ✅ Export APKG
- ✅ Sync với Anki qua AnkiConnect
- ✅ Notion Sync
- ✅ Quản lý thẻ và học thẻ
- ✅ Keyboard shortcuts (Alt+A, Alt+S)

Tất cả tính năng của Image Occlusion cũng được giữ nguyên:

- ✅ Vẽ hình chữ nhật và ellipse
- ✅ Xóa, di chuyển, thay đổi kích thước khối che
- ✅ Tạo file APKG chuẩn Anki
- ✅ Hỗ trợ 2 chế độ hide/reveal

## Cài Đặt

1. Tải extension về máy
2. Mở Chrome/Edge → Vào `chrome://extensions`
3. Bật "Developer mode"
4. Click "Load unpacked"
5. Chọn thư mục extension
6. Extension sẵn sàng sử dụng!

## Lưu Ý Kỹ Thuật

- Extension sử dụng Shadow DOM để cách ly styles
- Image Occlusion handler được inject tự động vào sidebar
- Overlay editor chạy trong context của trang web hiện tại
- Thư viện JSZip và SQL.js được bundle trong extension

## Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra Console (F12) để xem lỗi
2. Đảm bảo extension đã được cấp đủ quyền
3. Thử reload extension nếu có vấn đề

## Version

**v2.7.0** - Tích hợp đầy đủ AddFlashCard + Image Occlusion

---

**Chúc bạn học tập hiệu quả với Anki! 🎓**
