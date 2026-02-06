// Storage Manager - Hybrid Local File + Browser Storage
// Automatically syncs between filesystem and chrome.storage.local

class StorageManager {
  constructor() {
    this.storageDir = null;
    this.storageDirName = null;
    this.isFileSystemAvailable = false;
    this.syncInterval = 5 * 60 * 1000; // Sync every 5 minutes
    this.syncTimer = null;
    this.folderConfigured = false;
    this.lastBrowserUpdate = 0;
    this.lastFileUpdate = 0;
    this.lastDomainsBrowserUpdate = 0;
    this.lastDomainsFileUpdate = 0;
  }

  // Initialize storage manager
  async initialize() {
    console.log('StorageManager: Initializing...');
    try {
      const saved = await chrome.storage.local.get(['sync_folder_selected', 'sync_folder_name']);
      this.folderConfigured = !!saved.sync_folder_selected;
      this.storageDirName = saved.sync_folder_name || null;
    } catch (error) {
      console.warn('StorageManager: Could not read sync folder flags from storage', error);
    }
    
    // Check if File System Access API is available
    if ('showDirectoryPicker' in window) {
      this.isFileSystemAvailable = true;
      console.log('StorageManager: File System Access API available');
      
      // Try to restore previous directory handle
      const restored = await this.restoreDirectoryHandle();
      if (!restored && !this.folderConfigured) {
        await chrome.storage.local.set({ sync_folder_selected: false });
      }
    } else {
      console.log('StorageManager: File System Access API not available, using browser storage only');
      await chrome.storage.local.set({ sync_folder_selected: false });
    }

    // Load initial data from browser storage
    await this.loadFromBrowser();
    await this.loadDomainsFromBrowser();
    await this.refreshFileMetadata();

    // Start auto-sync
    this.startAutoSync();

    return this.isFileSystemAvailable;
  }

  // Request directory access from user
  async requestDirectoryAccess() {
    if (!this.isFileSystemAvailable) {
      throw new Error('File System Access API not available');
    }

    try {
    this.storageDir = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
      this.storageDirName = this.storageDir?.name || null;
      this.folderConfigured = true;

      // Save directory handle for future sessions
      await this.saveDirectoryHandle();

      console.log('StorageManager: Directory access granted');
      
      // Initial sync
      await this.syncBothWays();

      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('StorageManager: User cancelled directory selection');
      } else {
        console.error('StorageManager: Error requesting directory access:', error);
      }
      return false;
    }
  }

  // Save directory handle to IndexedDB
  async saveDirectoryHandle() {
    if (!this.storageDir) return;

    try {
      const db = await this.openIndexedDB();
      await this.idbPut(db, 'handles', this.storageDir, 'storageDirectory');
      await chrome.storage.local.set({
        sync_folder_selected: true,
        sync_folder_name: this.storageDir?.name || this.storageDirName || null
      });
      this.folderConfigured = true;
      this.storageDirName = this.storageDir?.name || this.storageDirName || null;
      console.log('StorageManager: Directory handle saved');
    } catch (error) {
      console.error('StorageManager: Error saving directory handle:', error);
    }
  }

  // Restore directory handle from IndexedDB
  async restoreDirectoryHandle() {
    try {
      const db = await this.openIndexedDB();
      const handle = await this.idbGet(db, 'handles', 'storageDirectory');

      if (handle) {
        this.folderConfigured = true;
        this.storageDirName = handle.name || this.storageDirName || null;
        await chrome.storage.local.set({
          sync_folder_selected: true,
          sync_folder_name: this.storageDirName
        });

        // Verify we still have permission
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.storageDir = handle;
          this.storageDirName = handle.name || this.storageDirName || null;
          console.log('StorageManager: Directory handle restored');
          return true;
        } else {
          console.log('StorageManager: Handle exists but permission not granted for this session');
        }
      }
    } catch (error) {
      console.error('StorageManager: Error restoring directory handle:', error);
    }
    if (!this.folderConfigured) {
      await chrome.storage.local.set({
        sync_folder_selected: false,
        sync_folder_name: null
      });
    }
    return false;
  }

  // Open IndexedDB for storing directory handles
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AddFlashcardStorage', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
        }
      };
    });
  }

  idbGet(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }

  idbPut(db, storeName, value, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }

  // Load data from browser storage
  async loadFromBrowser() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cards', 'decks', 'lastUpdate'], (result) => {
        this.lastBrowserUpdate = result.lastUpdate || 0;
        console.log('StorageManager: Loaded from browser storage, lastUpdate:', this.lastBrowserUpdate);
        resolve(result);
      });
    });
  }

  // Save data to browser storage
  async saveToBrowser(data) {
    return new Promise((resolve) => {
      const saveData = {
        ...data,
        lastUpdate: Date.now()
      };
      chrome.storage.local.set(saveData, () => {
        this.lastBrowserUpdate = saveData.lastUpdate;
        console.log('StorageManager: Saved to browser storage');
        resolve();
      });
    });
  }

  // Load data from file system
  async loadFromFile() {
    if (!this.storageDir) {
      console.log('StorageManager: No directory handle, skipping file load');
      return null;
    }

    try {
      const fileHandle = await this.storageDir.getFileHandle('flashcards.json', { create: false });
      const file = await fileHandle.getFile();
      this.lastFileUpdate = file.lastModified || 0;
      const text = await file.text();
      const data = JSON.parse(text);

      console.log('StorageManager: Loaded from file, lastModified:', this.lastFileUpdate);
      
      return data;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        console.log('StorageManager: File not found, will create on first save');
      } else {
        console.error('StorageManager: Error loading from file:', error);
      }
      return null;
    }
  }

  // Save data to file system
  async saveToFile(data) {
    if (!this.storageDir) {
      console.log('StorageManager: No directory handle, skipping file save');
      return false;
    }

    try {
      const fileHandle = await this.storageDir.getFileHandle('flashcards.json', { create: true });
      const writable = await fileHandle.createWritable();
      
      const saveData = {
        ...data,
        lastUpdate: Date.now(),
        version: '2.4.0'
      };
      
      await writable.write(JSON.stringify(saveData, null, 2));
      await writable.close();
      
      this.lastFileUpdate = saveData.lastUpdate;
      console.log('StorageManager: Saved to file');
      
      return true;
    } catch (error) {
      console.error('StorageManager: Error saving to file:', error);
      return false;
    }
  }

  // Load allow-copy domains from browser storage
  async loadDomainsFromBrowser() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['allowCopyWhitelist', 'allowCopyEnabled', 'domainsLastUpdate'], (result) => {
        this.lastDomainsBrowserUpdate = result.domainsLastUpdate || 0;
        resolve({
          domains: result.allowCopyWhitelist || [],
          allowCopyEnabled: result.allowCopyEnabled !== false,
          lastUpdate: this.lastDomainsBrowserUpdate
        });
      });
    });
  }

  // Save allow-copy domains to browser storage
  async saveDomainsToBrowser(data) {
    return new Promise((resolve) => {
      const saveData = {
        allowCopyWhitelist: Array.isArray(data.domains) ? data.domains : [],
        allowCopyEnabled: data.allowCopyEnabled !== false,
        domainsLastUpdate: Date.now()
      };
      chrome.storage.local.set(saveData, () => {
        this.lastDomainsBrowserUpdate = saveData.domainsLastUpdate;
        console.log('StorageManager: Saved domains to browser storage');
        resolve();
      });
    });
  }

  // Load allow-copy domains from file system
  async loadDomainsFromFile() {
    if (!this.storageDir) {
      console.log('StorageManager: No directory handle, skipping domains file load');
      return null;
    }

    try {
      const fileHandle = await this.storageDir.getFileHandle('domains.json', { create: false });
      const file = await fileHandle.getFile();
      this.lastDomainsFileUpdate = file.lastModified || 0;
      const text = await file.text();
      const data = JSON.parse(text);

      console.log('StorageManager: Loaded domains from file, lastModified:', this.lastDomainsFileUpdate);

      return data;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        console.log('StorageManager: domains.json not found, will create on first save');
      } else {
        console.error('StorageManager: Error loading domains from file:', error);
      }
      return null;
    }
  }

  // Read file timestamps directly from selected directory for accurate sync status
  async refreshFileMetadata() {
    if (!this.storageDir) return;

    // flashcards.json
    try {
      const flashcardsHandle = await this.storageDir.getFileHandle('flashcards.json', { create: false });
      const flashcardsFile = await flashcardsHandle.getFile();
      this.lastFileUpdate = flashcardsFile.lastModified || 0;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        this.lastFileUpdate = 0;
      } else {
        console.error('StorageManager: Error reading flashcards.json metadata:', error);
      }
    }

    // domains.json
    try {
      const domainsHandle = await this.storageDir.getFileHandle('domains.json', { create: false });
      const domainsFile = await domainsHandle.getFile();
      this.lastDomainsFileUpdate = domainsFile.lastModified || 0;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        this.lastDomainsFileUpdate = 0;
      } else {
        console.error('StorageManager: Error reading domains.json metadata:', error);
      }
    }
  }

  // Save allow-copy domains to file system
  async saveDomainsToFile(data) {
    if (!this.storageDir) {
      console.log('StorageManager: No directory handle, skipping domains file save');
      return false;
    }

    try {
      const fileHandle = await this.storageDir.getFileHandle('domains.json', { create: true });
      const writable = await fileHandle.createWritable();

      const saveData = {
        domains: Array.isArray(data.domains) ? data.domains : [],
        allowCopyEnabled: data.allowCopyEnabled !== false,
        lastUpdate: Date.now(),
        version: '1.0'
      };

      await writable.write(JSON.stringify(saveData, null, 2));
      await writable.close();

      this.lastDomainsFileUpdate = saveData.lastUpdate;
      console.log('StorageManager: Saved domains to file');

      return true;
    } catch (error) {
      console.error('StorageManager: Error saving domains to file:', error);
      return false;
    }
  }

  // Sync allow-copy domains both ways - prioritize newer data
  async syncDomainsBothWays() {
    const browserData = await this.loadDomainsFromBrowser();
    const fileData = await this.loadDomainsFromFile();

    const browserTime = browserData.lastUpdate || 0;
    const fileTime = fileData ? (fileData.lastUpdate || 0) : 0;

    console.log('StorageManager: Domains browser timestamp:', browserTime, 'File timestamp:', fileTime);

    const browserHasDomains = Array.isArray(browserData.domains);
    const fileHasDomains = fileData && Array.isArray(fileData.domains);

    if (!fileHasDomains && browserHasDomains) {
      console.log('StorageManager: No domains file data, saving browser domains to file');
      await this.saveDomainsToFile(browserData);
      return;
    }

    if (!browserHasDomains && fileHasDomains) {
      console.log('StorageManager: No browser domains data, saving file domains to browser');
      await this.saveDomainsToBrowser(fileData);
      return;
    }

    if (fileHasDomains && browserHasDomains) {
      if (fileTime > browserTime) {
        console.log('StorageManager: Domains file is newer, updating browser storage');
        await this.saveDomainsToBrowser(fileData);
      } else if (browserTime > fileTime) {
        console.log('StorageManager: Domains browser is newer, updating file');
        await this.saveDomainsToFile(browserData);
      } else {
        console.log('StorageManager: Domains sources are in sync');
      }
    }
  }

  // Sync both ways - prioritize newer data
  async syncBothWays() {
    console.log('StorageManager: Starting two-way sync...');

    // Load from both sources
    const browserData = await this.loadFromBrowser();
    const fileData = await this.loadFromFile();

    // Determine which is newer
    const browserTime = browserData.lastUpdate || 0;
    const fileTime = fileData ? (fileData.lastUpdate || 0) : 0;

    console.log('StorageManager: Browser timestamp:', browserTime, 'File timestamp:', fileTime);

    if (!fileData && browserData.cards) {
      // No file data, save browser data to file
      console.log('StorageManager: No file data, saving browser data to file');
      await this.saveToFile(browserData);
    } else if (!browserData.cards && fileData) {
      // No browser data, save file data to browser
      console.log('StorageManager: No browser data, saving file data to browser');
      await this.saveToBrowser(fileData);
    } else if (fileData && browserData.cards) {
      // Both exist, use newer one
      if (fileTime > browserTime) {
        console.log('StorageManager: File is newer, updating browser storage');
        await this.saveToBrowser(fileData);
      } else if (browserTime > fileTime) {
        console.log('StorageManager: Browser is newer, updating file');
        await this.saveToFile(browserData);
      } else {
        console.log('StorageManager: Both sources are in sync');
      }
    }

    // Sync allow-copy domains in the same folder
    await this.syncDomainsBothWays();
  }

  // Save data to both locations
  async save(data) {
    const timestamp = Date.now();
    const saveData = {
      ...data,
      lastUpdate: timestamp
    };

    // Save to browser first (always available)
    await this.saveToBrowser(saveData);

    // Save to file if available
    if (this.storageDir) {
      await this.saveToFile(saveData);
    }

    return true;
  }

  // Load latest data (checks both sources)
  async load() {
    await this.syncBothWays();
    return await this.loadFromBrowser();
  }

  // Start automatic sync
  startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.storageDir) {
        await this.syncBothWays();
      }
    }, this.syncInterval);

    console.log('StorageManager: Auto-sync started (every', this.syncInterval / 1000, 'seconds)');
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('StorageManager: Auto-sync stopped');
    }
  }

  // Export data to a specific location
  async exportToCustomLocation() {
    const data = await this.loadFromBrowser();
    
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `flashcards-backup-${Date.now()}.json`,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      console.log('StorageManager: Data exported successfully');
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('StorageManager: Export cancelled by user');
      } else {
        console.error('StorageManager: Export error:', error);
      }
      return false;
    }
  }

  // Import data from a file
  async importFromFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }],
        multiple: false
      });

      const file = await handle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);

      // Merge with existing data
      const existing = await this.loadFromBrowser();
      const merged = this.mergeData(existing, data);

      // Save merged data
      await this.save(merged);

      console.log('StorageManager: Data imported successfully');
      return merged;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('StorageManager: Import cancelled by user');
      } else {
        console.error('StorageManager: Import error:', error);
      }
      return null;
    }
  }

  // Merge two data sets
  mergeData(existing, imported) {
    const mergedCards = [...(existing.cards || [])];
    const mergedDecks = [...(existing.decks || ['Default'])];
    
    // Add imported cards (avoid duplicates by ID)
    const existingIds = new Set(mergedCards.map(c => c.id));
    (imported.cards || []).forEach(card => {
      if (!existingIds.has(card.id)) {
        mergedCards.push(card);
      }
    });

    // Add imported decks
    (imported.decks || []).forEach(deck => {
      if (!mergedDecks.includes(deck)) {
        mergedDecks.push(deck);
      }
    });

    return {
      cards: mergedCards,
      decks: mergedDecks
    };
  }

  // Get storage status
  getStatus() {
    return {
      fileSystemAvailable: this.isFileSystemAvailable,
      directorySelected: !!this.storageDir,
      folderConfigured: this.folderConfigured,
      storageDirName: this.storageDir?.name || this.storageDirName || null,
      lastBrowserUpdate: this.lastBrowserUpdate,
      lastFileUpdate: this.lastFileUpdate,
      lastDomainsBrowserUpdate: this.lastDomainsBrowserUpdate,
      lastDomainsFileUpdate: this.lastDomainsFileUpdate,
      autoSyncEnabled: !!this.syncTimer
    };
  }
}

// Export singleton instance
window.storageManager = new StorageManager();

// Debug: Log any changes made to chrome.storage.local so we can detect writes
if (chrome && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    try {
      console.log('[AddFlashcard][storage.onChanged] keys:', Object.keys(changes));
      for (const key in changes) {
        console.log('[AddFlashcard][storage.onChanged] ', key, '=>', changes[key]);
      }

      const dataChanged = !!changes.cards || !!changes.decks;
      const lastUpdateChanged = !!changes.lastUpdate;
      const domainsChanged = !!changes.allowCopyWhitelist || !!changes.allowCopyEnabled;
      const domainsLastUpdateChanged = !!changes.domainsLastUpdate;

      if (dataChanged && !lastUpdateChanged) {
        chrome.storage.local.set({ lastUpdate: Date.now() }, () => {
          console.log('[AddFlashcard][storage.onChanged] lastUpdate updated');
        });
      }

      if (domainsChanged && !domainsLastUpdateChanged) {
        chrome.storage.local.set({ domainsLastUpdate: Date.now() }, () => {
          console.log('[AddFlashcard][storage.onChanged] domainsLastUpdate updated');
        });
      }
    } catch (err) {
      console.log('[AddFlashcard][storage.onChanged] error printing changes', err);
    }
  });
}
