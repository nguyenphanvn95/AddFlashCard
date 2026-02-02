# AddFlashcard Extension v2.0

Extension Chrome giúp bạn tạo và quản lý flashcard nhanh chóng từ nội dung trên web với sidebar và hệ thống quản lý decks đầy đủ.

## ✨ Tính năng mới v2.0

### 🎯 Sidebar xuất hiện bên phải trang web
- Sidebar tự động mở khi bạn chọn "Send to Front/Back"
- Giao diện đẹp, không che khuất nội dung trang
- Tạo card nhanh chóng mà không cần chuyển tab

### 📚 Quản lý Decks
- Tạo nhiều decks để phân loại flashcards
- Đổi tên, xóa decks
- Xem số lượng cards trong mỗi deck

### 📊 Thống kê
- Hiển thị số lượng cards theo từng deck
- Tổng số cards
- Cập nhật real-time

### 🎨 Trang quản lý chuyên nghiệp
- Xem tất cả cards theo deck
- Tìm kiếm và sắp xếp
- Preview card đầy đủ
- Chỉnh sửa cards dễ dàng
- Export/Import dữ liệu

## Tính năng

### 1. Context Menu (Menu chuột phải)
- Bôi đen văn bản hoặc click chuột phải vào ảnh
- Chọn **AddFlashcard** > **Send to Front** hoặc **Send to Back**
- **Sidebar tự động mở** và nội dung được thêm vào ô tương ứng

### 2. Sidebar bên phải
- Xuất hiện ở góc phải màn hình
- Không che khuất nội dung trang web
- Chọn deck trước khi tạo card
- Thống kê số lượng cards
- Nút "Manage Cards" dẫn đến trang quản lý

### 3. Trình soạn thảo văn bản
- **Bold (B)**: In đậm
- **Italic (I)**: In nghiêng
- **Underline (U)**: Gạch chân
- **Strikethrough (S)**: Gạch ngang
- **Bullet List (•)**: Danh sách không số
- **Numbered List (1.)**: Danh sách có số
- **Link (🔗)**: Chèn liên kết
- **Image (🖼️)**: Chèn ảnh

### 4. Trang quản lý (Manage)
- **Quản lý Decks**: Tạo, đổi tên, xóa decks
- **Quản lý Cards**: Xem, sửa, xóa từng card
- **Tìm kiếm**: Tìm cards theo nội dung
- **Sắp xếp**: Theo thời gian hoặc alphabet
- **Preview**: Xem card đầy đủ trước khi sửa
- **Export/Import**: Backup và khôi phục dữ liệu

## Cài đặt

### Bước 1: Tải extension
1. Tải toàn bộ thư mục `AddFlashcard`
2. Giải nén (nếu cần)

### Bước 2: Cài đặt vào Chrome
1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật **Developer mode** (góc trên bên phải)
3. Click **Load unpacked**
4. Chọn thư mục `AddFlashcard`
5. Extension sẽ xuất hiện trong danh sách

## Cách sử dụng

### Cách 1: Sử dụng Context Menu (Khuyên dùng)
1. Duyệt web bình thường
2. Bôi đen văn bản hoặc click chuột phải vào ảnh
3. Chọn **AddFlashcard** > **Send to Front/Back**
4. **Sidebar tự động mở** bên phải
5. Chọn deck, hoàn thiện nội dung
6. Click **ADD CARD** để lưu

### Cách 2: Mở trang quản lý
1. Click vào icon extension trên thanh công cụ
2. Trang quản lý sẽ mở trong tab mới
3. Xem tất cả cards và decks
4. Tìm kiếm, sửa, xóa cards

### Quản lý Decks
1. Trong sidebar: Click **+ New Deck** để tạo deck mới
2. Trong trang quản lý:
   - Click **+** bên cạnh "Decks" để tạo mới
   - Hover vào deck và click ✏️ để đổi tên
   - Click 🗑️ để xóa deck

### Quản lý Cards
1. Mở trang quản lý (click icon extension)
2. Chọn deck ở sidebar trái
3. **👁️ Preview**: Xem card đầy đủ
4. **✏️ Edit**: Sửa nội dung card
5. **🗑️ Delete**: Xóa card

### Export/Import
**Export:**
1. Mở trang quản lý
2. Click **Export** ở header
3. File JSON sẽ được tải về

**Import:**
1. Click **Import** ở header
2. Chọn file JSON đã export
3. Dữ liệu sẽ được merge với dữ liệu hiện tại

## Cấu trúc thư mục

```
AddFlashcard/
├── manifest.json          # Cấu hình extension
├── background.js          # Xử lý context menu & actions
├── content.js            # Inject sidebar vào trang web
├── sidebar.html          # Giao diện sidebar
├── sidebar.css           # Style sidebar
├── sidebar.js            # Logic sidebar
├── manage.html           # Trang quản lý
├── manage.css            # Style trang quản lý
├── manage.js             # Logic trang quản lý
├── icons/                # Thư mục chứa icon
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── demo.html             # Trang demo
├── README.md             # File này
├── INSTALL.md            # Hướng dẫn cài đặt chi tiết
└── LICENSE               # Giấy phép MIT
```

## Lưu ý

- Sidebar xuất hiện ở bên phải màn hình
- Dữ liệu được lưu trong `chrome.storage.local`
- Dữ liệu không bị mất khi tắt trình duyệt
- Xóa extension sẽ xóa toàn bộ dữ liệu (hãy export trước!)
- Extension hoạt động trên tất cả trang web

## Phím tắt (có thể cấu hình)

Truy cập `chrome://extensions/shortcuts` để:
- Set phím tắt mở/đóng sidebar
- Set phím tắt mở trang quản lý

## Các tình huống sử dụng

### Học ngoại ngữ
- Bôi đen từ mới → Send to Front
- Dịch nghĩa → Send to Back
- Tạo deck theo chủ đề (Business, Travel, etc.)

### Học lập trình
- Copy code snippet → Send to Front
- Giải thích code → Send to Back
- Phân loại theo ngôn ngữ (Python, JavaScript, etc.)

### Ôn thi
- Câu hỏi từ tài liệu → Send to Front
- Câu trả lời → Send to Back
- Tạo deck theo môn học

## Troubleshooting

**Sidebar không mở:**
- Refresh lại trang web (F5)
- Kiểm tra extension có được enable không

**Context menu không hiện:**
- Thử disable rồi enable lại extension
- Kiểm tra permissions trong manifest

**Dữ liệu bị mất:**
- Hãy export dữ liệu thường xuyên
- Kiểm tra trong trang quản lý

## Roadmap

- [ ] Spaced repetition system
- [ ] Đồng bộ với Anki
- [ ] Theme customization
- [ ] Keyboard shortcuts trong sidebar
- [ ] Tags cho cards
- [ ] Study mode với flip animation

---

**Version:** 2.0.0  
**Tác giả:** Được tạo bởi Claude  
**License:** MIT

## Changelog

### v2.0.0 (Current)
- ✨ Thêm sidebar xuất hiện bên phải trang web
- ✨ Hệ thống quản lý decks đầy đủ
- ✨ Trang quản lý với preview, edit, delete
- ✨ Thống kê số lượng cards theo deck
- ✨ Export/Import dữ liệu
- ✨ Tìm kiếm và sắp xếp cards
- 🎨 Giao diện dark theme hiện đại
- 🐛 Sửa các lỗi nhỏ

### v1.0.0
- 🎉 Phiên bản đầu tiên
- ✅ Context menu cơ bản
- ✅ Popup tạo card
- ✅ Lưu trữ local
