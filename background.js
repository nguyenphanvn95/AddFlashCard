// Background Service Worker - Enhanced with PDF Viewer support

// Context menu items
const MENU_ITEMS = {
  SEND_TO_FRONT: {
    id: 'sendToFront',
    title: 'Add to Front (AddFlashcard)',
    contexts: ['selection']
  },
  SEND_TO_BACK: {
    id: 'sendToBack',
    title: 'Add to Back (AddFlashcard)',
    contexts: ['selection']
  },
  OPEN_PDF_VIEWER: {
    id: 'openPDFViewer',
    title: 'Open in AddFlashcard PDF Viewer',
    contexts: ['page', 'link'],
    documentUrlPatterns: ['*://*/*.pdf', 'file:///*.pdf']
  }
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AddFlashcard: Extension installed/updated', details.reason);
  
  // Create context menus
  createContextMenus();
  
  // Initialize storage
  await initializeStorage();
  
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html') });
  }
});

// Create context menus
function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Create selection menus
    chrome.contextMenus.create(MENU_ITEMS.SEND_TO_FRONT);
    chrome.contextMenus.create(MENU_ITEMS.SEND_TO_BACK);
    
    // Create PDF menu
    chrome.contextMenus.create(MENU_ITEMS.OPEN_PDF_VIEWER);
    
    console.log('AddFlashcard: Context menus created');
  });
}

// Initialize storage with default values and migrate legacy keys if needed
async function initializeStorage() {
  // Desired keys used by the UI/logic
  const expectedKeys = ['cards', 'decks', 'settings', 'stats'];

  // Fetch any existing keys
  const existingAll = await chrome.storage.local.get();

  // Migration: if old `flashcards` exists but `cards` does not, migrate it
  if (existingAll.flashcards && !existingAll.cards) {
    try {
      await chrome.storage.local.set({ cards: existingAll.flashcards });
      console.log('AddFlashcard: Migrated `flashcards` -> `cards`');
    } catch (e) {
      console.error('AddFlashcard: Migration failed', e);
    }
  }

  // Ensure `decks` exists (expected format: array or object)
  if (!existingAll.decks) {
    await chrome.storage.local.set({ decks: ['Default'] });
  }

  // Ensure `settings` exists
  if (!existingAll.settings) {
    await chrome.storage.local.set({ settings: {
      theme: 'light',
      autoSync: false,
      ankiConnectUrl: 'http://127.0.0.1:8765',
      defaultDeck: 'Default'
    }});
  }

  // Ensure `stats` exists
  if (!existingAll.stats) {
    await chrome.storage.local.set({ stats: {
      totalCards: 0,
      studiedToday: 0,
      lastStudyDate: null
    }});
  }

  // Ensure `cards` exists (default empty array)
  const nowExisting = await chrome.storage.local.get(['cards']);
  if (!nowExisting.cards) {
    await chrome.storage.local.set({ cards: [] });
  }

  console.log('AddFlashcard: Storage initialized (with migrations)');
}

// Keep legacy `flashcards` and new `cards` keys in sync for compatibility with older modules
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // If cards changed and flashcards differs, mirror it
  if (changes.cards && changes.cards.newValue !== undefined) {
    chrome.storage.local.get(['flashcards']).then(existing => {
      if (!existing.flashcards || JSON.stringify(existing.flashcards) !== JSON.stringify(changes.cards.newValue)) {
        chrome.storage.local.set({ flashcards: changes.cards.newValue }).catch(() => {});
      }
    }).catch(() => {});
  }

  // If flashcards changed and cards differs, mirror it
  if (changes.flashcards && changes.flashcards.newValue !== undefined) {
    chrome.storage.local.get(['cards']).then(existing => {
      if (!existing.cards || JSON.stringify(existing.cards) !== JSON.stringify(changes.flashcards.newValue)) {
        chrome.storage.local.set({ cards: changes.flashcards.newValue }).catch(() => {});
      }
    }).catch(() => {});
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('AddFlashcard: Context menu clicked', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'sendToFront':
    case 'sendToBack':
      await handleTextSelection(info, tab);
      break;
      
    case 'openPDFViewer':
      await handleOpenPDFViewer(info, tab);
      break;
  }
});

// Handle text selection
async function handleTextSelection(info, tab) {
  if (!info.selectionText) {
    console.log('AddFlashcard: No text selected');
    return;
  }
  
  const content = {
    type: info.menuItemId,
    dataText: info.selectionText,
    dataHtml: `<p>${escapeHtml(info.selectionText)}</p>`,
    pageUrl: info.pageUrl || tab.url,
    pageTitle: tab.title,
    sourceType: 'context-menu',
    timestamp: new Date().toISOString()
  };
  
  // Inject content script if needed
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) {
    console.log('AddFlashcard: Content script already injected or cannot inject');
  }
  
  // Send message to open sidebar
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'openSidebarWithContent',
      content: content
    });
  } catch (error) {
    console.error('AddFlashcard: Error sending message:', error);
  }
}

// Handle opening PDF in viewer
async function handleOpenPDFViewer(info, tab) {
  let pdfUrl = info.pageUrl || tab.url;
  
  // If clicked on a link, use the link URL
  if (info.linkUrl && info.linkUrl.toLowerCase().endsWith('.pdf')) {
    pdfUrl = info.linkUrl;
  }
  
  if (!pdfUrl || !pdfUrl.toLowerCase().includes('.pdf')) {
    console.log('AddFlashcard: Not a PDF URL');
    return;
  }
  
  // Open PDF viewer in new tab
  const viewerUrl = chrome.runtime.getURL('pdf-viewer.html') + '?file=' + encodeURIComponent(pdfUrl);
  await chrome.tabs.create({ url: viewerUrl });
}

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('AddFlashcard: Message received', message.action);
  
  switch (message.action) {
    case 'openSidebarWithContent':
      handleOpenSidebarMessage(message, sender);
      sendResponse({ success: true });
      break;
      
    case 'openPDFViewer':
      chrome.tabs.create({ url: message.url });
      sendResponse({ success: true });
      break;
      
    case 'exportAPKG':
      handleExportAPKG(message.flashcards);
      sendResponse({ success: true });
      break;
      
    case 'saveFlashcard':
      handleSaveFlashcard(message.flashcard)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
      
    case 'getFlashcards':
      handleGetFlashcards()
        .then(flashcards => sendResponse({ success: true, flashcards }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep message channel open
});

// Handle opening sidebar from PDF
async function handleOpenSidebarMessage(message, sender) {
  if (!sender.tab) {
    console.log('AddFlashcard: No sender tab');
    return;
  }
  
  try {
    // Inject sidebar if not already present
    await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['content.js']
    });
    
    // Send content to sidebar
    await chrome.tabs.sendMessage(sender.tab.id, {
      action: 'openSidebarWithContent',
      content: message.content
    });
  } catch (error) {
    console.error('AddFlashcard: Error opening sidebar:', error);
  }
}

// Handle export APKG
function handleExportAPKG(flashcards) {
  // This will be handled by the manage page
  chrome.tabs.create({ 
    url: chrome.runtime.getURL('manage.html#export'),
    active: true
  });
}

// Save flashcard
async function handleSaveFlashcard(flashcard) {
  const result = await chrome.storage.local.get(['flashcards']);
  const flashcards = result.flashcards || [];
  
  // Add timestamp if not present
  if (!flashcard.created) {
    flashcard.created = Date.now();
  }
  
  // Add or update flashcard
  const existingIndex = flashcards.findIndex(c => c.id === flashcard.id);
  if (existingIndex >= 0) {
    flashcards[existingIndex] = flashcard;
  } else {
    flashcard.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    flashcards.push(flashcard);
  }
  
  await chrome.storage.local.set({ flashcards });
  
  console.log('AddFlashcard: Flashcard saved', flashcard.id);
}

// Get all flashcards
async function handleGetFlashcards() {
  const result = await chrome.storage.local.get(['flashcards']);
  return result.flashcards || [];
}

// Helper: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  console.log('AddFlashcard: Command received', command);
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) return;
  
  switch (command) {
    case 'send-to-front':
    case 'send-to-back':
      // Get selected text and create flashcard
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (action) => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText) {
              chrome.runtime.sendMessage({
                action: 'openSidebarWithContent',
                content: {
                  type: action,
                  dataText: selectedText,
                  dataHtml: `<p>${selectedText}</p>`,
                  pageUrl: window.location.href,
                  pageTitle: document.title,
                  sourceType: 'keyboard-shortcut'
                }
              });
            }
          },
          args: [command === 'send-to-front' ? 'sendToFront' : 'sendToBack']
        });
      } catch (error) {
        console.error('AddFlashcard: Error executing keyboard command:', error);
      }
      break;
  }
});

// Listen for tab updates to inject PDF support
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a PDF
    if (tab.url.toLowerCase().includes('.pdf')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['pdf-support.js']
        });
        console.log('AddFlashcard: PDF support injected into tab', tabId);
      } catch (error) {
        console.log('AddFlashcard: Could not inject PDF support:', error.message);
      }
    }
  }
});

console.log('AddFlashcard: Background service worker loaded');
