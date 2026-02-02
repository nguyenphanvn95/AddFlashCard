# AddFlashcard v2.1.0 - Enhanced Edition

Extension Chrome/Edge nâng cao để tạo flashcards từ nhiều nguồn khác nhau: web pages, PDFs, và Notion.

## 🎯 Tính năng mới trong v2.1.0

### 1. Hỗ trợ PDF
- **Chọn văn bản trong PDF**: Click chuột phải trên văn bản đã chọn trong PDF và sử dụng "Send to Front" hoặc "Send to Back"
- **Toolbar nổi**: Tự động xuất hiện khi mở file PDF với 3 nút:
  - **Add to Front**: Thêm văn bản đã chọn vào mặt trước flashcard
  - **Add to Back**: Thêm văn bản đã chọn vào mặt sau flashcard  
  - **Extract All Text**: Trích xuất toàn bộ văn bản từ PDF
- Hoạt động với PDF.js viewer và embedded PDFs

### 2. Tích hợp Notion
- **Nút Sync tự động**: Khi mở trang Notion, extension tự động thêm nút "Sync cards" bên cạnh nút Share
- **Sync Toggles → Flashcards**: 
  - Mỗi toggle trong Notion tự động trở thành 1 flashcard
  - **Mặt trước**: Title của toggle
  - **Mặt sau**: Nội dung bên trong toggle (giữ nguyên định dạng, ảnh, links, videos)
- **Auto-create Deck**: Tên page Notion tự động trở thành tên deck
- **Smart Update**: Nếu deck đã tồn tại:
  - Thẻ có mặt trước trùng → cập nhật mặt sau
  - Thẻ mới → thêm vào deck
- **Trạng thái Synced**: Sau khi sync xong, nút hiển thị "Synced ✓" trong 3 giây

### 3. Tính năng gốc (v2.0)
- Rich text formatting (bold, italic, underline, lists)
- Hỗ trợ ảnh, video, audio, links
- Context menu trên web pages
- Sidebar editor
- Quản lý multiple decks
- Import/Export dữ liệu

## 📦 Cài đặt

1. Download hoặc clone repository này
2. Mở Chrome/Edge → Vào `chrome://extensions/` hoặc `edge://extensions/`
3. Bật "Developer mode" 
4. Click "Load unpacked" 
5. Chọn thư mục `AddFlashcard`

## 🚀 Hướng dẫn sử dụng

### Sử dụng trên Web thường
1. Chọn văn bản/ảnh/video trên bất kỳ trang web nào
2. Click chuột phải → **AddFlashcard** → **Send to Front** hoặc **Send to Back**
3. Sidebar sẽ mở ra với nội dung đã chọn
4. Chọn deck và điền thông tin còn lại
5. Click **ADD CARD**

### Sử dụng với PDF
1. Mở file PDF (local hoặc online)
2. Extension tự động hiện toolbar nổi ở góc dưới bên phải
3. **Cách 1**: Chọn văn bản → Click "Add to Front" hoặc "Add to Back"
4. **Cách 2**: Click "Extract All Text" để lấy toàn bộ văn bản
5. Chỉnh sửa trong sidebar và lưu flashcard

### Sử dụng với Notion
1. Mở bất kỳ page nào trong Notion
2. Tạo các toggle blocks với cấu trúc:
   ```
   ▶️ Câu hỏi hoặc thuật ngữ (Toggle title)
      Câu trả lời chi tiết với:
      - Văn bản có format
      - Hình ảnh
      - Links
      - Videos
   ```
3. Click nút **"Sync cards"** bên cạnh nút Share
4. Extension sẽ:
   - Tạo deck với tên = tên page
   - Mỗi toggle = 1 flashcard
   - Giữ nguyên toàn bộ formatting
5. Nút hiển thị "Synced ✓" khi hoàn tất

## 🎨 Tính năng Rich Media

### Định dạng text
- **Bold**: Ctrl/Cmd + B
- **Italic**: Ctrl/Cmd + I
- **Underline**: Ctrl/Cmd + U
- Lists: Bullet và Numbered lists
- Links: Giữ nguyên hyperlinks

### Media
- **Ảnh**: Tự động nhúng với URL tuyệt đối
- **Video**: Hỗ trợ video embeds
- **Audio**: Nhúng audio files
- **Links**: Click để mở trong tab mới

## 🔧 Quản lý Flashcards

1. Click icon extension trên toolbar → Mở trang **Manage**
2. **Xem theo deck**: Filter cards theo deck
3. **Search**: Tìm kiếm trong front/back content
4. **Edit**: Sửa bất kỳ card nào
5. **Delete**: Xóa cards không cần
6. **Export**: Xuất toàn bộ dữ liệu ra JSON
7. **Import**: Nhập dữ liệu từ JSON file

## 📊 Statistics

Trang Manage hiển thị:
- Tổng số cards
- Số lượng decks
- Cards per deck
- Recent activity

## 🛡️ Bảo mật & Privacy

- **100% Local**: Mọi dữ liệu lưu trong Chrome storage local
- **Không có server**: Không gửi dữ liệu đi đâu
- **Không tracking**: Không thu thập thông tin người dùng
- **Open source**: Code hoàn toàn minh bạch

## 🔄 Sync & Backup

### Export dữ liệu
1. Mở trang Manage
2. Scroll xuống phần "Data Management"
3. Click **Export Data** → File JSON sẽ được download

### Import dữ liệu
1. Mở trang Manage
2. Click **Import Data**
3. Chọn file JSON đã export trước đó
4. Dữ liệu sẽ được merge (không ghi đè)

## 💡 Tips & Tricks

### Notion
- Dùng toggles để tạo Q&A flashcards
- Thêm ảnh minh họa trong toggle content
- Sử dụng callouts, quotes để làm nổi bật
- Sync lại page để cập nhật cards đã thay đổi

### PDF
- Dùng "Extract All Text" cho tài liệu học tập
- Chọn từng đoạn quan trọng để tạo cards riêng
- Kết hợp với Notion: Copy từ PDF → Paste vào Notion → Sync

### Web
- Chọn định nghĩa từ Wikipedia → Send to Front
- Capture screenshots quan trọng
- Save video timestamps quan trọng

## 🐛 Troubleshooting

### Notion Sync không hoạt động
- Đảm bảo page đã load xong
- Refresh page và thử lại
- Kiểm tra toggles có nội dung

### PDF không hiển thị toolbar
- Đảm bảo PDF đã load hoàn toàn
- Thử refresh trang
- Kiểm tra console log (F12)

### Sidebar không mở
- Kiểm tra extension đã được enable
- Refresh trang web
- Kiểm tra permissions

## 📝 Changelog

### v2.1.0 (Current)
- ✨ Thêm hỗ trợ PDF với toolbar và extract text
- ✨ Tích hợp Notion với auto-sync toggles
- ✨ Smart update: Merge cards thay vì duplicate
- ✨ Giữ nguyên rich formatting từ Notion
- 🐛 Fix: URL normalization cho media

### v2.0.0
- Rich text editor
- Multiple decks support
- Import/Export functionality
- Enhanced UI/UX

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Created with ❤️ for language learners and knowledge enthusiasts

## 📧 Support

For issues and feature requests, please open an issue on GitHub.

---

**Happy Learning! 📚✨**
