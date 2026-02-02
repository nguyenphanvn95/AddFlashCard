# AnkiConnect Setup Guide

## What is AnkiConnect?

AnkiConnect is an Anki add-on that allows external applications (like this extension) to communicate with Anki Desktop through a local web API. It enables features like:
- Adding cards directly to Anki
- Creating and managing decks
- Querying card information
- Synchronizing data

## Installation Steps

### 1. Install Anki Desktop

If you don't have Anki installed:
- Download from: https://apps.ankiweb.net/
- Install the appropriate version for your OS
- Launch Anki at least once to complete setup

### 2. Install AnkiConnect Add-on

**Method 1: Using Add-on Code (Recommended)**

1. Open Anki Desktop
2. Click **Tools** → **Add-ons**
3. Click **Get Add-ons...**
4. Enter the code: `2055492159`
5. Click **OK**
6. Wait for download to complete
7. Click **OK** on the success message
8. **Restart Anki** (very important!)

**Method 2: Manual Installation**

1. Download AnkiConnect from: https://ankiweb.net/shared/info/2055492159
2. Open Anki
3. Tools → Add-ons → View Files
4. Copy the downloaded file to this folder
5. Restart Anki

### 3. Verify Installation

1. Open Anki
2. Tools → Add-ons
3. You should see "AnkiConnect" in the list
4. The status should show as "Enabled"

### 4. Configure AnkiConnect (Optional)

Usually, the default configuration works. But if needed:

1. Tools → Add-ons
2. Select "AnkiConnect"
3. Click **Config**
4. Default config should look like:

```json
{
    "apiKey": null,
    "apiLogPath": null,
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOrigin": "http://localhost",
    "webCorsOriginList": [
        "http://localhost",
        "https://localhost"
    ]
}
```

**Important settings:**
- `webBindAddress`: Should be `"127.0.0.1"` (localhost only) or `"0.0.0.0"` (allow network)
- `webBindPort`: Should be `8765` (default port)
- `apiKey`: Leave as `null` unless you need security

5. Click **OK**
6. Restart Anki if you made changes

## Testing AnkiConnect

### Method 1: Using the Extension

1. Make sure Anki is running
2. Open the extension's Manager page
3. Click "Sync to Anki" button
4. If you see "Connected to Anki successfully!" → ✅ Working!
5. If you see error → ❌ See troubleshooting below

### Method 2: Using Browser Console (Advanced)

1. Make sure Anki is running
2. Open browser console (F12)
3. Paste this code:

```javascript
fetch('http://127.0.0.1:8765', {
  method: 'POST',
  body: JSON.stringify({
    action: 'version',
    version: 6
  })
})
.then(r => r.json())
.then(d => console.log('AnkiConnect version:', d.result))
.catch(e => console.error('Connection failed:', e));
```

4. If you see a version number → ✅ Working!
5. If you see error → ❌ See troubleshooting below

## Troubleshooting

### Error: "Cannot connect to Anki"

**Checklist:**

1. ✅ **Is Anki running?**
   - AnkiConnect only works when Anki Desktop is open
   - Start Anki before using the extension

2. ✅ **Is AnkiConnect installed?**
   - Check Tools → Add-ons in Anki
   - Should see "AnkiConnect" in the list

3. ✅ **Did you restart Anki after installation?**
   - Close Anki completely
   - Start it again
   - Add-ons only activate after restart

4. ✅ **Is AnkiConnect enabled?**
   - Tools → Add-ons
   - Make sure AnkiConnect is checked/enabled
   - If disabled, enable it and restart

5. ✅ **Is firewall blocking the connection?**
   - AnkiConnect uses port 8765
   - Allow Anki through your firewall
   - On Windows: Windows Defender Firewall → Allow an app
   - On Mac: System Preferences → Security & Privacy → Firewall Options

6. ✅ **Is another program using port 8765?**
   - Close other applications that might use this port
   - Or change AnkiConnect port in config (advanced)

### Error: "Sync Failed" during operation

**Possible causes:**

1. **Invalid deck name**
   - Don't use special characters (except `::` for subdecks)
   - Valid: "English::Vocabulary"
   - Invalid: "English/Vocabulary", "English*Vocabulary"

2. **Database locked**
   - Don't sync while Anki is syncing to AnkiWeb
   - Wait for AnkiWeb sync to complete
   - Try Tools → Check Database in Anki

3. **Corrupted Anki database**
   - Tools → Check Database
   - Let Anki repair any issues
   - Try sync again

### Error: "All cards failed to sync"

**This usually means:**
- ✅ Connection works (Anki is reachable)
- ❌ Card creation fails

**Solutions:**

1. **Check card content**
   - Make sure cards have content in Front field
   - Empty cards will be rejected

2. **Try with fewer cards**
   - Sync just 1-2 cards first
   - If that works, the issue is with specific cards

3. **Check Anki error log**
   - Tools → Add-ons → AnkiConnect → View Files
   - Check log file for detailed errors

### Cards are duplicates

**This is normal behavior!**

AnkiConnect prevents duplicate cards by default:
- If a card with the same Front field exists in the target deck
- It will be skipped and counted as "failed"
- This is a safety feature to prevent duplicates

**To update existing cards:**
- Currently not supported
- You need to delete old cards from Anki first
- Then sync again

**Workaround:**
- Export to APKG instead
- Import in Anki with "Update existing notes" option

## Advanced Configuration

### Changing Port Number

If port 8765 is already in use:

1. Open Anki
2. Tools → Add-ons → AnkiConnect → Config
3. Change `webBindPort` to another number (e.g., 8766)
4. Click OK and restart Anki
5. Update extension code:
   - Open `anki-connect.js` in extension folder
   - Change `this.url = 'http://127.0.0.1:8765';`
   - Use your new port number
   - Reload extension in browser

### Enabling Network Access

To allow AnkiConnect from other devices on your network:

⚠️ **Security Warning**: This allows any device on your network to access Anki!

1. Tools → Add-ons → AnkiConnect → Config
2. Change `webBindAddress` from `"127.0.0.1"` to `"0.0.0.0"`
3. Update `webCorsOriginList` to include your network IPs
4. Click OK and restart Anki

### API Key (Optional)

For additional security:

1. Generate a random API key (e.g., use a password manager)
2. Tools → Add-ons → AnkiConnect → Config
3. Set `apiKey` to your generated key
4. In extension, you'll need to modify requests to include the key
   (This requires code modification - not currently supported in UI)

## Performance Tips

### For Large Collections

If you have many cards (>1000):

1. **Sync in smaller batches**
   - Sync one deck at a time
   - Use filters to limit cards

2. **Disable auto-sync**
   - Tools → Preferences → Network
   - Turn off "Sync automatically"
   - Sync manually after adding many cards

3. **Optimize Anki database**
   - Tools → Check Database (regularly)
   - Helps maintain performance

### For Slow Computers

1. **Close other applications**
   - Free up memory and CPU
   - Especially other browser tabs

2. **Reduce batch size**
   - Currently uses 25 cards per batch
   - Can be modified in code if needed

## Security Considerations

### Is AnkiConnect Safe?

**Yes, when used properly:**

✅ Only accepts connections from localhost by default
✅ No remote access unless configured
✅ No automatic execution of dangerous commands
✅ Open source and well-maintained

**Best practices:**

1. **Keep default settings**
   - Don't change `webBindAddress` unless needed
   - Use `127.0.0.1` (localhost only)

2. **Use firewall**
   - Keep firewall enabled
   - Only allow Anki if you trust your network

3. **No API key needed for local use**
   - Only use API key if exposing to network
   - Generate strong random keys

4. **Update regularly**
   - Keep Anki and AnkiConnect updated
   - Check for updates monthly

## FAQ

**Q: Do I need AnkiConnect for the extension to work?**
A: No! AnkiConnect is only needed for direct sync feature. You can still:
- Create flashcards in the extension
- Export to APKG file
- Import APKG to Anki manually

**Q: Can I use AnkiConnect with AnkiMobile or AnkiDroid?**
A: No. AnkiConnect only works with Anki Desktop. For mobile:
- Use APKG export feature
- Transfer file to mobile device
- Import in AnkiMobile/AnkiDroid

**Q: Does AnkiConnect sync with AnkiWeb?**
A: No. AnkiConnect adds cards locally. To get them on AnkiWeb:
- Use Anki's built-in sync (Tools → Sync)
- This syncs your local collection to AnkiWeb
- Then sync on other devices

**Q: Can multiple applications use AnkiConnect simultaneously?**
A: Yes! AnkiConnect can handle multiple connections.

**Q: Will AnkiConnect slow down Anki?**
A: Minimal impact. Only active when receiving requests.

**Q: Can I use AnkiConnect on Linux/Mac/Windows?**
A: Yes! Works on all platforms that support Anki Desktop.

## Getting Help

### Official AnkiConnect Resources
- GitHub: https://github.com/FooSoft/anki-connect
- AnkiWeb: https://ankiweb.net/shared/info/2055492159
- Issues: https://github.com/FooSoft/anki-connect/issues

### Extension Support
- Check extension documentation
- Report issues with the sync feature
- Include AnkiConnect version and Anki version

## Version Compatibility

**Anki Versions:**
- ✅ Anki 2.1.0+ (Recommended: Latest version)
- ❌ Anki 2.0 (Not supported)

**AnkiConnect Versions:**
- ✅ Version 6+ (Latest recommended)
- This extension uses AnkiConnect API version 6

**Operating Systems:**
- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Linux (most distributions)

---

**Last updated: 2025-02-02**
**Extension version: 2.3.0**
