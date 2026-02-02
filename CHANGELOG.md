# Changelog

All notable changes to AddFlashcard extension will be documented in this file.

## [2.0.0] - 2026-02-02

### ✨ Added
- **Sidebar Interface**: Sidebar xuất hiện bên phải trang web thay vì popup
- **Deck Management System**: Tạo, đổi tên, xóa decks
- **Manage Page**: Trang quản lý chuyên nghiệp với đầy đủ tính năng
- **Statistics**: Hiển thị số lượng cards theo từng deck
- **Search Functionality**: Tìm kiếm cards theo nội dung
- **Sort Options**: Sắp xếp theo thời gian hoặc alphabet
- **Preview Modal**: Xem toàn bộ nội dung card trước khi chỉnh sửa
- **Edit Cards**: Chỉnh sửa nội dung, deck của card
- **Export/Import**: Backup và restore dữ liệu dạng JSON
- **Auto-open Sidebar**: Tự động mở sidebar khi chọn "Send to Front/Back"
- **Deck Selector**: Dropdown chọn deck trước khi tạo card
- **Delete All**: Xóa tất cả cards trong deck hiện tại
- **Responsive Grid**: Layout cards dạng grid responsive
- **Dark Theme**: Giao diện dark theme chuyên nghiệp
- **Real-time Updates**: Statistics và UI cập nhật real-time

### 🔄 Changed
- **Main Interface**: Từ popup chuyển sang sidebar
- **Extension Icon Click**: Mở trang quản lý thay vì popup
- **Deck Input**: Từ text input sang dropdown select
- **Data Structure**: Thêm field `decks` trong storage
- **UI/UX**: Hoàn toàn redesign với dark theme

### 🐛 Fixed
- Context menu không hoạt động trên một số trang web
- Editor không giữ format khi paste
- Storage overflow khi có quá nhiều cards

### 📝 Documentation
- Thêm `FEATURES.md` - Tài liệu chi tiết tất cả tính năng
- Thêm `UPGRADE.md` - Hướng dẫn nâng cấp từ v1.0
- Cập nhật `README.md` - Hướng dẫn sử dụng v2.0
- Thêm `CHANGELOG.md` - File này

### 🗂️ Files Added
- `sidebar.html` - Giao diện sidebar
- `sidebar.css` - Style cho sidebar
- `sidebar.js` - Logic sidebar
- `manage.html` - Trang quản lý
- `manage.css` - Style trang quản lý
- `manage.js` - Logic trang quản lý
- `FEATURES.md` - Tài liệu tính năng
- `UPGRADE.md` - Hướng dẫn nâng cấp
- `CHANGELOG.md` - Lịch sử thay đổi

### 🗂️ Files Modified
- `manifest.json` - Thêm permissions, web_accessible_resources
- `background.js` - Xử lý action click, messages
- `content.js` - Inject sidebar, message handling
- `README.md` - Cập nhật hướng dẫn v2.0

### 🗂️ Files Deprecated
- `popup.html` - Vẫn giữ nhưng không dùng
- `popup.css` - Vẫn giữ nhưng không dùng
- `popup.js` - Vẫn giữ nhưng không dùng

### ⚠️ Breaking Changes
- Extension icon click behavior thay đổi (popup → manage page)
- Data structure thêm `decks` field
- Context menu message format mới

### 🔧 Technical Changes
- Từ popup architecture sang sidebar + iframe
- PostMessage communication giữa content script và sidebar
- Chrome Storage structure mới với decks array
- Service worker message handling cải thiện

---

## [1.0.0] - 2026-02-01

### ✨ Initial Release
- Context menu "Send to Front/Back"
- Rich text editor with formatting
- Popup interface
- Basic card storage
- Create and delete cards
- Simple deck input (text field)
- Card list in popup
- Dark theme UI

### 📝 Features
- Bold, Italic, Underline, Strikethrough
- Bullet list, Numbered list
- Insert links and images
- Chrome Storage API
- Context menu for text and images
- HTML content editable

### 🗂️ Initial Files
- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.css`
- `popup.js`
- `icons/` (16, 48, 128px)
- `README.md`
- `LICENSE`

---

## Upcoming Versions

### [2.1.0] - Planned
- [ ] Tags system for cards
- [ ] Bulk edit operations
- [ ] Duplicate detection
- [ ] Custom color themes
- [ ] Keyboard shortcuts
- [ ] Card templates

### [3.0.0] - Future
- [ ] Study mode with flip animations
- [ ] Spaced repetition algorithm
- [ ] Progress tracking
- [ ] Mastery levels
- [ ] Anki import/export
- [ ] Cloud sync (optional)
- [ ] Collaboration features

---

## Version Numbering

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible new features
- **PATCH** version for backwards-compatible bug fixes

Format: `MAJOR.MINOR.PATCH`

Example:
- `1.0.0` → `1.0.1` (bug fix)
- `1.0.1` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

---

## Migration Guides

### v1.0 → v2.0
See `UPGRADE.md` for detailed migration guide.

**Quick steps:**
1. Backup data from v1.0
2. Uninstall v1.0
3. Install v2.0
4. Import data

---

## Support

- **Issues**: Check Console (F12) for errors
- **Questions**: See `README.md` and `FEATURES.md`
- **Updates**: Check this file for changes

---

**Current Version:** 2.0.0  
**Last Updated:** February 02, 2026  
**Maintained by:** Claude (Anthropic)
