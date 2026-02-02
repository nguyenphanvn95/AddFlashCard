# Changelog - AddFlashcard v2.3.0

## Version 2.3.0 (2025-02-02)

### 🎉 Major New Features

#### 1. Export to Anki Package (.apkg)
- **Export multiple decks** to a single .apkg file
- **Hierarchical deck structure**: All decks exported as subdecks under a parent deck
- **Progress indicator** during export
- **Customizable parent deck name**
- Select which decks to include in export
- Compatible with Anki Desktop and AnkiMobile

**How to use:**
1. Open Manager (manage.html)
2. Click "Export APKG" button in header
3. Enter parent deck name (e.g., "AddFlashcard Export")
4. Select decks to export
5. Click "Export APKG" to download

#### 2. Sync to Anki via AnkiConnect
- **Direct sync** to Anki Desktop via AnkiConnect add-on
- **Field mapping**: Map Front/Back fields flexibly
- **Automatic deck creation** if target deck doesn't exist
- **Batch processing** for better performance
- **Real-time progress** and detailed results

**Prerequisites:**
- Anki Desktop must be running
- AnkiConnect add-on must be installed
- AnkiConnect must allow connections (default setting)

**How to use:**
1. Install AnkiConnect add-on in Anki (code: 2055492159)
2. Start Anki Desktop
3. Open Manager in extension
4. Click "Sync to Anki" button
5. Select source deck and enter target Anki deck name
6. Configure field mapping if needed
7. Click "Sync to Anki"

### ✨ Improvements

- **Better UI/UX**: New buttons with clear icons
- **Progress indicators**: Visual feedback during long operations
- **Error handling**: Better error messages and recovery
- **Connection testing**: Automatic check for AnkiConnect availability

### 🔧 Technical Details

**New Files:**
- `apkg-exporter.js`: Module for creating .apkg files
  - Uses sql.js to create Anki database
  - Uses JSZip to compress to .apkg format
  - Supports multiple decks and cards per note
  
- `anki-connect.js`: Module for AnkiConnect API
  - RESTful API client for AnkiConnect
  - Supports all major AnkiConnect operations
  - Batch operations for efficiency

**Updated Files:**
- `manage.html`: Added Export APKG and Sync to Anki buttons and modals
- `manage.css`: Added styles for new modals and UI elements
- `manage.js`: Added event handlers and logic for new features

### 📚 Libraries Used

- **sql.js v1.8.0**: SQLite compiled to JavaScript for .apkg database
- **JSZip v3.10.1**: Create ZIP archives for .apkg format

### 🐛 Bug Fixes

- Fixed Notion sync button not appearing on some pages
- Improved retry logic for Notion button injection

### 📝 Notes

**Export APKG vs AnkiConnect:**
- **APKG Export**: Creates a file you can import anywhere (Desktop, Mobile, Web)
- **AnkiConnect**: Direct sync to Desktop only, faster for frequent updates

**Notion Integration:**
- Notion sync button automatically appears on Notion pages
- Click "Sync cards" to convert toggles to flashcards
- Works with existing Notion sync feature from v2.2

### 🔮 Future Enhancements

Potential features for future versions:
- Custom card templates for .apkg export
- Bi-directional sync with Anki
- Sync scheduling and automation
- Support for tags and card types
- Media file export in .apkg

---

## Previous Versions

See CHANGELOG-v2.2.1.md for v2.2.1 changes
See CHANGELOG-v2.1.md for v2.1 changes
See CHANGELOG.md for earlier versions
