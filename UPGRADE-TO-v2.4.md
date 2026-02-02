# Upgrade Guide: v2.3.0 → v2.4.0

## 📋 Pre-Upgrade Checklist

Before upgrading, please:

- ✅ **Backup your data**: Export all cards as JSON or APKG
- ✅ **Note your decks**: List all deck names
- ✅ **Check browser**: Chrome/Edge 119+ required for File System Access
- ✅ **Close Anki**: If using AnkiConnect
- ✅ **Read changelog**: Review new features in CHANGELOG-v2.4.0.md

## 🔄 Upgrade Methods

### Method 1: Chrome Web Store (Recommended)

1. **Automatic Update**:
   - Extension auto-updates within 24 hours
   - Check version: Right-click extension → Manage → Details
   - Current version shown at top

2. **Manual Update**:
   - Open `chrome://extensions`
   - Enable "Developer mode" (top-right)
   - Click "Update" button
   - Wait for v2.4.0 to download

3. **Force Update**:
   - Uninstall current version
   - Reinstall from Chrome Web Store
   - ⚠️ Data preserved in browser storage

### Method 2: Local Installation

1. **Download v2.4.0**:
   - Get ZIP from GitHub releases
   - Or clone repository: `git pull origin main`

2. **Unload Old Version**:
   - Open `chrome://extensions`
   - Find AddFlashcard v2.3.0
   - Click "Remove" button
   - Confirm removal

3. **Load New Version**:
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select v2.4.0 folder
   - Extension loads with new features

4. **Verify Installation**:
   - Check version in extension details
   - Should show "2.4.0"
   - Test by opening Manage page

## 📦 Data Migration

### Automatic Migration

Your data migrates automatically:

**What's preserved:**
- ✅ All flashcards (Front, Back, Deck)
- ✅ All deck names
- ✅ Card creation dates
- ✅ Anki sync settings

**What's new:**
- 🆕 Tags field (empty for existing cards)
- 🆕 Study progress tracking
- 🆕 Hybrid storage option

### Manual Verification

After upgrade:

1. **Check Card Count**:
   ```
   Open Manage page
   Verify total cards matches v2.3.0
   ```

2. **Verify Decks**:
   ```
   Check sidebar deck list
   All decks should appear
   ```

3. **Test Card Display**:
   ```
   Open any card in edit mode
   Front and Back content intact
   New Tags field appears (empty)
   ```

4. **Export Test**:
   ```
   Export APKG of one deck
   Import to Anki
   Verify cards display correctly
   ```

### Backup Recovery (If Needed)

If something goes wrong:

1. **From JSON Backup**:
   ```
   Open Manage page
   Click "Import JSON"
   Select backup file
   Cards restored
   ```

2. **From APKG Backup**:
   ```
   Import to Anki first
   Use AnkiConnect to sync back
   Or manually recreate cards
   ```

3. **From Browser Storage**:
   ```javascript
   // In browser console (chrome://extensions)
   chrome.storage.local.get(['cards', 'decks'], (data) => {
     console.log(JSON.stringify(data, null, 2));
     // Copy output to file
   });
   ```

## 🆕 Using New Features

### 1. Adding Tags to Existing Cards

**Bulk Tagging Strategy**:
```
1. Open Manage page
2. Filter by deck
3. Edit each card (or use bulk edit coming in v2.5)
4. Add 2-3 relevant tags
5. Save
```

**Tag Naming Convention**:
```
Good: math, algebra, chapter-3
Bad: Math (capitalization varies), "hard problem" (spaces)
```

### 2. Setting Up Hybrid Storage

**First-Time Setup**:
```
1. Extension shows permission dialog
2. Click "Choose Folder"
3. Create folder: "AddFlashcard-Data"
4. Click "Select" to grant permission
5. Auto-sync begins (every 5 seconds)
```

**Verify Storage**:
```
1. Add a test card
2. Wait 5 seconds
3. Check selected folder
4. Should see: cards.json, decks.json
```

**Optional**: Disable File System Storage
```
1. Deny permission when prompted
2. Extension uses Chrome Storage only
3. All features still work
```

### 3. Launching Study Mode

**First Study Session**:
```
1. Open Manage page
2. Click "Study Mode" button (top-right)
3. New window opens
4. Try keyboard shortcuts:
   - Space: Flip card
   - Arrow keys: Navigate
   - 1,2,3: Rate difficulty
```

**Configure Study Settings**:
```
1. Click Settings ⚙️ in Study Mode
2. Enable "Randomize" for better retention
3. Set "Auto-flip" to 5 seconds (optional)
4. Apply and restart
```

**Study Filtered Cards**:
```
1. In Manage page, filter by deck/tags
2. Click "Study Mode"
3. Only filtered cards appear
```

### 4. Exporting with Media

**For Cards with Media**:
```
1. Ensure media embedded (not hotlinked)
2. Click "Export APKG"
3. Select decks with media
4. Export includes media files
5. Import to Anki - media works!
```

**Supported Media**:
- Images: PNG, JPG, WebP
- Audio: MP3, WAV, OGG
- Video: MP4, WebM

## ⚙️ Configuration Updates

### New Settings

**Study Mode Settings** (in study.html):
- Randomize Order: `false` → Recommended: `true`
- Auto-flip: `false` → Optional: `true` (5-10 seconds)
- Deck Filter: `""` → Set if studying specific deck
- Tag Filter: `""` → Set for focused study

**Storage Settings** (automatic):
- Hybrid Storage: `auto-enabled` with permission
- Sync Interval: `5 seconds`
- Conflict Resolution: `newer data wins`

### Preserving Old Settings

These remain unchanged:
- ✅ Anki sync URL and settings
- ✅ Default deck selection
- ✅ Editor toolbar preferences
- ✅ UI language/theme (if customized)

## 🔍 Verification Tests

### Test 1: Basic Functionality
```
✓ Can create new card
✓ Can add tags to card
✓ Card saves successfully
✓ Card appears in Manage page
✓ Tags display correctly
```

### Test 2: Study Mode
```
✓ Study Mode opens
✓ Cards display correctly
✓ Can flip cards (Space key)
✓ Can navigate (Arrow keys)
✓ Can rate difficulty (1,2,3)
✓ Progress bar updates
✓ Session completes correctly
```

### Test 3: APKG Export
```
✓ Can open export modal
✓ Can select decks
✓ Export progresses to 100%
✓ Downloads .apkg file
✓ Anki imports successfully
✓ Cards display with tags
✓ Media works (if present)
```

### Test 4: Hybrid Storage
```
✓ Permission granted (if enabled)
✓ Folder created and writable
✓ cards.json appears after adding card
✓ Data syncs within 5 seconds
✓ Data survives browser restart
```

## 🐛 Common Issues & Fixes

### Issue: Tags Not Appearing

**Symptoms**: Tags field missing in edit mode  
**Fix**:
```
1. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Clear cache: chrome://settings/clearBrowserData
3. Reinstall extension
4. Check manifest.json version = 2.4.0
```

### Issue: Study Mode Blank

**Symptoms**: Study window opens but shows nothing  
**Fix**:
```
1. Check browser console (F12)
2. Look for errors
3. Verify cards exist in storage
4. Try with different deck
5. Update browser if old version
```

### Issue: File System Permission Loop

**Symptoms**: Keep getting asked for folder permission  
**Fix**:
```
1. Choose different folder
2. Ensure folder isn't protected (not Program Files)
3. Grant full read/write permissions
4. Or deny and use browser storage only
```

### Issue: APKG Export Hangs

**Symptoms**: Export stucks at X%  
**Fix**:
```
1. Export smaller batch (single deck)
2. Check for cards with huge media (>10MB)
3. Remove problematic cards temporarily
4. Try again
5. Report issue with console errors
```

### Issue: Data Loss After Upgrade

**Symptoms**: Cards missing post-upgrade  
**Fix**:
```
1. Check chrome.storage: 
   chrome://extensions → AddFlashcard → Inspect views → Console
   > chrome.storage.local.get(['cards'], console.log)
   
2. If data exists, trigger UI refresh:
   - Close and reopen Manage page
   - Or: localStorage.clear() then refresh
   
3. If data missing, restore from backup:
   - Import JSON backup
   - Or sync from Anki via AnkiConnect
```

## 📞 Getting Help

**Before Reporting**:
1. Check this upgrade guide
2. Review CHANGELOG-v2.4.0.md
3. Test in incognito mode (disable other extensions)
4. Check browser console for errors

**When Reporting**:
Include:
- Browser & version
- AddFlashcard version
- Steps to reproduce
- Console errors (F12 → Console tab)
- Screenshot if UI issue

**Contact**:
- GitHub Issues: [Create issue with bug template]
- Email: support@addflashcard.com
- Discord: [Community server link]

## ✅ Post-Upgrade Checklist

After successful upgrade:

- ✅ Verified all cards present
- ✅ Tested card creation with tags
- ✅ Opened Study Mode and tested navigation
- ✅ Exported APKG and verified in Anki
- ✅ Configured Hybrid Storage (optional)
- ✅ Set Study Mode preferences
- ✅ Deleted v2.3.0 backup (keep for 1 week)
- ✅ Bookmarked Study Mode for quick access
- ✅ Read new features in README-v2.4.md

## 🎉 Welcome to v2.4.0!

Congratulations on upgrading! You now have:

- 🏷️ **Tags** for better organization
- 📚 **Study Mode** for focused learning
- 💾 **Hybrid Storage** for data safety
- 📦 **Enhanced APKG** with full media support

Enjoy the new features and happy studying! 🎓

---

**Need more help?**  
→ README-v2.4.md - Full feature guide  
→ CHANGELOG-v2.4.0.md - What changed  
→ TESTING-GUIDE.md - Test new features  

**Found a bug?**  
→ Report on GitHub Issues with details  

**Love v2.4.0?**  
→ Rate extension on Chrome Web Store  
→ Star repository on GitHub  
→ Share with fellow students!
