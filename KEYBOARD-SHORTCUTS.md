# Keyboard Shortcuts Guide - AddFlashcard v2.4.1

## 🎯 Overview

AddFlashcard v2.4.1 hỗ trợ **25+ keyboard shortcuts** để tăng tốc độ làm việc. Shortcuts được chia thành 3 nhóm:

1. **Global Shortcuts**: Hoạt động trên mọi trang web
2. **Editor Shortcuts**: Hoạt động trong các ô nhập text (Front/Back)
3. **Study Mode Shortcuts**: Hoạt động trong Study Mode

---

## 🌍 Global Shortcuts

Shortcuts hoạt động **trên mọi trang web** khi extension được kích hoạt:

### Alt+Q: Toggle Sidebar

**Chức năng**: Mở hoặc đóng sidebar

**Khi nào dùng**:
- Muốn mở sidebar nhanh mà không cần click extension icon
- Muốn đóng sidebar nhanh hơn click nút X
- Đang duyệt web và muốn tạo card ngay

**Workflow**:
```
1. Đang đọc bài → nhấn Alt+Q
2. Sidebar mở ra
3. Tạo card
4. Nhấn Alt+Q lại để đóng
```

### Alt+A: Send Selected Text to Front

**Chức năng**: Thêm text đang chọn vào trường Front

**Khi nào dùng**:
- Muốn tạo câu hỏi từ text trên web
- Cần copy nhanh định nghĩa, thuật ngữ
- Đang highlight text quan trọng

**Workflow**:
```
1. Bôi chọn text: "What is Python?"
2. Nhấn Alt+A
3. Sidebar tự động mở (nếu đang đóng)
4. Text xuất hiện ở trường Front
5. Tiếp tục thêm answer vào Back
```

**Smart behavior**:
- Nếu Front đang trống → Text điền vào
- Nếu Front có nội dung → Text thêm xuống dòng mới

### Alt+B: Send Selected Text to Back

**Chức năng**: Thêm text đang chọn vào trường Back

**Khi nào dùng**:
- Muốn tạo câu trả lời từ text trên web
- Cần copy giải thích, example
- Đang highlight đoạn văn dài

**Workflow**:
```
1. Bôi chọn text giải thích
2. Nhấn Alt+B
3. Text xuất hiện ở trường Back
4. Card gần như hoàn thành!
```

**Tip**: Combine Alt+A và Alt+B
```
Step 1: Select question text → Alt+A
Step 2: Select answer text → Alt+B
Step 3: Click "ADD CARD" hoặc Ctrl+Enter
Done in 3 steps!
```

---

## ✏️ Editor Shortcuts

Shortcuts hoạt động khi cursor đang ở trong **Front hoặc Back editor**:

### Text Formatting

#### Ctrl+B: Bold (In đậm)

**Chức năng**: Làm đậm text được chọn

**Cách dùng**:
```
Method 1 (Select then format):
1. Gõ text: "Important concept"
2. Bôi chọn "Important"
3. Nhấn Ctrl+B
4. Result: Important concept

Method 2 (Format then type):
1. Nhấn Ctrl+B
2. Gõ text: "Bold text"
3. Nhấn Ctrl+B lại để tắt
4. Result: Bold text normal text
```

#### Ctrl+I: Italic (In nghiêng)

**Chức năng**: Làm nghiêng text được chọn

**Khi nào dùng**:
- Nhấn mạnh từ khóa
- Tên sách, phim, bài hát
- Từ tiếng nước ngoài
- Biến số trong công thức

**Example**:
```
Front: "What is E = mc²?"
Back: "Energy equals mass times 
       speed of light squared"
       (select "E", "m", "c" → Ctrl+I)
```

#### Ctrl+U: Underline (Gạch chân)

**Chức năng**: Gạch chân text được chọn

**Khi nào dùng**:
- Highlight thuật ngữ quan trọng
- Đánh dấu phần cần nhớ
- Tạo emphasis

#### Ctrl+Shift+S: Strikethrough (Gạch ngang)

**Chức năng**: Gạch ngang text (như ~~này~~)

**Khi nào dùng**:
- Đánh dấu misconception
- Text so sánh (sai vs đúng)
- Deprecated terms

**Example**:
```
Back: "Python 2 is deprecated.
       Use Python 3 instead."
       (select "Python 2" → Ctrl+Shift+S)
```

### Font Size

#### Ctrl+]: Increase Font Size

**Chức năng**: Tăng cỡ chữ của text được chọn

**Khi nào dùng**:
- Làm nổi bật tiêu đề
- Tăng size công thức
- Nhấn mạnh từ khóa

**Example**:
```
Front: "Pythagorean Theorem"
       (select all → Ctrl+] 2 lần)
       → Larger title text
```

#### Ctrl+[: Decrease Font Size

**Chức năng**: Giảm cỡ chữ của text được chọn

**Khi nào dùng**:
- Text phụ, ghi chú
- Citations, references
- Sub-explanations

### Lists

#### Ctrl+Shift+L: Bullet List

**Chức năng**: Tạo danh sách gạch đầu dòng

**Cách dùng**:
```
Method 1 (Convert existing):
1. Gõ text trên nhiều dòng:
   Line 1
   Line 2
   Line 3
2. Select all
3. Ctrl+Shift+L
4. Result:
   • Line 1
   • Line 2
   • Line 3

Method 2 (Create as you type):
1. Nhấn Ctrl+Shift+L
2. Gõ item 1
3. Enter → tự động bullet mới
4. Gõ item 2
5. Enter → bullet mới
```

**Example use case**:
```
Front: "List 3 types of loops in Python"
Back: (Ctrl+Shift+L)
      • for loop
      • while loop
      • do-while loop
```

#### Ctrl+Shift+N: Numbered List

**Chức năng**: Tạo danh sách đánh số

**Khi nào dùng**:
- Steps, procedures
- Rankings
- Sequential information

**Example**:
```
Front: "Steps to create Flask app"
Back: (Ctrl+Shift+N)
      1. Install Flask
      2. Create app.py
      3. Define routes
      4. Run app
```

### Text Alignment

#### Ctrl+L: Left Align

**Chức năng**: Căn trái (default)

#### Ctrl+E: Center Align

**Chức năng**: Căn giữa text

**Khi nào dùng**:
- Tiêu đề chính
- Công thức quan trọng
- Diagrams, figures

**Example**:
```
Front: (Ctrl+E)
       "PHOTOSYNTHESIS"
       (centered title)
```

#### Ctrl+R: Right Align

**Chức năng**: Căn phải text

**Khi nào dùng**:
- Quotes, citations
- Author attribution
- Dates

### Special Formatting

#### Ctrl+K: Insert Link

**Chức năng**: Chèn hyperlink

**Workflow - Có text được chọn**:
```
1. Gõ: "Read more on Wikipedia"
2. Select "Wikipedia"
3. Nhấn Ctrl+K
4. Prompt: "Enter URL:"
5. Gõ: https://wikipedia.org
6. Result: Read more on Wikipedia (clickable)
```

**Workflow - Không có text được chọn**:
```
1. Nhấn Ctrl+K
2. Prompt 1: "Enter URL:" → https://example.com
3. Prompt 2: "Enter link text:" → Visit Example
4. Result: Visit Example (clickable)
```

**Use cases**:
- Reference sources
- Related articles
- Video explanations
- Online tools

#### Ctrl+Shift+C: Code Block

**Chức năng**: Format text như code

**Cách dùng**:
```
1. Gõ: "print('Hello')"
2. Select code
3. Nhấn Ctrl+Shift+C
4. Result: Monospace, colored background
```

**Styling**:
- Font: Courier New, monospace
- Background: Dark (#0f172a)
- Text color: Yellow (#fbbf24)
- Padding & border-radius

**Use cases**:
- Code snippets
- Commands
- File paths
- Variable names

#### Ctrl+Space: Clear Formatting

**Chức năng**: Xóa TẤT CẢ formatting

**Khi nào dùng**:
- Text bị format lỗi
- Paste từ nguồn khác (giữ plain text)
- Reset về default
- Cleanup before re-formatting

**Example**:
```
Before: Bold Italic Underline Big Small
After Ctrl+Space: Bold Italic Underline Big Small
(all plain text)
```

---

## 📚 Study Mode Shortcuts

Shortcuts trong Study Mode (unchanged từ v2.4.0):

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Space` | Flip card | Lật từ Front sang Back |
| `Enter` | Flip card | Alternative để flip |
| `←` | Previous | Card trước đó |
| `→` | Next | Card tiếp theo |

### Difficulty Rating

| Shortcut | Action | Description |
|----------|--------|-------------|
| `1` | Hard | Khó, cần review lại |
| `2` | Good | Ổn, vừa phải |
| `3` | Easy | Dễ, đã nhớ rõ |

### Control

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | Exit | Thoát Study Mode |

---

## 💡 Pro Tips & Tricks

### Tip 1: Quick Card Creation Workflow
```
1. Alt+Q (open sidebar)
2. Type question in Front
3. Ctrl+B for key terms
4. Tab to Back field
5. Type answer
6. Ctrl+K to add reference
7. Ctrl+Enter to save
8. Alt+Q (close sidebar)
```

### Tip 2: Copy from Web Efficiently
```
Method 1 - Separate Q&A:
1. Highlight question → Alt+A
2. Highlight answer → Alt+B
3. Done!

Method 2 - Multi-part Answer:
1. Highlight question → Alt+A
2. Highlight part 1 → Alt+B
3. Highlight part 2 → Alt+B (adds below)
4. Highlight part 3 → Alt+B
5. Done! Multi-paragraph answer
```

### Tip 3: Formatting Combination
```
Bold + Italic:
1. Select text
2. Ctrl+B
3. Ctrl+I (while still selected)
4. Result: Bold AND Italic

Large + Bold + Centered:
1. Select text
2. Ctrl+] (increase size)
3. Ctrl+B (bold)
4. Ctrl+E (center)
5. Result: Big bold centered title
```

### Tip 4: List from Paragraph
```
Have paragraph:
"Python is easy. Java is verbose. C is fast."

Want list:
1. Replace periods with newlines:
   Python is easy
   Java is verbose
   C is fast
2. Select all
3. Ctrl+Shift+L (bullet list)
4. Done!
```

### Tip 5: Link-heavy Card
```
Creating card with multiple references:

1. Type main content
2. At end of each fact:
   - Select source name
   - Ctrl+K → add link
3. Repeat for each source
4. Result: Card with inline citations
```

### Tip 6: Math/Science Cards
```
For formulas:
1. Type formula
2. Select variables → Ctrl+I (italic)
3. Select entire formula → Ctrl+] (bigger)
4. Ctrl+E (center)
5. Result: Beautiful centered formula

For equations with explanation:
1. Formula at top (formatted as above)
2. Below: explanation
3. Below: example
4. Select example → Ctrl+Shift+C (code style)
```

### Tip 7: Multi-source Learning
```
When reading multiple sources:

Source 1 - Definition:
1. Select definition → Alt+A

Source 2 - Example:
2. Select example → Alt+B

Source 3 - More context:
3. Alt+Q (open if closed)
4. Click in Back field
5. Select more info → paste
6. Ctrl+K on source name → add link

Result: Rich card with multiple sources
```

---

## ⚙️ Shortcuts Cheat Sheet

### Printable Version

```
╔═══════════════════════════════════════════════════════════╗
║        AddFlashcard v2.4.1 - SHORTCUTS CHEAT SHEET       ║
╠═══════════════════════════════════════════════════════════╣
║ GLOBAL (Anywhere on web)                                 ║
║   Alt+Q       Toggle sidebar                              ║
║   Alt+A       Send selected → Front                       ║
║   Alt+B       Send selected → Back                        ║
╠═══════════════════════════════════════════════════════════╣
║ TEXT STYLE (In editors)                                   ║
║   Ctrl+B      Bold                                        ║
║   Ctrl+I      Italic                                      ║
║   Ctrl+U      Underline                                   ║
║   Ctrl+⇧+S    Strikethrough                               ║
╠═══════════════════════════════════════════════════════════╣
║ FONT SIZE (In editors)                                    ║
║   Ctrl+]      Increase                                    ║
║   Ctrl+[      Decrease                                    ║
╠═══════════════════════════════════════════════════════════╣
║ LISTS (In editors)                                        ║
║   Ctrl+⇧+L    Bullet list                                 ║
║   Ctrl+⇧+N    Numbered list                               ║
╠═══════════════════════════════════════════════════════════╣
║ ALIGNMENT (In editors)                                    ║
║   Ctrl+L      Left                                        ║
║   Ctrl+E      Center                                      ║
║   Ctrl+R      Right                                       ║
╠═══════════════════════════════════════════════════════════╣
║ INSERT (In editors)                                       ║
║   Ctrl+K      Link                                        ║
║   Ctrl+⇧+C    Code block                                  ║
╠═══════════════════════════════════════════════════════════╣
║ CLEAR (In editors)                                        ║
║   Ctrl+Space  Remove all formatting                       ║
╠═══════════════════════════════════════════════════════════╣
║ STUDY MODE                                                ║
║   Space       Flip card                                   ║
║   ← →         Navigate                                    ║
║   1 2 3       Rate difficulty                             ║
║   Esc         Exit                                        ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Formatting (2 minutes)
```
Goal: Master text styling shortcuts

1. Open sidebar (Alt+Q)
2. In Front field, type: "Python Programming"
3. Select "Python" → Ctrl+B (bold)
4. Select "Programming" → Ctrl+I (italic)
5. Select all → Ctrl+] (bigger)
6. Practice Ctrl+U, Ctrl+Shift+S on other text
```

### Exercise 2: Quick Web Capture (3 minutes)
```
Goal: Master Alt+A and Alt+B

1. Open Wikipedia article
2. Find a good definition
3. Select title/question → Alt+A
4. Select definition paragraph → Alt+B
5. Repeat 3 times with different articles
6. Check created cards in Manage page
```

### Exercise 3: Rich Formatting (5 minutes)
```
Goal: Create beautifully formatted card

Task: Create card about "Photosynthesis"

Front:
- Title: "PHOTOSYNTHESIS" (Ctrl+B, Ctrl+], Ctrl+E)
- Subtitle: "Definition" (Ctrl+I)

Back:
- Definition paragraph
- Section: "Steps:" (Ctrl+B)
- Numbered list (Ctrl+Shift+N):
  1. Light absorption
  2. Water splitting
  3. Carbon fixation
- Formula: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
  (Ctrl+Shift+C for code style, Ctrl+E for center)
- Link to source (Ctrl+K)
```

### Exercise 4: Speed Test (1 minute)
```
Goal: Create 5 cards as fast as possible

Use only shortcuts:
- Alt+Q to open/close
- Alt+A for questions
- Alt+B for answers
- Ctrl+B for key terms
- Ctrl+K for sources

Time yourself! Target: under 1 minute
```

---

## ❓ FAQ

### Q: Shortcuts không hoạt động?

**A**: Check these:
1. Cursor phải ở trong editor (for editor shortcuts)
2. Extension phải được enable
3. Không có extension khác conflict
4. Reload page và thử lại
5. Check browser console for errors

### Q: Ctrl+L mở address bar thay vì left align?

**A**: Code đã có preventDefault() nhưng nếu vẫn xảy ra:
- Click vào editor trước
- Hoặc dùng mouse để align
- Report bug để fix

### Q: Có thể customize shortcuts không?

**A**: Hiện tại chưa có, planned cho v2.5.0

### Q: Conflict với browser shortcuts?

**A**: Một số shortcuts có thể conflict:
- Ctrl+K: Browser search (đã override)
- Ctrl+L: Address bar (đã override)
- Ctrl+R: Reload (đã override)
- Alt keys: Rarely conflict

Nếu có issue, report để adjust.

### Q: Shortcuts cho mobile?

**A**: Mobile không hỗ trợ keyboard shortcuts, nhưng có thể dùng:
- Touch gestures (future feature)
- On-screen keyboard nếu có physical keyboard

### Q: Có thể disable shortcuts?

**A**: Hiện tại không, nhưng có thể không dùng :)
Future: Settings để toggle on/off

---

## 📚 Resources

- **Full Changelog**: CHANGELOG-v2.4.1.md
- **User Guide**: README-v2.4.md
- **Quick Start**: QUICK-START-v2.4.md
- **GitHub Issues**: Report bugs & request features

---

**Master these shortcuts và bạn sẽ tạo cards nhanh gấp 3 lần!** 🚀

Practice makes perfect. Happy shortcut-ing! ⌨️✨
