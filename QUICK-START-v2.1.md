# 🚀 AddFlashcard v2.1.0 - Quick Summary

## ✨ Tính năng mới đã thêm

### 1. 📄 Hỗ trợ PDF
- ✅ Chọn văn bản trong PDF → Right-click → "Send to Front/Back"
- ✅ Toolbar nổi tự động với 3 nút:
  - "Add to Front" - Thêm text đã chọn vào mặt trước
  - "Add to Back" - Thêm text đã chọn vào mặt sau  
  - "Extract All Text" - Lấy toàn bộ nội dung PDF
- ✅ Tương thích với PDF.js và embedded PDFs
- ✅ Hỗ trợ multi-page PDFs

### 2. 🟣 Tích hợp Notion
- ✅ Nút "Sync cards" tự động xuất hiện bên cạnh nút Share
- ✅ Mỗi Toggle → 1 Flashcard:
  - Toggle title = Mặt trước
  - Toggle content = Mặt sau (giữ nguyên format/ảnh/audio/video)
- ✅ Tên Page → Tên Deck (tự động)
- ✅ Smart Update:
  - Thẻ cũ trùng mặt trước → Cập nhật mặt sau
  - Thẻ mới → Thêm vào deck
- ✅ Hiển thị "Synced ✓" sau khi hoàn tất

## 📂 Files mới

1. **notion-sync.js** - Script xử lý Notion integration
2. **pdf-support.js** - Script xử lý PDF features
3. **README-v2.1.md** - Tài liệu hướng dẫn đầy đủ
4. **CHANGELOG-v2.1.md** - Chi tiết các thay đổi
5. **TESTING-GUIDE.md** - Hướng dẫn test từng tính năng

## 🔧 Files đã cập nhật

1. **manifest.json**:
   - Version: 2.0.0 → 2.1.0
   - Thêm content scripts cho Notion và PDF
   - Thêm permission "tabs"

2. **background.js**: Không thay đổi (vẫn hoạt động tốt)

3. **content.js**: Không thay đổi (vẫn hoạt động tốt)

## 📦 Cài đặt

### Từ ZIP file
1. Giải nén `AddFlashcard-v2.1.0.zip`
2. Chrome/Edge → `chrome://extensions/`
3. Bật Developer mode
4. Load unpacked → Chọn thư mục AddFlashcard

### Từ source
1. Copy tất cả files vào thư mục `AddFlashcard`
2. Load unpacked như trên

## 🎯 Use Cases

### Học sinh / Sinh viên
```
Sách giáo khoa PDF → Extract text → Tạo flashcards
Ghi chú Notion → Sync toggles → Ôn tập
```

### Học ngoại ngữ
```
Từ điển online → Select word → Add to flashcard
Notion vocabulary list → Auto sync → Study
```

### Chuyên gia
```
Documentation PDF → Extract sections → Quick reference
Notion knowledge base → Sync → Team learning
```

## ✅ Checklist sử dụng

### Test PDF
- [ ] Mở file PDF
- [ ] Thấy toolbar nổi
- [ ] Chọn text → Add to Front
- [ ] Extract All Text

### Test Notion
- [ ] Mở Notion page
- [ ] Thấy nút "Sync cards"
- [ ] Tạo toggles
- [ ] Click Sync → Thấy "Synced ✓"
- [ ] Kiểm tra Manage page

### Test Web thường
- [ ] Chọn text trên web
- [ ] Right-click → AddFlashcard
- [ ] Sidebar mở
- [ ] Tạo card thành công

## 🐛 Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Nút Notion không hiện | Refresh page, đợi 2-3s |
| PDF toolbar không hiện | Đảm bảo PDF đã load xong |
| Sidebar không mở | Check extension enabled |
| Sync quá lâu | Page có quá nhiều toggles (>100) |

## 📊 File Structure

```
AddFlashcard/
├── Core files (v2.0)
│   ├── manifest.json (UPDATED)
│   ├── background.js
│   ├── content.js
│   ├── sidebar.html/css/js
│   ├── popup.html/css/js
│   └── manage.html/css/js
│
├── New features (v2.1)
│   ├── notion-sync.js (NEW)
│   └── pdf-support.js (NEW)
│
└── Documentation
    ├── README-v2.1.md (NEW)
    ├── CHANGELOG-v2.1.md (NEW)
    ├── TESTING-GUIDE.md (NEW)
    └── icons/
```

## 🔒 Privacy & Security

- ✅ 100% Local storage (Chrome storage API)
- ✅ Không gửi data ra ngoài
- ✅ Không tracking
- ✅ Open source - kiểm tra được code
- ✅ No external dependencies

## 🚀 Next Steps

### Sau khi cài đặt
1. Test trên web thường (Wikipedia, Google)
2. Test với PDF (local hoặc online)
3. Test với Notion page
4. Explore Manage page

### Tips
- Tạo toggles có structure trong Notion để tổ chức tốt
- Dùng "Extract All Text" cho PDF textbook
- Export data thường xuyên để backup

## 💡 Pro Tips

### Notion Workflow
```
1. Tạo page cho mỗi topic
2. Mỗi toggle = 1 concept với explanation
3. Thêm ảnh/video vào toggle content
4. Click Sync → Instant flashcards!
```

### PDF Workflow
```
1. Mở PDF sách giáo khoa
2. Đọc và highlight key points
3. Select → Add to Front/Back
4. Hoặc Extract All → Copy vào Notion → Sync
```

### Web Workflow
```
1. Research trên Google
2. Select important info
3. Right-click → Send to Front/Back
4. Build knowledge base
```

## 📞 Support

- Issues: GitHub Issues (nếu có repo)
- Questions: Xem TESTING-GUIDE.md
- Features: Suggest via feedback

---

**Version**: 2.1.0  
**Release Date**: Feb 2, 2026  
**Compatibility**: Chrome, Edge, Brave (Chromium-based)  
**License**: MIT

**Enjoy learning with AddFlashcard! 🎓✨**
