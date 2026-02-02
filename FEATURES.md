# AddFlashcard v2.0 - Tính năng đầy đủ

## 🎯 Core Features

### 1. Sidebar bên phải trang web
**Mô tả:** Giao diện tạo card xuất hiện dưới dạng sidebar ở bên phải màn hình.

**Cách hoạt động:**
- Tự động mở khi chọn "Send to Front/Back" từ context menu
- Không che khuất nội dung trang web
- Có thể đóng/mở bất cứ lúc nào
- Smooth animation

**Lợi ích:**
- Không cần chuyển tab
- Làm việc song song với nội dung web
- Tạo card nhanh hơn

**Screenshots:**
```
┌─────────────────────┬──────────────┐
│                     │  Sidebar     │
│   Website Content   │  - Deck      │
│                     │  - Front     │
│                     │  - Back      │
│                     │  - Stats     │
│                     │  - Add Card  │
└─────────────────────┴──────────────┘
```

---

### 2. Context Menu (Chuột phải)
**Mô tả:** Menu xuất hiện khi chuột phải vào văn bản hoặc ảnh.

**Chức năng:**
- **Send to Front**: Gửi nội dung vào ô Front
- **Send to Back**: Gửi nội dung vào ô Back

**Hỗ trợ:**
- ✅ Văn bản (plain text)
- ✅ Văn bản có format (HTML)
- ✅ Ảnh (URL)
- ✅ Multiple selections

**Workflow:**
```
Bôi đen text → Chuột phải 
    → AddFlashcard 
        → Send to Front ✓
        → Send to Back ✓
    → Sidebar mở tự động
    → Nội dung đã được thêm
```

---

### 3. Rich Text Editor
**Mô tả:** Trình soạn thảo văn bản với nhiều tính năng định dạng.

**Formatting:**
- **Bold (B)**: `<b>text</b>`
- **Italic (I)**: `<i>text</i>`
- **Underline (U)**: `<u>text</u>`
- **Strikethrough (S)**: `<s>text</s>`

**Lists:**
- **Bullet List (•)**: Danh sách không đánh số
- **Numbered List (1.)**: Danh sách đánh số

**Special:**
- **Link (🔗)**: Chèn hyperlink
- **Image (🖼️)**: Chèn ảnh từ URL

**Content Editable:**
- Paste content từ clipboard
- Drag & drop (limited)
- Undo/Redo (browser default)

---

### 4. Deck Management System
**Mô tả:** Hệ thống quản lý và phân loại flashcards theo chủ đề.

**Tính năng:**

**4.1. Tạo Deck**
- Trong sidebar: Click **+ New Deck**
- Trong trang quản lý: Click **+** bên cạnh "Decks"
- Nhập tên deck
- Deck tự động hiển thị trong dropdown

**4.2. Chọn Deck**
- Dropdown trong sidebar
- Click deck trong trang quản lý
- Default deck: "Default"

**4.3. Đổi tên Deck**
- Hover vào deck trong trang quản lý
- Click ✏️
- Nhập tên mới
- Tất cả cards trong deck tự động cập nhật

**4.4. Xóa Deck**
- Click 🗑️ trong trang quản lý
- Confirm dialog
- Xóa deck và TẤT CẢ cards trong đó

**4.5. View by Deck**
- Click deck để xem cards thuộc deck đó
- "All Cards" để xem tất cả

---

### 5. Statistics (Thống kê)
**Mô tả:** Hiển thị số liệu về flashcards.

**Trong Sidebar:**
```
📊 Statistics
─────────────────
English        25
Math           12
History         8
─────────────────
Total Cards    45
```

**Trong Trang Quản lý:**
- Số cards bên cạnh tên deck
- Card count trong header
- Real-time updates

---

### 6. Manage Page (Trang quản lý)
**Mô tả:** Trang chuyên dụng để quản lý tất cả cards và decks.

**Layout:**
```
┌─────────────────────────────────────────┐
│  Header (Export/Import)                 │
├──────────┬──────────────────────────────┤
│ Decks    │  Cards Grid                  │
│ Sidebar  │  ┌─────┐ ┌─────┐ ┌─────┐   │
│          │  │Card1│ │Card2│ │Card3│   │
│ • All    │  └─────┘ └─────┘ └─────┘   │
│ • Deck1  │  ┌─────┐ ┌─────┐ ┌─────┐   │
│ • Deck2  │  │Card4│ │Card5│ │Card6│   │
│          │  └─────┘ └─────┘ └─────┘   │
└──────────┴──────────────────────────────┘
```

**Tính năng:**

**6.1. View Cards**
- Grid layout
- Responsive design
- Card preview (truncated)
- Deck badge
- Date created

**6.2. Search**
- Tìm kiếm trong Front content
- Tìm kiếm trong Back content
- Tìm kiếm theo deck name
- Real-time filtering

**6.3. Sort**
- Newest first
- Oldest first
- Front A-Z

**6.4. Preview Card**
- Click 👁️
- Modal hiển thị đầy đủ nội dung
- Front | Back side-by-side
- Xem format, images, links

**6.5. Edit Card**
- Click ✏️
- Modal với editor
- Chỉnh sửa deck, front, back
- Save changes

**6.6. Delete Card**
- Click 🗑️
- Confirm dialog
- Xóa vĩnh viễn

**6.7. Delete All**
- Nút "Delete All" trong header
- Xóa tất cả cards trong deck hiện tại
- Hoặc xóa all cards nếu đang ở "All Cards"

---

### 7. Export/Import
**Mô tả:** Backup và khôi phục dữ liệu.

**7.1. Export**
- Click **Export** trong trang quản lý
- Download file JSON
- Format:
```json
{
  "cards": [...],
  "decks": [...],
  "exportDate": "2026-02-02T..."
}
```

**7.2. Import**
- Click **Import**
- Chọn file JSON
- Merge với dữ liệu hiện tại
- Tránh duplicate bằng ID

**Use cases:**
- Backup trước khi xóa extension
- Chuyển dữ liệu giữa các máy
- Share flashcards với bạn bè
- Khôi phục sau khi reinstall

---

## 🎨 UI/UX Features

### Dark Theme
- Background: `#0f172a` (Dark slate)
- Primary: `#60a5fa` (Blue)
- Text: `#e2e8f0` (Light slate)
- Accent: Various shades

### Responsive Design
- Desktop: Full layout
- Tablet: Adjusted grid
- Mobile: Single column (limited support)

### Animations
- Sidebar slide in/out
- Modal fade in/scale
- Hover effects
- Button interactions

### Accessibility
- Keyboard navigation
- Clear focus states
- Semantic HTML
- ARIA labels (can be improved)

---

## 🔧 Technical Features

### Data Storage
**Chrome Storage API:**
- `chrome.storage.local`
- No size limit (within reason)
- Persists across sessions

**Data Structure:**
```javascript
{
  cards: [
    {
      id: 1738468800000,
      deck: "English",
      front: "<p>Hello</p>",
      back: "<p>Xin chào</p>",
      createdAt: "2026-02-02T..."
    }
  ],
  decks: ["Default", "English", "Math"]
}
```

### Content Script Injection
- Sidebar injected as iframe
- Isolated from page scripts
- PostMessage communication
- No conflicts with page styles

### Background Service Worker
- Context menu creation
- Message passing
- Extension icon click handler

---

## 🚀 Performance Features

### Lazy Loading
- Cards loaded on demand
- Smooth scrolling
- Virtual scrolling (future)

### Efficient Rendering
- Only re-render changed components
- Batch updates
- Minimal DOM manipulation

### Storage Optimization
- JSON stringify/parse
- Efficient filtering
- Indexed by ID

---

## 🔐 Privacy & Security

### Local Storage Only
- No server communication
- No data sent externally
- 100% offline

### No Tracking
- No analytics
- No telemetry
- No user data collection

### Permissions
- `contextMenus`: For right-click menu
- `storage`: For saving data
- `activeTab`: For content injection
- `scripting`: For sidebar injection

---

## 🎯 Use Cases

### 1. Học ngoại ngữ
```
Workflow:
1. Đọc article tiếng Anh
2. Gặp từ mới → Bôi đen
3. Send to Front
4. Google dịch → Paste vào Back
5. Add card vào deck "English"
```

### 2. Học lập trình
```
Workflow:
1. Đọc documentation
2. Copy code snippet → Send to Front
3. Ghi chú giải thích → Send to Back
4. Add vào deck "JavaScript"
```

### 3. Ôn thi
```
Workflow:
1. Đọc sách giáo khoa
2. Câu hỏi → Send to Front
3. Đáp án → Send to Back
4. Phân loại theo môn học
```

### 4. Research
```
Workflow:
1. Đọc paper/article
2. Key point → Send to Front
3. Explanation → Send to Back
4. Organize by topic
```

---

## 📋 Shortcuts & Tips

### Keyboard Shortcuts (Future)
- `Alt + F`: Focus Front editor
- `Alt + B`: Focus Back editor
- `Ctrl + S`: Save card
- `Esc`: Close sidebar/modal

### Pro Tips
1. **Tạo deck ngay từ đầu** - Dễ organize hơn
2. **Dùng format** - Bold cho keywords, italic cho definitions
3. **Chèn ảnh** - Visual aids giúp nhớ lâu hơn
4. **Export thường xuyên** - Safety first!
5. **Search feature** - Tìm card nhanh hơn

### Best Practices
- Deck name ngắn gọn, mô tả
- Front: Câu hỏi rõ ràng
- Back: Đáp án đầy đủ nhưng súc tích
- Dùng lists cho multiple points
- Include images khi có thể

---

## 🔮 Future Features (Roadmap)

### Study Mode
- [ ] Flashcard flip animation
- [ ] Spaced repetition algorithm
- [ ] Progress tracking
- [ ] Mastery levels

### Enhanced Editor
- [ ] Code syntax highlighting
- [ ] Markdown support
- [ ] LaTeX math equations
- [ ] Audio/video embedding

### Collaboration
- [ ] Share decks với URL
- [ ] Import from Anki
- [ ] Export to Anki
- [ ] Cloud sync (optional)

### Advanced
- [ ] Tags system
- [ ] Duplicate detection
- [ ] Bulk edit
- [ ] Custom themes
- [ ] Print cards

---

## 📊 Feature Comparison

| Feature | v1.0 | v2.0 | Future |
|---------|------|------|--------|
| Create Cards | ✅ | ✅ | ✅ |
| Sidebar | ❌ | ✅ | ✅ |
| Decks | Basic | ✅ | ✅ |
| Search | ❌ | ✅ | ✅ |
| Edit | ❌ | ✅ | ✅ |
| Export | ❌ | ✅ | ✅ |
| Stats | ❌ | ✅ | ✅ |
| Study Mode | ❌ | ❌ | 🔮 |
| Spaced Rep | ❌ | ❌ | 🔮 |
| Anki Sync | ❌ | ❌ | 🔮 |

---

**Version:** 2.0.0  
**Last Updated:** February 2026  
**Author:** Claude

---

Need help? Check:
- `README.md` - Quick start guide
- `INSTALL.md` - Installation guide
- `UPGRADE.md` - Upgrade from v1.0
