# Testing Guide for v2.3.0

## Test Cases for New Features

### 1. APKG Export Tests

#### Test 1.1: Basic Single Deck Export
**Steps:**
1. Create a deck "Test Deck" with 5 cards
2. Open Manager
3. Click "Export APKG"
4. Enter parent deck name: "Test Export"
5. Select "Test Deck"
6. Click "Export APKG"

**Expected:**
- Progress bar shows 0% → 100%
- File downloads: `AddFlashcard_Test_Export_YYYYMMDD_5cards.apkg`
- Success message appears
- Modal closes automatically

**Verify in Anki:**
1. Import the .apkg file
2. Check deck structure: "Test Export::Test Deck"
3. Verify all 5 cards present
4. Check Front and Back content matches

#### Test 1.2: Multiple Deck Export
**Steps:**
1. Create decks: "English" (10 cards), "Spanish" (5 cards), "French" (3 cards)
2. Export APKG with parent "Languages"
3. Select all three decks

**Expected:**
- Downloads with 18 total cards
- In Anki, see: "Languages::English", "Languages::Spanish", "Languages::French"
- All cards in correct decks

#### Test 1.3: Empty Deck Handling
**Steps:**
1. Create empty deck "Empty"
2. Try to export

**Expected:**
- Checkbox for empty deck is unchecked by default
- Can still check it
- If selected, exports with 0 cards (harmless)

#### Test 1.4: Special Characters in Deck Names
**Steps:**
1. Create deck with special chars: "Test-Deck_123"
2. Export with parent "Test's Parent"

**Expected:**
- File name sanitizes: `AddFlashcard_Test_s_Parent_...`
- Deck names preserved in Anki

#### Test 1.5: Large Export (Performance)
**Steps:**
1. Create deck with 100+ cards
2. Export

**Expected:**
- Progress bar updates smoothly
- Completes within reasonable time (<10 seconds for 100 cards)
- No browser freeze

#### Test 1.6: HTML Content in Cards
**Steps:**
1. Create cards with:
   - Bold text: `<b>Bold</b>`
   - Images: `<img src="...">`
   - Lists: `<ul><li>Item</li></ul>`
2. Export and import to Anki

**Expected:**
- HTML renders correctly in Anki
- Images display (if base64)
- Formatting preserved

### 2. AnkiConnect Sync Tests

#### Test 2.1: Connection Test
**Steps:**
1. Close Anki
2. Click "Sync to Anki"
3. Observe status

**Expected:**
- Status shows "Checking connection..."
- Error: "Cannot connect to Anki"
- Message explains to start Anki

#### Test 2.2: Successful Connection
**Steps:**
1. Start Anki with AnkiConnect installed
2. Click "Sync to Anki"

**Expected:**
- Green checkmark: "Connected to Anki successfully!"
- Source deck dropdown populated
- Sync form appears

#### Test 2.3: Basic Single Deck Sync
**Steps:**
1. Select source deck: "Test Deck" (5 cards)
2. Enter target: "Synced Test"
3. Keep default field mapping
4. Click "Sync to Anki"

**Expected:**
- Progress bar: 0% → 100%
- Success: "5 cards added, 0 failed"
- Cards appear in Anki deck "Synced Test"

#### Test 2.4: Duplicate Prevention
**Steps:**
1. Sync "Test Deck" to "Synced Test" (5 cards)
2. Sync same deck again

**Expected:**
- First sync: 5 success, 0 failed
- Second sync: 0 success, 5 failed (duplicates)
- Message explains duplicates are skipped

#### Test 2.5: Field Mapping
**Steps:**
1. Sync with reversed mapping:
   - Front ← Back
   - Back ← Front
2. Check in Anki

**Expected:**
- Cards are reversed
- Front shows original Back content
- Back shows original Front content

#### Test 2.6: Subdeck Creation
**Steps:**
1. Enter target: "Parent::Child::Grandchild"
2. Sync

**Expected:**
- Creates hierarchical deck structure
- Cards in "Parent::Child::Grandchild"

#### Test 2.7: Invalid Deck Names
**Steps:**
1. Try these target names:
   - "Test/Deck" (slash)
   - "Test*Deck" (asterisk)
   - "" (empty)

**Expected:**
- Slash/asterisk: might work or fail gracefully
- Empty: validation error

#### Test 2.8: Large Batch Sync
**Steps:**
1. Sync deck with 100+ cards

**Expected:**
- Batches of 25 cards
- Progress updates for each batch
- All cards sync successfully
- Reasonable performance

### 3. UI/UX Tests

#### Test 3.1: Button Visibility
**Steps:**
1. Open Manager
2. Check header buttons

**Expected:**
- "Export APKG" button visible (green)
- "Sync to Anki" button visible (blue)
- "Export JSON" button visible
- "Import JSON" button visible
- All buttons aligned nicely

#### Test 3.2: Modal Opening/Closing
**Steps:**
1. Click "Export APKG"
2. Click X to close
3. Click "Export APKG" again
4. Click "Cancel" to close

**Expected:**
- Modal opens smoothly
- Modal closes on X click
- Modal closes on Cancel click
- Modal closes on backdrop click

#### Test 3.3: Progress Bar Animation
**Steps:**
1. Export large deck
2. Observe progress bar

**Expected:**
- Smooth animation
- Percentage text updates
- Color gradient visible
- Bar fills left to right

#### Test 3.4: Responsive Design
**Steps:**
1. Resize browser window
2. Test on different widths (1920px, 1366px, 768px)

**Expected:**
- Modals adapt to screen size
- Buttons stack on mobile
- Text remains readable
- No horizontal scroll

### 4. Error Handling Tests

#### Test 4.1: No Cards to Export
**Steps:**
1. Delete all cards
2. Click "Export APKG"

**Expected:**
- Alert: "No cards to export!"
- Modal doesn't open

#### Test 4.2: No Decks Selected
**Steps:**
1. Open APKG modal
2. Uncheck all decks
3. Click "Export APKG"

**Expected:**
- Alert: "Please select at least one deck!"
- Export doesn't proceed

#### Test 4.3: Libraries Not Loaded
**Steps:**
1. Block CDN in DevTools (Network tab)
2. Try to export

**Expected:**
- Error message about missing libraries
- Graceful failure
- No browser crash

#### Test 4.4: AnkiConnect Timeout
**Steps:**
1. Start Anki
2. Close Anki during sync

**Expected:**
- Error: "Connection failed"
- Sync stops gracefully
- Can retry

#### Test 4.5: Invalid Field Mapping
**Steps:**
1. Map both Front and Back to same source

**Expected:**
- Syncs but creates weird cards
- (Future: validation to prevent this)

### 5. Integration Tests

#### Test 5.1: Export → Import → Sync
**Steps:**
1. Create cards in extension
2. Export APKG
3. Import to Anki
4. Modify in Anki
5. Create new cards in extension
6. Sync to same deck

**Expected:**
- Original cards from APKG remain
- New cards from sync added
- No conflicts

#### Test 5.2: Multi-User Workflow
**Steps:**
1. User A: Create and export APKG
2. User B: Import APKG
3. User B: Export modified APKG
4. User A: Import User B's APKG

**Expected:**
- Cards merge properly
- No data loss
- Duplicates handled

#### Test 5.3: Notion → Extension → Anki
**Steps:**
1. Create toggles in Notion
2. Click "Sync cards" in Notion
3. Cards appear in extension
4. Export to Anki via APKG or sync

**Expected:**
- Full workflow works
- Content preserved through all steps
- Formatting maintained

### 6. Browser Compatibility Tests

Test all features in:
- ✅ Chrome/Chromium
- ✅ Edge
- ✅ Brave
- ✅ Opera
- ⚠️ Firefox (extension format differs, may need adaptation)

### 7. Performance Benchmarks

| Operation | Cards | Expected Time |
|-----------|-------|---------------|
| APKG Export | 10 | < 1 second |
| APKG Export | 100 | < 5 seconds |
| APKG Export | 1000 | < 30 seconds |
| AnkiConnect Sync | 10 | < 2 seconds |
| AnkiConnect Sync | 100 | < 10 seconds |

## Regression Tests

Make sure existing features still work:

### Basic Extension Features
- ✅ Create cards via context menu
- ✅ Create cards via sidebar
- ✅ Edit cards in sidebar
- ✅ Delete cards
- ✅ Search cards
- ✅ Sort cards
- ✅ Create/rename/delete decks
- ✅ JSON export/import

### PDF Support
- ✅ Select text in PDF
- ✅ Create card from PDF
- ✅ PDF text extraction

### Media Support
- ✅ Add images to cards
- ✅ Add videos to cards
- ✅ Add audio to cards
- ✅ Base64 encoding works

### Notion Integration
- ✅ "Sync cards" button appears
- ✅ Toggle conversion works
- ✅ Nested toggles work
- ✅ Cards save to correct deck

## Known Issues / Limitations

Document any issues found during testing:

1. **APKG Export:**
   - Media files not yet supported (images as base64 only)
   - Single card template only
   - Cannot customize CSS per deck

2. **AnkiConnect:**
   - Requires Anki Desktop running
   - No update existing cards (duplicates skipped)
   - Limited to Basic note type
   - No tag support yet

3. **UI:**
   - Progress bar doesn't show for very fast operations
   - Modal backdrop click sensitivity

## Test Checklist

Before releasing v2.3.0:

- [ ] All APKG export tests pass
- [ ] All AnkiConnect tests pass
- [ ] All UI tests pass
- [ ] All error handling tests pass
- [ ] All integration tests pass
- [ ] Browser compatibility confirmed
- [ ] Performance benchmarks met
- [ ] Regression tests pass
- [ ] Documentation complete
- [ ] Known issues documented

## Automated Testing (Future)

For v2.4+, consider:
- Unit tests for apkg-exporter.js
- Unit tests for anki-connect.js
- Integration tests with mock Anki
- E2E tests with Puppeteer
- Performance regression tests

---

**Test Environment:**
- Extension version: 2.3.0
- Browser: Chrome 120+
- Anki: 2.1.66+
- AnkiConnect: Latest
- OS: Windows 11 / macOS 14 / Linux Ubuntu 22.04
