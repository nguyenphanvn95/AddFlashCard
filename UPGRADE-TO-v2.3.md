# AddFlashcard v2.3.0 - Upgrade Summary

## 🎉 Chúc mừng! Extension đã được nâng cấp lên v2.3.0

### ✨ Tính năng mới chính

#### 1. Xuất File APKG (Anki Package)
**Vị trí:** Manager → Header → Nút "Export APKG" (màu xanh lá)

**Chức năng:**
- Xuất flashcards sang định dạng .apkg của Anki
- Chọn nhiều deck cùng lúc để xuất
- Tự động tạo cấu trúc deck phân cấp (Parent::Child)
- Hiển thị thanh tiến trình khi xuất
- Tương thích với Anki Desktop, AnkiMobile, AnkiDroid

**Cách sử dụng:**
1. Mở Manager (manage.html)
2. Click nút "Export APKG"
3. Nhập tên parent deck (VD: "Tiếng Anh")
4. Chọn các deck muốn xuất
5. Click "Export APKG"
6. File sẽ tự động download
7. Import vào Anki: File → Import → Chọn file .apkg

#### 2. Đồng Bộ Với Anki (AnkiConnect)
**Vị trí:** Manager → Header → Nút "Sync to Anki" (màu xanh dương)

**Chức năng:**
- Đồng bộ trực tiếp với Anki Desktop qua AnkiConnect
- Không cần tạo file, sync tức thì
- Mapping linh hoạt giữa các fields
- Tự động tạo deck nếu chưa tồn tại
- Hiển thị kết quả chi tiết (thành công/thất bại)

**Yêu cầu:**
1. Anki Desktop phải đang chạy
2. Cài đặt add-on AnkiConnect (code: 2055492159)
   - Tools → Add-ons → Get Add-ons → Nhập code
   - Restart Anki

**Cách sử dụng:**
1. Khởi động Anki Desktop
2. Mở Manager trong extension
3. Click "Sync to Anki"
4. Chọn deck nguồn từ extension
5. Nhập tên deck đích trong Anki
6. Cấu hình field mapping (mặc định: Front→Front, Back→Back)
7. Click "Sync to Anki"
8. Xem kết quả và kiểm tra trong Anki

### 📊 So Sánh 2 Tính Năng

| Tiêu chí | Export APKG | AnkiConnect Sync |
|----------|-------------|------------------|
| **Tốc độ** | Trung bình | Nhanh |
| **Yêu cầu** | Không | Anki Desktop chạy |
| **Platform** | Desktop + Mobile | Chỉ Desktop |
| **Chia sẻ** | Có (file) | Không |
| **Cập nhật** | Import lại | Sync trực tiếp |
| **Sử dụng** | Xuất 1 lần | Đồng bộ thường xuyên |

**Khuyến nghị:**
- Dùng **APKG** khi: lần đầu import, cần file backup, muốn share, dùng mobile
- Dùng **AnkiConnect** khi: cập nhật thường xuyên, chỉ dùng Desktop, muốn nhanh

### 🔧 Cải Tiến Khác

1. **UI/UX tốt hơn**
   - Nút bấm rõ ràng với icon
   - Màu sắc phân biệt chức năng
   - Modal hiện đại với animation

2. **Progress Indicators**
   - Thanh tiến trình khi export/sync
   - Hiển thị phần trăm hoàn thành
   - Thông báo kết quả chi tiết

3. **Error Handling**
   - Thông báo lỗi rõ ràng
   - Hướng dẫn khắc phục
   - Kiểm tra kết nối trước khi sync

4. **Notion Integration**
   - Nút "Sync cards" vẫn hoạt động bình thường
   - Cải thiện độ tin cậy khi inject button
   - Retry logic thông minh hơn

### 📦 Files Mới

```
AddFlashcard-v2.3.0/
├── apkg-exporter.js          # Module xuất APKG
├── anki-connect.js            # Module AnkiConnect
├── manage.html                # Cập nhật UI
├── manage.css                 # Cập nhật styles
├── manage.js                  # Logic mới
├── CHANGELOG-v2.3.0.md       # Lịch sử thay đổi
├── README-v2.3.md            # Hướng dẫn chi tiết
├── ANKICONNECT-SETUP.md      # Hướng dẫn cài AnkiConnect
└── TESTING-v2.3.md           # Hướng dẫn test
```

### 🚀 Cài Đặt

#### Cách 1: Load Extension Unpacked (Khuyến nghị cho test)
1. Giải nén file `AddFlashcard-v2.3.0.zip`
2. Mở Chrome/Edge
3. Vào `chrome://extensions/`
4. Bật "Developer mode"
5. Click "Load unpacked"
6. Chọn thư mục vừa giải nén
7. Extension sẽ được cài đặt

#### Cách 2: Cài AnkiConnect (Nếu dùng Sync to Anki)
1. Mở Anki Desktop
2. Tools → Add-ons → Get Add-ons
3. Nhập code: `2055492159`
4. Click OK
5. Restart Anki
6. Xong! Bây giờ có thể sync

### 📖 Tài Liệu

1. **README-v2.3.md** - Hướng dẫn sử dụng đầy đủ
2. **ANKICONNECT-SETUP.md** - Cài đặt và troubleshoot AnkiConnect
3. **CHANGELOG-v2.3.0.md** - Chi tiết các thay đổi
4. **TESTING-v2.3.md** - Hướng dẫn test các tính năng

### 🐛 Khắc Phục Sự Cố

#### "Cannot connect to Anki"
✅ Kiểm tra:
1. Anki Desktop có đang chạy không?
2. AnkiConnect đã cài chưa? (Tools → Add-ons)
3. Đã restart Anki sau khi cài AnkiConnect chưa?
4. Firewall có block không? (Allow Anki qua firewall)

#### "No cards to export"
✅ Tạo ít nhất 1 card trước khi export

#### Export bị treo
✅ Đợi thanh progress hoàn thành, export nhiều card sẽ mất vài giây

#### Cards bị duplicate khi sync
✅ Đây là tính năng bảo vệ! AnkiConnect tự động skip duplicate
- Lần sync đầu: Tất cả cards mới → Success cao
- Lần sync sau: Cards đã tồn tại → Failed/Duplicate cao (bình thường!)

### 🎯 Workflow Khuyến Nghị

**Cho người mới:**
1. Tạo cards trong extension
2. Export APKG
3. Import vào Anki
4. Học trên Anki Desktop/Mobile

**Cho người dùng thường xuyên:**
1. Lần đầu: Export APKG để có base collection
2. Cài AnkiConnect
3. Lần sau: Sync trực tiếp qua AnkiConnect
4. Mobile: Sync Anki Desktop với AnkiWeb, rồi sync mobile với AnkiWeb

**Cho người chia sẻ:**
1. Tạo và organize cards trong extension
2. Export APKG với tên parent deck rõ ràng
3. Share file .apkg cho người khác
4. Họ import vào Anki của họ

### 💡 Tips & Tricks

1. **Đặt tên deck có ý nghĩa**
   - Dùng hierarchy: "Ngôn ngữ::Tiếng Anh::Từ vựng"
   - Trong extension tạo deck: "Ngôn ngữ"
   - Export với parent: "Học tập"
   - Kết quả: "Học tập::Ngôn ngữ"

2. **Tránh export nhiều lần**
   - Export 1 lần để tạo base
   - Sau đó dùng AnkiConnect để update
   - Hoặc edit trực tiếp trong Anki

3. **Backup thường xuyên**
   - Export JSON định kỳ (nút Export JSON)
   - Export APKG trước khi xóa cards
   - Giữ file backup ở nhiều nơi

4. **Test trước khi commit**
   - Sync vài cards thử trước
   - Kiểm tra trong Anki
   - Nếu OK, sync hết

### 🔮 Tương Lai (v2.4+)

Các tính năng đang xem xét:
- ✨ Custom card templates cho APKG
- ✨ Bi-directional sync (Anki → Extension)
- ✨ Auto-sync theo lịch
- ✨ Tag support
- ✨ Media files trong APKG
- ✨ Batch edit cards
- ✨ Import từ Anki về extension

### 📞 Hỗ Trợ

**Cần giúp đỡ?**
1. Đọc README-v2.3.md
2. Đọc ANKICONNECT-SETUP.md
3. Xem TESTING-v2.3.md để hiểu cách test
4. Check console logs (F12) để debug

**Báo lỗi:**
- Mô tả chi tiết vấn đề
- Kèm screenshot nếu có
- Ghi rõ version: v2.3.0
- Browser và OS đang dùng

### ✅ Checklist Sau Khi Cài

- [ ] Extension load thành công
- [ ] Tạo được card mới
- [ ] Mở được Manager
- [ ] Thấy nút "Export APKG" và "Sync to Anki"
- [ ] (Nếu dùng AnkiConnect) Cài và test kết nối
- [ ] Đọc README-v2.3.md
- [ ] Test export 1-2 cards thử

### 🎊 Kết Luận

Version 2.3.0 mang đến 2 cách mạnh mẽ để đưa flashcards vào Anki:
1. **APKG Export** - Universal, works everywhere
2. **AnkiConnect Sync** - Fast, direct, desktop-only

Chọn phương pháp phù hợp với workflow của bạn, hoặc dùng cả hai!

**Chúc bạn học tập hiệu quả! 📚🎓**

---

*Version: 2.3.0*  
*Release Date: 2025-02-02*  
*Developed with ❤️ for better learning*
