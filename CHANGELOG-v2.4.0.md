# Changelog - Version 2.4.0

## 🎉 Major Features

### 1. **Tags Support** 🏷️
- Add tags to flashcards for better organization
- Tag input with comma-separated or Enter key support
- Visual tag chips with remove functionality
- Filter cards by tags in Manage page
- Tags are preserved in APKG exports
- Tag suggestions and autocomplete (coming soon)

### 2. **Study Mode** 📚
- Fullscreen, distraction-free study interface
- Beautiful card flipping animations
- Keyboard shortcuts:
  - `Space` or `Enter`: Flip card
  - `←` Arrow: Previous card
  - `→` Arrow: Next card
  - `1`, `2`, `3`: Rate difficulty (Hard, Good, Easy)
  - `Esc`: Exit study mode
- Progress tracking with visual progress bar
- Session statistics (cards studied, time spent, confidence)
- Study settings modal:
  - Randomize card order
  - Auto-flip after X seconds
  - Filter by deck
  - Filter by tags
- Completion modal with session summary
- Restart or exit options

### 3. **Hybrid Storage System** 💾
- **Browser Storage (chrome.storage.local)**: Fast, always available
- **File System Access API**: Persistent local file storage
- **IndexedDB**: Directory handle persistence
- Auto-sync between storage systems every 5 seconds
- Prioritizes newer data during conflicts
- Fallback to browser storage if File System Access unavailable

### 4. **Enhanced APKG Export** 📦
- Full media support:
  - Images (PNG, JPG, WebP)
  - Audio (MP3, WAV, OGG)
  - Video (MP4, WebM)
- Extracts media from base64 data URLs
- Proper media manifest generation
- Tags included in card metadata
- Maintains Anki deck hierarchy

## 🔧 Technical Improvements

### Files Added
- `storage-manager.js` - Hybrid storage manager
- `study.html` - Study mode interface
- `study.css` - Study mode styles
- `study.js` - Study mode logic

### Files Updated
- `manifest.json` - Version bump to 2.4.0, added study.html resources
- `manage.html` - Added tags input, tag filter, Study Mode button
- `manage.css` - Added tags styles
- `manage.js` - Tags management logic, tag filtering, Study Mode integration
- `sidebar.html` - Added tags input section
- `sidebar.css` - Added tags styles
- `sidebar.js` - Tags input handling, tag persistence
- `apkg-exporter.js` - Replaced with v2 (media support, tags support)

## 📊 Statistics

- **Total Files Modified**: 12
- **New Lines of Code**: ~2,500+
- **New Features**: 4 major features
- **Keyboard Shortcuts**: 7 shortcuts in Study Mode

## 🚀 How to Use New Features

### Using Tags
1. Open sidebar when creating a card
2. Enter tags in the "TAGS" field (comma-separated)
3. Press Enter or comma to add each tag
4. Click × on any tag to remove it
5. Tags are automatically saved with the card

### Starting Study Mode
1. Open Manage page (chrome-extension://[id]/manage.html)
2. Click "Study Mode" button in the top toolbar
3. Optionally filter by deck or tags first
4. Use keyboard shortcuts or buttons to navigate
5. Rate your performance after flipping each card

### Enabling Hybrid Storage
- Storage manager automatically activates
- First time: Browser will ask for folder permission
- Grant permission to enable persistent file storage
- Auto-sync happens every 5 seconds
- Data is safe in both locations

## 🐛 Bug Fixes
- Fixed media extraction from base64 URLs
- Improved APKG generation reliability
- Fixed deck selection persistence in edit mode
- Improved error handling in storage operations

## ⚡ Performance
- Optimized card rendering with tags
- Lazy loading for study mode assets
- Efficient tag filtering algorithms
- Reduced storage write operations with debouncing

## 📝 Notes
- Tags feature is backward compatible with v2.3.0 cards
- Study Mode works offline
- Hybrid storage is optional (falls back to browser storage)
- All existing features remain unchanged

## 🔜 Coming in v2.5.0
- Tag autocomplete and suggestions
- Spaced repetition algorithm
- Study session history
- Performance analytics
- Cloud sync options
- Collaborative deck sharing

---

**Version**: 2.4.0  
**Release Date**: February 2026  
**Upgrade from**: v2.3.0  
