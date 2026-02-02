# AddFlashcard v2.3.0 - User Guide

## 🎯 What's New in v2.3.0

### 1. Export to Anki Package (.apkg)
Export your flashcards to standard Anki format (.apkg) that can be imported into:
- Anki Desktop (Windows, Mac, Linux)
- AnkiMobile (iOS)
- AnkiDroid (Android)
- AnkiWeb

### 2. Sync to Anki via AnkiConnect
Directly sync your cards to Anki Desktop without creating files. Perfect for:
- Quick updates to your Anki collection
- Frequent synchronization
- Testing cards before committing

---

## 📖 Quick Start Guide

### Export APKG File

#### Step 1: Open Manager
Click the extension icon and select "Manage Cards" or right-click → "Manage Flashcards"

#### Step 2: Click Export APKG
In the header, click the green "Export APKG" button

#### Step 3: Configure Export
- **Parent Deck Name**: Enter a name for the parent deck (default: "AddFlashcard Export")
  - All your decks will be exported as subdecks under this parent
  - Example: If parent is "English" and you have deck "Vocabulary", 
    it becomes "English::Vocabulary" in Anki
- **Select Decks**: Check the decks you want to export
  - You can see the card count for each deck
  - Select multiple decks to export them all together

#### Step 4: Export
Click "Export APKG" button and wait for the progress bar to complete

#### Step 5: Import to Anki
1. Open Anki
2. File → Import
3. Select the downloaded .apkg file
4. Click Import

### Sync to Anki (via AnkiConnect)

#### Prerequisites

1. **Install AnkiConnect add-on** in Anki Desktop:
   - Open Anki
   - Tools → Add-ons → Get Add-ons
   - Enter code: `2055492159`
   - Click OK and restart Anki

2. **Configure AnkiConnect** (usually not needed):
   - Tools → Add-ons → AnkiConnect → Config
   - Make sure "webBindAddress" is "127.0.0.1" or "0.0.0.0"
   - Make sure "webBindPort" is "8765"

3. **Keep Anki running** while syncing

#### Syncing Process

1. **Start Anki Desktop**
   - Make sure Anki is running before you sync

2. **Open Manager** in the extension
   - Click extension icon → Manage Cards

3. **Click "Sync to Anki"** button
   - The extension will check connection to Anki
   - You'll see a green checkmark if connected

4. **Configure Sync**:
   - **Source Deck**: Select which deck to sync from extension
   - **Target Deck**: Enter the Anki deck name to sync to
     - This deck will be created if it doesn't exist
     - Use `::` for subdeck, e.g., "English::Vocabulary"
   - **Field Mapping**: Configure how fields are mapped
     - Front → Front (default)
     - Back → Back (default)

5. **Click "Sync to Anki"**
   - Watch the progress bar
   - See results: success count and failed/duplicate count

6. **Check Anki**
   - Your cards should now appear in the target deck
   - Duplicates are automatically skipped

---

## 🎨 Field Mapping Explained

The field mapping lets you control how your flashcard content maps to Anki fields:

**Default Mapping:**
- Extension "Front" → Anki "Front"
- Extension "Back" → Anki "Back"

**Custom Mapping Examples:**

If you want to reverse cards:
- Anki "Front" ← Extension "Back"
- Anki "Back" ← Extension "Front"

This flexibility allows you to adjust how cards appear in Anki without editing each card.

---

## 🔧 Troubleshooting

### Export APKG Issues

**Problem: "No cards to export" error**
- Solution: Make sure you have created some flashcards first

**Problem: Export seems stuck**
- Solution: Wait for progress bar to complete. Large decks take longer.
- Note: Each card creates multiple Anki cards (one per template)

**Problem: Can't find downloaded file**
- Solution: Check your browser's Downloads folder
- Filename format: `AddFlashcard_DeckName_YYYYMMDD_XXcards.apkg`

### AnkiConnect Sync Issues

**Problem: "Cannot connect to Anki" error**

Solution checklist:
1. ✅ Is Anki Desktop running?
2. ✅ Is AnkiConnect add-on installed? (Check Tools → Add-ons)
3. ✅ Did you restart Anki after installing AnkiConnect?
4. ✅ Is firewall blocking connection?
   - AnkiConnect uses port 8765
   - Allow Anki through firewall
5. ✅ Check AnkiConnect config:
   - Tools → Add-ons → AnkiConnect → Config
   - webBindAddress: "127.0.0.1"
   - webBindPort: 8765

**Problem: "Sync Failed" with all cards failing**
- Check that target deck name is valid (no special characters except `::`)
- Try syncing fewer cards first to test
- Check Anki error messages (Help → Check Database)

**Problem: Some cards show as "Failed/Duplicates"**
- This is normal! Anki prevents duplicate cards by default
- Cards with identical Front field are skipped
- Failed count includes both actual failures and duplicates

**Problem: Cards appear in wrong deck**
- Double-check target deck name
- Use `::` for subdecks (e.g., "Parent::Child")
- Case-sensitive on some systems

---

## 💡 Tips & Best Practices

### When to use APKG Export vs AnkiConnect

**Use APKG Export when:**
- ✅ You want to import to mobile (iOS/Android)
- ✅ You want to share with others
- ✅ You want a backup file
- ✅ You're doing initial bulk import
- ✅ AnkiConnect isn't working

**Use AnkiConnect when:**
- ✅ You frequently update cards
- ✅ You only use Anki Desktop
- ✅ You want instant sync
- ✅ You don't want to manage files

### Organizing Decks

**Hierarchical Structure:**
```
AddFlashcard Export
├── English
│   ├── Vocabulary
│   ├── Grammar
│   └── Idioms
├── Spanish
│   └── Basic
└── Programming
    ├── JavaScript
    └── Python
```

**In the extension:**
- Create decks: "English", "Spanish", "Programming"
- Each becomes a subdeck in Anki

**Pro tip:** Use a descriptive parent deck name that groups related content

### Avoiding Duplicates

When syncing repeatedly:
1. **First time**: All cards are new → High success rate
2. **Subsequent syncs**: Duplicates skipped → Higher failed count (this is good!)
3. **To update existing cards**: Currently not supported, delete from Anki first

---

## 🆘 Need More Help?

### Getting Support

1. **Check existing documentation**:
   - CHANGELOG-v2.3.0.md - What's new
   - FEATURES.md - All features explained
   - TESTING-GUIDE.md - For testing and development

2. **Common issues**:
   - Notion sync not working? See notion-sync.js documentation
   - PDF support issues? See pdf-support.js and FEATURES.md
   - Media not saving? Check storage permissions

3. **Report a bug**:
   - Include extension version (v2.3.0)
   - Describe what you were doing
   - Share any error messages
   - Mention your browser and OS

---

## 🔮 Coming Soon

Features under consideration for v2.4:
- Custom card templates for APKG export
- Bi-directional sync (Anki → Extension)
- Scheduled auto-sync
- Tag support
- Image/media in APKG exports
- Batch edit cards
- Import from Anki

---

## ⚙️ Advanced Configuration

### AnkiConnect Custom Port

If you changed AnkiConnect port from default 8765:

1. Edit `anki-connect.js`
2. Change line: `this.url = 'http://127.0.0.1:8765';`
3. Use your custom port number
4. Reload extension

### Custom Card Templates

Currently uses basic template:
- Front: `{{Front}}`
- Back: `{{FrontSide}}<hr id=answer>{{Back}}`

To customize (for future versions):
- Edit template in apkg-exporter.js
- Modify `tmpls` array in `exportDeck()` method

---

## 📊 Technical Specifications

### APKG Format
- **Database**: SQLite (Anki collection.anki2)
- **Compression**: ZIP with DEFLATE
- **Version**: Anki 2.1+ compatible
- **Libraries**: sql.js v1.8.0, JSZip v3.10.1

### AnkiConnect API
- **Protocol**: HTTP REST API
- **Port**: 8765 (default)
- **Version**: 6
- **Host**: localhost (127.0.0.1)

### Performance
- **APKG Export**: ~1000 cards/second
- **AnkiConnect Sync**: ~25 cards/batch, multiple batches
- **Memory**: Minimal, processes in batches

---

## 📄 License

See LICENSE file for details.

---

**Enjoy learning with AddFlashcard! 🎓**
