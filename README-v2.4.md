# AddFlashcard v2.4.0 - Complete Feature Guide

## 🎯 What's New in v2.4.0

Version 2.4.0 introduces four major features that transform how you create, organize, and study your flashcards:

1. **Tags System** 🏷️ - Organize cards with tags
2. **Study Mode** 📚 - Fullscreen, distraction-free studying
3. **Hybrid Storage** 💾 - Browser + File System storage
4. **Enhanced APKG Export** 📦 - Full media support

---

## 🏷️ Tags System

### Creating Tags

**In Sidebar (when adding cards):**
1. Fill in Front and Back content
2. Scroll to "TAGS (Optional)" section
3. Type a tag and press `Enter` or comma `,`
4. Repeat to add multiple tags
5. Click ✕ on any tag to remove it

**In Manage Page (when editing):**
- Tags input available in both edit modal and edit sidebar
- Same behavior: Enter or comma to add tags
- Tags are saved automatically with the card

### Organizing with Tags

**Common tag strategies:**
- **By topic**: `#mathematics`, `#history`, `#biology`
- **By difficulty**: `#easy`, `#medium`, `#hard`
- **By source**: `#textbook`, `#lecture`, `#practice`
- **By status**: `#review`, `#mastered`, `#todo`
- **By exam**: `#midterm`, `#final`, `#quiz1`

### Filtering by Tags

1. Open Manage page
2. Use the "All Tags" dropdown in the toolbar
3. Select a tag to see only cards with that tag
4. Combine with deck filter for precise selection
5. Use Study Mode button to study filtered cards

---

## 📚 Study Mode

### Starting Study Mode

**From Manage Page:**
1. Click "Study Mode" button in toolbar
2. Optionally filter by deck/tags first
3. Study window opens in new tab/window

**Direct Access:**
- Navigate to `chrome-extension://[YOUR-ID]/study.html`
- Bookmark for quick access

### Study Interface

**Card Display:**
- Clean, centered card layout
- Front side shows question with "QUESTION" label
- Back side shows answer with "ANSWER" label
- Tags displayed at bottom of card
- Large, readable text optimized for studying

**Controls:**
- **Flip Button**: Center button to reveal answer
- **Previous/Next**: Navigate through cards
- **Settings**: Configure study preferences
- **Exit**: Return to Manage page

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Flip card |
| `←` Left Arrow | Previous card |
| `→` Right Arrow | Next card |
| `1` | Rate as Hard (after flip) |
| `2` | Rate as Good (after flip) |
| `3` | Rate as Easy (after flip) |
| `Esc` | Exit Study Mode |

### Difficulty Rating

After flipping to the answer:
- **Hard (1)**: Card was difficult, needs more review
- **Good (2)**: Card was okay, normal difficulty
- **Easy (3)**: Card was easy, well understood

Ratings track your confidence and progress.

### Study Settings

Click the Settings button (⚙️) to configure:

**Randomize Order:**
- ✓ Enabled: Cards appear in random order
- ✗ Disabled: Cards in original order

**Auto-Flip:**
- ✓ Enabled: Automatically flips to answer after X seconds
- Adjust delay: 1-60 seconds
- Great for passive review

**Filter by Deck:**
- Study cards from specific deck only
- Select "All Decks" for mixed study

**Filter by Tags:**
- Enter comma-separated tags
- Only cards with those tags appear
- Example: `mathematics,algebra`

**Reset Progress:**
- Clear current session statistics
- Restart from first card
- Re-randomizes if enabled

### Session Statistics

**Real-time tracking:**
- **Studied**: Cards reviewed in this session
- **Remaining**: Cards left to review
- **Session Time**: Total study time (MM:SS)
- **Progress Bar**: Visual progress indicator

**Completion Summary:**
Shows after finishing all cards:
- Total Cards Studied
- Time Spent
- Confidence % (based on ratings)

**Actions:**
- **Study Again**: Restart with same cards
- **Exit**: Return to Manage page

---

## 💾 Hybrid Storage System

### How It Works

AddFlashcard v2.4.0 uses **three storage layers**:

1. **Chrome Storage (Always Active)**
   - Fast, immediate access
   - Syncs across browser sessions
   - Limited to ~5MB quota

2. **File System Access API (Optional)**
   - Persistent local file storage
   - No size limits (uses disk space)
   - Survives browser data clears

3. **IndexedDB (Helper)**
   - Stores directory handles
   - Enables File System Access persistence

### Setup

**First Time:**
1. Extension automatically requests folder permission
2. Browser shows "Select folder" dialog
3. Choose or create a folder (e.g., "AddFlashcard-Data")
4. Grant permission

**Ongoing:**
- Auto-sync every 5 seconds
- Manual sync via Storage Manager (if added)
- Conflict resolution: newer data wins

### Benefits

✅ **Data Safety**: Dual storage redundancy  
✅ **Performance**: Fast browser storage  
✅ **Persistence**: File system survives clears  
✅ **Portability**: Easy backup via folder copy  
✅ **No Limits**: Use full disk space  

### Fallback

If File System Access unavailable or denied:
- Extension still works normally
- Uses Chrome Storage only
- No functionality lost

---

## 📦 Enhanced APKG Export

### Media Support

**Now supports:**
- **Images**: PNG, JPG, JPEG, WebP, GIF
- **Audio**: MP3, WAV, OGG, M4A
- **Video**: MP4, WebM, AVI, MOV

**How it works:**
1. Media embedded in cards (via editor)
2. Exporter extracts from base64 data URLs
3. Media files added to APKG
4. Anki recognizes and displays correctly

### Tag Preservation

- Tags are exported in Anki's tags field
- Tags appear in Anki card browser
- Tags can be searched in Anki
- Tags sync with AnkiWeb

### Export Process

1. Click "Export APKG" in Manage page
2. Enter parent deck name (optional)
3. Select decks to export
4. Progress bar shows export status
5. Download .apkg file
6. Import to Anki (File → Import)

### Technical Details

**APKG Structure:**
```
package.apkg
├── collection.anki2 (SQLite database)
├── media (JSON manifest)
├── [media files]
└── [optional assets]
```

**Media Processing:**
- Base64 data URLs converted to binary
- Files named: [hash].[extension]
- Manifest maps: "0": "filename.png"
- Anki rebuilds references on import

---

## 🚀 Tips & Best Practices

### Tags

✅ **DO:**
- Use consistent tag names
- Create tag hierarchy: `math:algebra`, `math:geometry`
- Tag cards when creating (easier than bulk tagging)
- Use 3-5 tags per card maximum

❌ **DON'T:**
- Over-tag (makes filtering complex)
- Use spaces in single tags (use hyphens)
- Duplicate information in tags (e.g., deck + tag)

### Study Mode

✅ **DO:**
- Study in short sessions (20-30 min)
- Use randomization for better retention
- Rate honestly (helps algorithm planning)
- Take breaks between sessions

❌ **DON'T:**
- Marathon study (causes fatigue)
- Skip difficult cards (mark as Hard instead)
- Study while distracted
- Rush through cards

### Storage

✅ **DO:**
- Grant File System Access permission
- Backup folder periodically
- Export APKG regularly
- Keep Chrome Storage under 5MB

❌ **DON'T:**
- Store cards only in browser (data loss risk)
- Ignore sync errors
- Delete storage folder manually

### Media

✅ **DO:**
- Optimize images (< 500KB each)
- Use common formats (PNG, JPG, MP3)
- Test media in Anki after export
- Keep media relevant to cards

❌ **DON'T:**
- Embed huge files (slows extension)
- Use unsupported formats
- Hotlink external media (breaks offline)

---

## 🐛 Troubleshooting

### Tags Not Saving

**Problem**: Tags disappear after saving card  
**Solution**:
1. Check if tags input exists in UI
2. Update to v2.4.0 if older version
3. Clear browser cache
4. Reinstall extension

### Study Mode Not Opening

**Problem**: Study Mode button does nothing  
**Solution**:
1. Check popup blocker settings
2. Allow popups for chrome-extension://
3. Try right-click → Open in new tab
4. Check browser console for errors

### Hybrid Storage Permission Denied

**Problem**: Can't select folder for storage  
**Solution**:
1. Try different folder (not protected)
2. Check folder permissions (read/write)
3. Use browser storage only (still works)
4. Update browser (requires modern version)

### APKG Export Fails

**Problem**: Export gets stuck or errors  
**Solution**:
1. Check if cards have valid content
2. Remove cards with broken media
3. Export smaller batches (one deck)
4. Check browser console for specific error

### Media Not Showing in Anki

**Problem**: Cards export but media missing  
**Solution**:
1. Check media file size (< 10MB each)
2. Verify media format supported
3. Re-embed media in card
4. Export again with "Check media" option

---

## 📊 Feature Comparison

| Feature | v2.3.0 | v2.4.0 |
|---------|--------|--------|
| Basic Cards | ✅ | ✅ |
| Decks | ✅ | ✅ |
| APKG Export | ✅ | ✅ Enhanced |
| AnkiConnect | ✅ | ✅ |
| Tags | ❌ | ✅ **NEW** |
| Study Mode | ❌ | ✅ **NEW** |
| Hybrid Storage | ❌ | ✅ **NEW** |
| Media Support | Basic | Full |
| Keyboard Shortcuts | Limited | 7+ shortcuts |
| Progress Tracking | ❌ | ✅ |

---

## 🔜 Coming in v2.5.0

- **Spaced Repetition Algorithm**: Intelligent card scheduling
- **Tag Autocomplete**: Tag suggestions as you type
- **Study Analytics**: Detailed performance charts
- **Cloud Sync**: Optional sync across devices
- **Deck Sharing**: Share decks with others
- **Dark/Light Themes**: UI appearance options
- **Bulk Operations**: Edit multiple cards at once
- **Card Templates**: Pre-designed card formats

---

## 📞 Support

**Issues?**
- GitHub Issues: [link]
- Email: support@addflashcard.com
- Discord: [link]

**Feedback?**
- Feature requests welcome
- Bug reports appreciated
- Star on GitHub if you like it!

---

**Version**: 2.4.0  
**Last Updated**: February 2026  
**License**: MIT  

Happy Studying! 🎓
