# AddFlashCard Extension - Phiên bản nâng cấp

## 🎨 Các cải tiến chính

### 1. Hệ thống Theme mới (Light/Dark/System)

#### Tính năng:
- **3 chế độ theme**: Light, Dark, và Follow System
- Theme được đồng bộ tự động giữa tất cả các trang (sidebar, manage, study)
- Tự động theo dõi theme hệ thống khi chọn "System"
- Thiết kế UI hiện đại và chuyên nghiệp cho cả 2 theme

#### Cách sử dụng:
1. Mở sidebar → Click nút Settings (⚙️)
2. Chọn theme mong muốn: System / Light / Dark
3. Theme sẽ tự động áp dụng cho tất cả các trang

#### Mặc định:
- Theme Light được thiết lập làm mặc định
- Bạn có thể thay đổi trong Settings

### 2. Sửa chức năng đếm thẻ trong Study Mode

#### Vấn đề đã sửa:
- Số lượng thẻ New, Learning, Review không cập nhật chính xác
- Queue counts không được refresh sau mỗi hành động

#### Giải pháp:
- Thêm logic cập nhật `updateQueueCounts()` vào hàm `answerCard()`
- Đảm bảo counts được cập nhật ngay lập tức sau mỗi câu trả lời
- Cải thiện hiển thị progress và statistics

## 📁 Cấu trúc file mới

### Files đã thay đổi:

1. **sidebar.html**
   - Thay đổi theme buttons: Day/Night → System/Light/Dark
   - Cập nhật mô tả setting

2. **sidebar.js**
   - Thêm logic theme với 3 chế độ
   - Hỗ trợ theo dõi system theme preference
   - Đồng bộ theme qua chrome.storage

3. **sidebar.css** (Hoàn toàn mới)
   - CSS variables cho Light và Dark theme
   - Smooth transitions giữa các themes
   - UI hiện đại với shadows và colors tối ưu

4. **study.html**
   - Thêm theme selector vào Settings modal
   - Import file `study-theme.css`

5. **study.js**
   - Thêm hàm `initTheme()` và `applyTheme()`
   - Cải thiện `answerCard()` để cập nhật counts
   - Lắng nghe thay đổi theme từ chrome.storage

6. **study-theme.css** (File mới)
   - Theme variables cho study page
   - Light và Dark theme styles
   - Tương thích với study.css hiện có

7. **manage.html**
   - Import file `manage-theme.css`

8. **manage.js**
   - Thêm logic theme tương tự study.js
   - Auto-sync theme khi thay đổi

9. **manage-theme.css** (File mới)
   - Theme styles cho manage page
   - Đồng bộ với design system chung

## 🎯 Cách cài đặt

1. Giải nén folder `AddFlashCard-upgraded`
2. Mở Chrome → Extensions → Enable "Developer mode"
3. Click "Load unpacked" → Chọn folder `AddFlashCard-upgraded`
4. Extension sẽ được cài đặt với tất cả tính năng mới

## ✨ Điểm nổi bật

### Theme System
- **Tự động theo dõi**: Khi chọn "System", extension tự động chuyển đổi theo theme hệ điều hành
- **Đồng bộ toàn cục**: Thay đổi theme ở bất kỳ đâu sẽ áp dụng cho tất cả các trang
- **Smooth transitions**: Chuyển đổi mượt mà giữa các themes
- **Professional design**: UI được thiết kế cẩn thận cho cả Light và Dark mode

### Light Theme
- Background: Gradient từ #e0e7ff đến #ede9fe
- Cards: Trắng tinh với shadow nhẹ
- Text: Dark với contrast cao
- Borders: Soft và subtle
- Perfect cho môi trường sáng

### Dark Theme
- Background: Deep blue gradient (#0f172a → #1e293b)
- Cards: Dark với subtle borders
- Text: Sáng với readability tốt
- Shadows: Đậm hơn để tạo depth
- Perfect cho làm việc ban đêm

### Study Mode Improvements
- Real-time count updates
- Accurate queue tracking
- Better progress visualization
- Immediate feedback sau mỗi câu trả lời

## 🔧 Technical Details

### Chrome Storage Keys
- `afc_theme`: Stores theme preference (system/light/dark)
- `afc_overlay_opacity`: Sidebar overlay opacity
- `afc_dock_side`: Sidebar dock position

### Theme Application Flow
```
User clicks theme button
    ↓
setTheme(theme) called
    ↓
Save to chrome.storage
    ↓
applyTheme(theme) called
    ↓
Check if 'system' → Read system preference
    ↓
Apply classes to document.documentElement and body
    ↓
All pages listen to storage changes → Auto update
```

### Study Counts Fix
```
User answers card with quality rating
    ↓
answerCard(card, quality) called
    ↓
Update card scheduling (SM-2 algorithm)
    ↓
Update session stats
    ↓
Re-organize queues if needed
    ↓
Call updateQueueCounts() immediately
    ↓
UI displays updated counts
```

## 📝 Notes

- Theme preference được lưu trong chrome.storage.local
- Extension tự động sync theme giữa tất cả tabs
- Không cần restart extension khi thay đổi theme
- Compatible với tất cả tính năng hiện có

## 🚀 Future Improvements

Có thể thêm trong tương lai:
- Theme customization options
- Accent color picker
- Font size preferences
- Animation speed controls
- Export/Import settings

---

**Version**: 2.0  
**Date**: February 2026  
**Author**: Claude (Anthropic)
