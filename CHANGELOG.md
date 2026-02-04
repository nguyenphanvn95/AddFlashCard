# CHANGELOG

## [2.1] - 2026-02-03

### 🔧 Fixed
- **Study Mode Layout**: Sửa nội dung thẻ dài bị tràn - thêm scrollbar cho card content
- **Fixed Controls**: Rating buttons (Easy/Hard/Good/Again) giờ cố định ở dưới màn hình
- **Show Answer Button**: Cũng được cố định ở dưới, không bị cuộn mất
- **Card Height**: Responsive với viewport, không bao giờ overflow
- **Scrollbar**: Custom scrollbar đẹp với fade effects

### 🎨 Improved
- **Fade Effects**: Gradient fade ở đầu/cuối content khi scroll
- **Card Layout**: Optimized flexbox layout cho better content distribution
- **Controls Background**: Gradient với backdrop-filter blur
- **Theme Support**: Scrollbar và fade effects match với Light/Dark theme

### 📱 Responsive
- Card và controls responsive với tất cả screen sizes
- Touch-friendly scrolling trên mobile
- Optimal spacing cho desktop và tablet

## [2.0] - 2026-02-03

### ✨ Added
- **Theme System**: Thêm hệ thống theme với 3 chế độ (System, Light, Dark)
- **Auto Theme Sync**: Theme tự động đồng bộ giữa sidebar, manage và study pages
- **System Theme Detection**: Tự động theo dõi theme hệ điều hành
- **Theme CSS Files**: 
  - `sidebar.css` (completely rewritten)
  - `study-theme.css` (new)
  - `manage-theme.css` (new)

### 🔧 Fixed
- **Study Mode Counts**: Sửa chức năng đếm thẻ New/Learning/Review không hoạt động
- **Queue Updates**: Đảm bảo queue counts cập nhật real-time sau mỗi câu trả lời
- **Theme Persistence**: Theme preference được lưu và load chính xác

### 🎨 Changed
- **Sidebar Settings**: Thay đổi từ "Day/Night" sang "System/Light/Dark"
- **Default Theme**: Đặt Light theme làm mặc định (thay vì Dark)
- **UI Colors**: Cải thiện color scheme cho cả Light và Dark mode
- **Transitions**: Thêm smooth transitions khi chuyển đổi theme

### 📱 UI Improvements

#### Light Theme
- Clean white backgrounds
- Soft shadows for depth
- High contrast text (#0f172a on white)
- Subtle borders (#e2e8f0)
- Professional gradient backgrounds
- Accent color: #3b82f6 (blue)

#### Dark Theme  
- Deep blue backgrounds (#0f172a, #1e293b)
- Comfortable text colors (#f1f5f9)
- Enhanced shadows for depth
- Subtle borders (#334155)
- Modern dark gradients
- Same accent color for consistency

### 🔄 Architecture Changes
- Theme logic centralized in each page's JS file
- Chrome storage listeners for cross-page sync
- System theme media query listeners
- Modular CSS structure with theme variables

### 📊 Study Mode Enhancements
- Immediate count updates after each answer
- Better queue management
- Improved progress tracking
- More accurate statistics display

### 🛠️ Technical Improvements
- CSS custom properties (CSS variables) for easy theming
- Efficient class toggling for theme changes
- No page reload required for theme changes
- localStorage caching for instant theme application

### 📝 Documentation
- Comprehensive README-UPGRADES.md
- Detailed CHANGELOG.md
- Inline code comments for theme logic
- Usage instructions for new features

---

## Previous Version [1.x]
- Original extension features
- Basic styling (dark mode only)
- Study mode with SM-2 algorithm
- Card management
- Anki integration
- PDF support
- Rich text editing
