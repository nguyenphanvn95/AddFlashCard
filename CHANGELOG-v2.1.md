# Changelog

All notable changes to AddFlashcard extension will be documented in this file.

## [2.1.0] - 2026-02-02

### ✨ Added - New Features

#### 🔴 PDF Support
- **PDF Text Selection**: Context menu support for PDF documents (both local and online)
- **Floating Toolbar**: Auto-injected toolbar on PDF pages with three actions:
  - Add to Front: Send selected text to flashcard front
  - Add to Back: Send selected text to flashcard back
  - Extract All Text: Extract entire PDF content at once
- **PDF.js Integration**: Full compatibility with PDF.js viewer
- **Multi-page Support**: Page-by-page text extraction with page markers
- **Format Preservation**: Maintains text structure and formatting where possible

#### 🟣 Notion Integration
- **Auto Sync Button**: Automatically injects "Sync cards" button next to Share button
- **Toggle-to-Card Conversion**: Each Notion toggle becomes a flashcard:
  - Toggle title → Card front
  - Toggle content → Card back
- **Rich Content Preservation**:
  - ✅ Text formatting (bold, italic, underline, etc.)
  - ✅ Images (converted to absolute URLs)
  - ✅ Links (preserved with correct URLs)
  - ✅ Videos and audio embeds
  - ✅ Lists and nested content
- **Auto Deck Creation**: Page title automatically becomes deck name
- **Smart Merge Logic**:
  - Existing cards with matching front → Update back content
  - New cards → Add to deck
  - Prevents duplicates
- **Visual Feedback**:
  - "Syncing..." state during sync
  - "Synced ✓" confirmation for 3 seconds
  - Toast notifications for all actions
- **SPA Support**: Detects page navigation and re-injects button

#### 🔧 Technical Improvements
- **Content Script Organization**: Separate scripts for different platforms:
  - `content.js` - Core functionality for all pages
  - `notion-sync.js` - Notion-specific features
  - `pdf-support.js` - PDF-specific features
- **URL Normalization**: Converts relative URLs to absolute for all media
- **Error Handling**: Comprehensive error catching and user notifications
- **Performance**: Lazy loading and efficient DOM observation

### 🎨 Enhanced - UI/UX

#### Notifications
- New notification system for PDF and Notion:
  - Success notifications (green)
  - Error notifications (red)
  - Warning notifications (orange)
  - Info notifications (blue)
- Smooth slide-in/out animations
- Auto-dismiss after 3 seconds

#### PDF Toolbar
- Modern, floating design
- Hover effects and animations
- Responsive positioning
- Clear visual hierarchy

#### Notion Button
- Matches Notion's design language
- Color-coded states (blue → gray → blue)
- Icon for visual recognition
- Positioned before Share button

### 🔄 Changed

#### Manifest Updates
- Version bumped to 2.1.0
- Added `tabs` permission for better PDF support
- New content scripts configuration:
  - Notion scripts run on `notion.so` domains
  - PDF scripts run on all URLs with `all_frames: true`
  - Scripts load at `document_idle` for better performance

#### Storage Structure
- Cards now include:
  - `sourceType` field (web/pdf/notion)
  - `lastModified` timestamp
  - Better duplicate detection via normalized text comparison

### 🐛 Fixed

#### Media Handling
- Fixed relative URLs in images/videos/audio
- Proper URL resolution for Notion embeds
- Maintained aspect ratios for images

#### Content Extraction
- Improved HTML cleaning (removes Notion-specific classes)
- Better text normalization for duplicate detection
- Fixed edge cases with empty toggles

#### Cross-platform Compatibility
- Works with Chrome PDF viewer
- Works with embedded PDFs
- Works with PDF.js instances
- Works with Notion's dynamic content loading

### 📚 Documentation

#### New Files
- `README-v2.1.md` - Comprehensive guide for v2.1.0
- Updated installation instructions
- Added platform-specific usage guides
- Troubleshooting section

#### Updated Files
- `CHANGELOG.md` (this file)
- Inline code documentation
- Console logging for debugging

### 🎯 Use Cases

#### For Students
- Extract definitions from PDF textbooks
- Sync lecture notes from Notion
- Create Q&A cards from study materials

#### For Language Learners
- Save vocabulary from web pages
- Create flashcards from PDF dictionaries
- Organize words by topic in Notion

#### For Professionals
- Quick reference cards from documentation
- Study materials from training PDFs
- Knowledge base sync from Notion wiki

### ⚠️ Known Issues

#### Notion
- Very large pages (1000+ blocks) may take time to sync
- Some advanced Notion blocks may not preserve exact formatting
- Nested toggles are treated as flat content

#### PDF
- Scanned PDFs without OCR won't have selectable text
- Complex PDF layouts may have text order issues
- Some PDF viewers may not be compatible

#### General
- First load on Notion may take 2-3 seconds for button to appear
- Very long content may be truncated by browser limits

### 🔮 Future Plans

#### Upcoming Features
- Spaced repetition algorithm
- Export to Anki format
- Sync across devices (optional cloud)
- More Notion block types support
- OCR for scanned PDFs
- Bulk import from Google Drive

#### Under Consideration
- Mobile app version
- Collaborative deck sharing
- AI-powered card suggestions
- Integration with more note-taking apps

## [2.0.0] - Previous Version

### Added
- Rich text editor with toolbar
- Multiple deck support
- Import/Export functionality
- Enhanced sidebar UI
- Statistics dashboard
- Edit existing cards
- Context menu on all elements

### Changed
- Complete UI redesign
- Improved storage structure
- Better error handling

## [1.0.0] - Initial Release

### Added
- Basic flashcard creation
- Simple text selection
- Single deck storage
- Basic popup interface

---

**Note**: This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
