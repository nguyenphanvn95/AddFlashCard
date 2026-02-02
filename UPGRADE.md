# Hướng dẫn nâng cấp từ v1.0 lên v2.0

## Tính năng mới trong v2.0

### 🎯 1. Sidebar thay thế Popup
- **Trước đây (v1.0)**: Click icon extension → Popup mở ra
- **Bây giờ (v2.0)**: Sidebar xuất hiện bên phải trang web
- **Lợi ích**: Không cần chuyển tab, không che khuất nội dung

### 📚 2. Hệ thống quản lý Decks
- Tạo nhiều decks để phân loại flashcards
- Đổi tên, xóa decks
- Chọn deck trước khi tạo card

### 📊 3. Trang quản lý chuyên nghiệp
- Xem tất cả cards theo deck
- Tìm kiếm, sắp xếp
- Preview card trước khi sửa
- Chỉnh sửa nội dung card
- Export/Import dữ liệu

### 📈 4. Thống kê
- Xem số lượng cards trong mỗi deck
- Tổng số cards
- Cập nhật real-time

## Cách nâng cấp

### Bước 1: Backup dữ liệu (QUAN TRỌNG!)

**Nếu bạn đang dùng v1.0:**
1. Mở Chrome DevTools (F12)
2. Vào tab Console
3. Paste và chạy code sau:
```javascript
chrome.storage.local.get(['cards'], (result) => {
  const data = JSON.stringify(result.cards, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flashcards-backup-v1.json';
  a.click();
});
```
4. File backup sẽ được tải về

### Bước 2: Gỡ phiên bản cũ
1. Truy cập `chrome://extensions/`
2. Tìm AddFlashcard (v1.0)
3. Click **Remove**
4. Confirm xóa

### Bước 3: Cài đặt phiên bản mới
1. Giải nén `AddFlashcard-v2.0.zip`
2. Truy cập `chrome://extensions/`
3. Bật **Developer mode**
4. Click **Load unpacked**
5. Chọn thư mục `AddFlashcard`

### Bước 4: Import dữ liệu cũ (nếu có)

**Cách 1: Import trực tiếp (Khuyên dùng)**
1. Click icon extension → Trang quản lý mở ra
2. Click nút **Import** ở header
3. Chọn file backup đã tải ở Bước 1
4. Confirm import

**Cách 2: Import thủ công qua Console**
1. Mở trang quản lý
2. Mở DevTools (F12) → Console
3. Paste code sau (thay `YOUR_BACKUP_DATA` bằng nội dung file backup):
```javascript
const oldCards = YOUR_BACKUP_DATA; // Paste nội dung file backup vào đây
const newCards = oldCards.map(card => ({
  ...card,
  deck: card.deck || 'Default'
}));

chrome.storage.local.get(['decks'], (result) => {
  const decks = result.decks || ['Default'];
  chrome.storage.local.set({ 
    cards: newCards,
    decks: decks
  }, () => {
    console.log('Import complete!');
    location.reload();
  });
});
```

## Sự khác biệt giữa v1.0 và v2.0

| Tính năng | v1.0 | v2.0 |
|-----------|------|------|
| Giao diện chính | Popup | Sidebar |
| Vị trí | Center popup | Bên phải trang web |
| Quản lý Decks | Chỉ input text | Dropdown + Tạo/Sửa/Xóa |
| Xem cards | Trong popup | Trang quản lý chuyên nghiệp |
| Chỉnh sửa cards | Không có | Có editor đầy đủ |
| Tìm kiếm | Không có | Có |
| Sắp xếp | Không có | Theo thời gian/A-Z |
| Preview | Không có | Modal preview |
| Export/Import | Không có | Có |
| Thống kê | Không có | Hiển thị theo deck |
| Icon click | Mở popup | Mở trang quản lý |

## Cách sử dụng v2.0

### Workflow mới (Khuyên dùng)
1. **Duyệt web và gặp nội dung muốn lưu**
2. **Bôi đen → Chuột phải → Send to Front/Back**
3. **Sidebar tự động mở**, chọn deck
4. **Click ADD CARD**
5. **Quản lý sau trong trang Manage**

### Quản lý cards
1. Click icon extension
2. Trang quản lý mở ra
3. Chọn deck ở sidebar trái
4. Tìm kiếm, preview, edit, delete

### Tạo deck mới
**Trong sidebar:**
- Click **+ New Deck** → Nhập tên

**Trong trang quản lý:**
- Click **+** bên cạnh "Decks" → Nhập tên

## Giải quyết vấn đề

### Dữ liệu không chuyển sang được
1. Đảm bảo đã backup đúng cách
2. Check file backup có đúng format JSON không
3. Thử import bằng Cách 2 (thủ công)

### Sidebar không mở
1. Refresh trang web (F5)
2. Check extension có enabled không
3. Thử disable rồi enable lại

### Context menu không hiện
1. Gỡ và cài lại extension
2. Restart Chrome
3. Check permissions trong manifest.json

### Icon click không mở trang quản lý
1. Check có lỗi trong Console không
2. Reinstall extension
3. Đảm bảo file manage.html có trong thư mục

## Lời khuyên

### Backup thường xuyên
Dùng tính năng **Export** trong trang quản lý để backup định kỳ:
- Click **Export** → File JSON tải về
- Lưu file này ở nơi an toàn
- Có thể import lại bất cứ lúc nào

### Sử dụng Decks hiệu quả
- Tạo deck theo chủ đề (Tiếng Anh, Toán, Lịch sử...)
- Tạo deck theo độ khó (Easy, Medium, Hard)
- Tạo deck theo tiến độ học (Todo, In Progress, Mastered)

### Keyboard shortcuts
Vào `chrome://extensions/shortcuts` để set phím tắt:
- Mở/đóng sidebar nhanh
- Mở trang quản lý

## Hỗ trợ

Nếu gặp vấn đề:
1. Check file README.md mới
2. Xem file INSTALL.md
3. Reinstall extension
4. Check Console errors (F12)

## Kết luận

v2.0 là bản nâng cấp lớn với nhiều tính năng mới:
- ✅ Sidebar tiện lợi hơn popup
- ✅ Quản lý decks chuyên nghiệp
- ✅ Trang quản lý đầy đủ tính năng
- ✅ Export/Import dữ liệu
- ✅ UI/UX tốt hơn nhiều

Hãy dành 5 phút để làm quen với workflow mới - bạn sẽ thấy hiệu quả hơn rất nhiều!

---

**Chúc bạn học tập hiệu quả với AddFlashcard v2.0! 🎉**
