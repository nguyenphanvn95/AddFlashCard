# Hướng dẫn Cài đặt và Kiểm tra v2.1.0

## 📦 Cài đặt Extension

### Bước 1: Chuẩn bị file
1. Đảm bảo bạn đã có đầy đủ các file sau trong thư mục `AddFlashcard`:
   ```
   AddFlashcard/
   ├── manifest.json (đã cập nhật)
   ├── background.js
   ├── content.js
   ├── notion-sync.js (MỚI)
   ├── pdf-support.js (MỚI)
   ├── sidebar.html
   ├── sidebar.css
   ├── sidebar.js
   ├── popup.html
   ├── popup.css
   ├── popup.js
   ├── manage.html
   ├── manage.css
   ├── manage.js
   ├── icons/
   │   ├── icon16.png
   │   ├── icon48.png
   │   └── icon128.png
   └── README-v2.1.md
   ```

### Bước 2: Load Extension
1. Mở Chrome hoặc Edge
2. Vào `chrome://extensions/` (Chrome) hoặc `edge://extensions/` (Edge)
3. Bật **Developer mode** (góc trên bên phải)
4. Click **Load unpacked**
5. Chọn thư mục `AddFlashcard`
6. Extension sẽ xuất hiện trong danh sách với icon

### Bước 3: Kiểm tra Permissions
- Đảm bảo extension có các permissions sau:
  - ✅ Context menus
  - ✅ Storage
  - ✅ Active tab
  - ✅ Scripting
  - ✅ Tabs

## 🧪 Test Cases - Kiểm tra từng tính năng

### ✅ Test 1: Chức năng Web cơ bản (Đã có từ v2.0)

#### Test 1.1: Chọn text và Send to Front
1. Mở bất kỳ trang web nào (ví dụ: Wikipedia)
2. Chọn một đoạn văn bản
3. Click chuột phải → **AddFlashcard** → **Send to Front**
4. **Kết quả mong đợi**: 
   - Sidebar mở ra từ bên phải
   - Text đã chọn xuất hiện trong Front editor
   - Format text được giữ nguyên (bold, italic, links)

#### Test 1.2: Chọn ảnh và Send to Back
1. Tìm một trang có ảnh
2. Click chuột phải vào ảnh → **AddFlashcard** → **Send to Back**
3. **Kết quả mong đợi**:
   - Sidebar mở
   - Ảnh xuất hiện trong Back editor
   - URL ảnh là absolute URL

### ✅ Test 2: PDF Support (TÍNH NĂNG MỚI)

#### Test 2.1: Mở PDF và kiểm tra Toolbar
1. Mở một file PDF (local hoặc online)
   - Ví dụ: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
2. Đợi PDF load xong (2-3 giây)
3. **Kết quả mong đợi**:
   - Toolbar nổi xuất hiện ở góc dưới bên phải
   - 3 nút: "Add to Front", "Add to Back", "Extract All Text"
   - Hover vào các nút có hiệu ứng

#### Test 2.2: Chọn text trong PDF
1. Chọn một đoạn text trong PDF
2. Click nút **"Add to Front"** trên toolbar
3. **Kết quả mong đợi**:
   - Notification "Added to front" xuất hiện
   - Sidebar mở với text đã chọn
   - Selection được clear

#### Test 2.3: Extract All Text
1. Click nút **"Extract All Text"** trên toolbar
2. **Kết quả mong đợi**:
   - Notification "Extracting text from PDF..."
   - Sau đó "Extracted text from X pages"
   - Sidebar mở với toàn bộ text, có đánh dấu "--- Page 1 ---", "--- Page 2 ---"

#### Test 2.4: Context Menu trên PDF
1. Chọn text trong PDF
2. Click chuột phải → **AddFlashcard** → **Send to Back**
3. **Kết quả mong đợi**:
   - Hoạt động giống web thường
   - Text xuất hiện trong Back editor

### ✅ Test 3: Notion Integration (TÍNH NĂNG MỚI)

#### Test 3.1: Kiểm tra Auto-inject Button
1. Mở Notion.so và login
2. Vào bất kỳ page nào của bạn
3. **Kết quả mong đợi**:
   - Đợi 2-3 giây
   - Nút **"Sync cards"** màu xanh xuất hiện bên trái nút "Share"
   - Icon flashcard + text "Sync cards"

#### Test 3.2: Tạo Toggles test
1. Trong Notion page, tạo cấu trúc sau:

```
Page Title: Test Flashcards

▶️ What is JavaScript?
   JavaScript is a programming language that enables interactive web pages.
   - Used for client-side scripting
   - Can also run on servers (Node.js)
   
▶️ What is HTML?
   HyperText Markup Language
   ![Example Image](https://example.com/image.png)
   
▶️ CSS là gì?
   Cascading Style Sheets - ngôn ngữ để style HTML
   ```css
   body { color: red; }
   ```
```

2. **Kết quả mong đợi**:
   - 3 toggles được tạo
   - Mỗi toggle có title và content

#### Test 3.3: Sync Cards lần đầu
1. Click nút **"Sync cards"**
2. **Kết quả mong đợi**:
   - Button text đổi thành "Syncing..."
   - Background màu xám
   - Sau 1-2 giây: "Synced ✓"
   - Notification: "Synced 3 cards to deck 'Test Flashcards'"
   - Sau 3 giây button quay lại "Sync cards"

#### Test 3.4: Kiểm tra Cards đã sync
1. Click icon extension trên toolbar → Mở Manage page
2. **Kết quả mong đợi**:
   - Deck "Test Flashcards" xuất hiện trong dropdown
   - Chọn deck thấy 3 cards:
     - Card 1: Front = "What is JavaScript?", Back = full content
     - Card 2: Front = "What is HTML?", Back = có ảnh
     - Card 3: Front = "CSS là gì?", Back = có code block

#### Test 3.5: Update Card (Smart Merge)
1. Quay lại Notion page
2. Sửa toggle "What is JavaScript?" → Thay đổi content:
   ```
   JavaScript is a powerful scripting language.
   - NEW: Supports async/await
   - NEW: Has arrow functions
   ```
3. Click **"Sync cards"** lại
4. **Kết quả mong đợi**:
   - Notification: "Synced 3 cards to deck 'Test Flashcards'"
   - Vào Manage page → Card "What is JavaScript?" có content MỚI
   - Các cards khác không đổi

#### Test 3.6: Add New Card
1. Thêm toggle mới trong Notion:
   ```
   ▶️ What is React?
      A JavaScript library for building user interfaces
   ```
2. Sync lại
3. **Kết quả mong đợi**:
   - Notification: "Synced 4 cards..."
   - Deck có 4 cards
   - Card mới xuất hiện

#### Test 3.7: Test với Rich Content
1. Tạo toggle với nội dung phức tạp:
   ```
   ▶️ Rich Content Test
      **Bold text** and *italic text*
      
      Lists:
      - Item 1
      - Item 2
      
      [Link to Google](https://google.com)
      
      > Quote block
      
      ![Image](https://via.placeholder.com/300)
   ```
2. Sync
3. **Kết quả mong đợi**:
   - Card back giữ nguyên:
     - Bold và italic
     - Lists
     - Link (clickable)
     - Quote
     - Image hiển thị

### ✅ Test 4: Edge Cases

#### Test 4.1: Empty Toggles
1. Tạo toggle không có content (chỉ có title)
2. Sync
3. **Kết quả mong đợi**:
   - Card vẫn được tạo
   - Back = "<p><em>No content</em></p>"

#### Test 4.2: Duplicate Front Content
1. Tạo 2 toggles với cùng title:
   ```
   ▶️ Same Title
      Content 1
   
   ▶️ Same Title
      Content 2
   ```
2. Sync
3. **Kết quả mong đợi**:
   - Chỉ 1 card được tạo (hoặc card đầu được giữ, card sau update)

#### Test 4.3: Special Characters
1. Tạo toggle với ký tự đặc biệt:
   ```
   ▶️ <script>alert('test')</script>
      Content with & < > " '
   ```
2. Sync
3. **Kết quả mong đợi**:
   - HTML được escape properly
   - Không có XSS
   - Hiển thị đúng ký tự

#### Test 4.4: Very Long Content
1. Tạo toggle với content rất dài (>5000 characters)
2. Sync
3. **Kết quả mong đợi**:
   - Sync thành công
   - Content đầy đủ (có thể bị truncate nếu quá dài)

### ✅ Test 5: Performance

#### Test 5.1: Large Notion Page
1. Tạo page với 50-100 toggles
2. Click Sync
3. **Kết quả mong đợi**:
   - Sync hoàn tất trong 5-10 giây
   - Notification chính xác số lượng
   - Không crash browser

#### Test 5.2: Large PDF
1. Mở PDF có >100 pages
2. Click "Extract All Text"
3. **Kết quả mong đợi**:
   - Extraction hoàn tất
   - Text từ tất cả pages
   - Có thể mất 10-20 giây

### ✅ Test 6: Browser Compatibility

#### Test 6.1: Chrome
- Tất cả tính năng hoạt động ✅

#### Test 6.2: Edge
- Tất cả tính năng hoạt động ✅

#### Test 6.3: Brave (Chromium-based)
- Tất cả tính năng hoạt động ✅

## 🐛 Debugging

### Kiểm tra Console
1. Mở DevTools (F12)
2. Vào tab Console
3. Kiểm tra các log messages:
   ```
   AddFlashcard content script loaded
   Notion Sync for AddFlashcard loaded
   AddFlashcard PDF support script loaded
   ```

### Kiểm tra Network
1. Tab Network trong DevTools
2. Filter "extension"
3. Xem các requests (không nên có external requests)

### Kiểm tra Storage
1. DevTools → Application → Storage → Local Storage
2. Chọn extension URL
3. Xem keys: `cards`, `decks`

## ✅ Checklist Trước khi Release

- [ ] Tất cả test cases pass
- [ ] Console không có errors
- [ ] Permissions đúng trong manifest
- [ ] Icons hiển thị đúng
- [ ] README.md cập nhật
- [ ] CHANGELOG.md hoàn chỉnh
- [ ] Version number đúng (2.1.0)
- [ ] Zip file cho distribution
- [ ] Screenshots cho Chrome Web Store (nếu publish)

## 📸 Screenshots Cần thiết

1. **Notion Sync Button**: Screenshot nút "Sync cards" trong Notion
2. **PDF Toolbar**: Screenshot toolbar trên PDF
3. **Rich Content Card**: Card có images, links, formatting
4. **Manage Page**: Trang quản lý với multiple decks
5. **Sidebar Editor**: Sidebar đang edit card

## 🚀 Phát hành

### Tạo ZIP cho distribution
```bash
cd AddFlashcard
zip -r AddFlashcard-v2.1.0.zip . -x "*.git*" -x "node_modules/*" -x "*.md"
```

### Hoặc thủ công:
1. Chọn tất cả files trong folder (trừ .git)
2. Click chuột phải → Send to → Compressed folder
3. Đặt tên: `AddFlashcard-v2.1.0.zip`

---

**Chúc mừng! Bạn đã có extension AddFlashcard v2.1.0 với đầy đủ tính năng mới! 🎉**
