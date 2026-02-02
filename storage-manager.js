// Storage Manager - Hybrid Local File + Browser Storage
// Automatically syncs between filesystem and chrome.storage.local

class StorageManager {
  constructor() {
    this.storageDir = null;
    this.isFileSystemAvailable = false;
    this.syncInterval = 5000; // Sync every 5 seconds
    this.syncTimer = null;
    this.lastBrowserUpdate = 0;
    this.lastFileUpdate = 0;
  }

  // Initialize storage manager
  async initialize() {
    console.log('StorageManager: Initializing...');
    
    // Check if File System Access API is available
    if ('showDirectoryPicker' in window) {
      this.isFileSystemAvailable = true;
      console.log('StorageManager: File System Access API available');
      
      // Try to restore previous directory handle
      await this.restoreDirectoryHandle();
    } else {
      console.log('StorageManager: File System Access API not available, using browser storage only');
    }

    // Load initial data from browser storage
    await this.loadFromBrowser();

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
      const tx = db.transaction('handles', 'readwrite');
      const store = tx.objectStore('handles');
      await store.put(this.storageDir, 'storageDirectory');
      console.log('StorageManager: Directory handle saved');
    } catch (error) {
      console.error('StorageManager: Error saving directory handle:', error);
    }
  }

  // Restore directory handle from IndexedDB
  async restoreDirectoryHandle() {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      const handle = await store.get('storageDirectory');

      if (handle) {
        // Verify we still have permission
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.storageDir = handle;
          console.log('StorageManager: Directory handle restored');
          return true;
        } else {
          console.log('StorageManager: Permission not granted, need to request again');
        }
      }
    } catch (error) {
      console.error('StorageManager: Error restoring directory handle:', error);
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
      const text = await file.text();
      const data = JSON.parse(text);
      
      this.lastFileUpdate = file.lastModified;
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
      lastBrowserUpdate: this.lastBrowserUpdate,
      lastFileUpdate: this.lastFileUpdate,
      autoSyncEnabled: !!this.syncTimer
    };
  }
}

// Export singleton instance
window.storageManager = new StorageManager();
