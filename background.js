// Background Service Worker - Enhanced with PDF Viewer support

// Context menu items
const MENU_ITEMS = {
  SEND_TO_FRONT: {
    id: 'sendToFront',
    title: 'Send to Front (Alt + A)',
    contexts: ['selection']
  },
  SEND_TO_BACK: {
    id: 'sendToBack',
    title: 'Send to Back (Alt + B)',
    contexts: ['selection']
  },
  OPEN_PDF_VIEWER: {
    id: 'openPDFViewer',
    title: 'Open in AddFlashcard PDF Viewer',
    contexts: ['page', 'link'],
    documentUrlPatterns: ['*://*/*.pdf', 'file:///*.pdf']
  },
  // Image Occlusion menus
  IMAGE_OCCLUSION_PARENT: {
    id: 'imageOcclusionParent',
    title: 'AddFlashcard - Image Occlusion',
    contexts: ['page']
  },
  CAPTURE_AREA: {
    id: 'captureArea',
    title: 'Chụp một vùng',
    contexts: ['page'],
    parentId: 'imageOcclusionParent'
  },
  CAPTURE_FULLPAGE: {
    id: 'captureFullPage',
    title: 'Chụp toàn bộ trang',
    contexts: ['page'],
    parentId: 'imageOcclusionParent'
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
    
    // Create Image Occlusion parent menu
    chrome.contextMenus.create(MENU_ITEMS.IMAGE_OCCLUSION_PARENT);
    
    // Create Image Occlusion submenus
    chrome.contextMenus.create(MENU_ITEMS.CAPTURE_AREA);
    chrome.contextMenus.create(MENU_ITEMS.CAPTURE_FULLPAGE);
    
    console.log('AddFlashcard: Context menus created');
  });
}

// Initialize storage with default values
async function initializeStorage() {
  const defaults = {
    flashcards: [],
    settings: {
      theme: 'light',
      autoSync: false,
      ankiConnectUrl: 'http://127.0.0.1:8765',
      defaultDeck: 'Default'
    },
    stats: {
      totalCards: 0,
      studiedToday: 0,
      lastStudyDate: null
    }
  };
  
  const existing = await chrome.storage.local.get(Object.keys(defaults));
  
  for (const [key, value] of Object.entries(defaults)) {
    if (!existing[key]) {
      await chrome.storage.local.set({ [key]: value });
    }
  }
  
  console.log('AddFlashcard: Storage initialized');
}

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
      
    case 'captureArea':
      await handleCaptureArea(tab);
      break;
      
    case 'captureFullPage':
      await handleCaptureFullPage(tab);
      break;
  }
});

// Handle text selection
async function handleTextSelection(info, tab) {
  if (!info.selectionText) {
    console.log('AddFlashcard: No text selected');
    return;
  }
  
  // Try to extract the selected HTML from the page (so formatting/media is preserved)
  let selectionResult = null;
  try {
    const extracted = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        try {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return { html: '', text: '' };
          const range = selection.getRangeAt(0);
          const container = document.createElement('div');
          container.appendChild(range.cloneContents());
          return { html: container.innerHTML || '', text: selection.toString() };
        } catch (err) {
          return { html: '', text: '' };
        }
      }
    });

    if (extracted && extracted[0] && extracted[0].result) {
      selectionResult = extracted[0].result;
    }
  } catch (err) {
    console.warn('AddFlashcard: Could not extract selection HTML:', err);
  }

  const selectedHtml = (selectionResult && selectionResult.html) ? selectionResult.html : `<p>${info.selectionText}</p>`;
  const selectedText = (selectionResult && selectionResult.text) ? selectionResult.text : info.selectionText;

  const content = {
    type: info.menuItemId,
    dataText: selectedText,
    // Use the extracted HTML when available so sidebar can preserve formatting/media
    dataHtml: selectedHtml,
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

// Handle Image Occlusion - Capture Area
async function handleCaptureArea(tab) {
  try {
    // Inject overlay deps in MAIN world (more reliable for wasm / globals)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      files: [
        'vendor/jszip.min.js',
        'vendor/sql-wasm.js',
        'anki-export-unified.js',
        'overlay-editor-updated.js'
      ]
    });
    
    // Start area selection
    await chrome.tabs.sendMessage(tab.id, {
      action: 'startSelection'
    });
  } catch (error) {
    console.error('AddFlashcard: Error starting area capture:', error);
  }
}

// Handle Image Occlusion - Capture Full Page
async function handleCaptureFullPage(tab) {
  try {
    // Inject overlay deps in MAIN world
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      files: [
        'vendor/jszip.min.js',
        'vendor/sql-wasm.js',
        'anki-export-unified.js',
        'overlay-editor-updated.js'
      ]
    });
    
    // Capture visible tab
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      // Open the in-page overlay UI (same as capture area)
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showOverlayEditor',
          imageData: dataUrl,
          area: null,
          source: 'fullpage'
        });
      } catch (e) {
        // Fallback: open editor tab if overlay is unavailable
        handleOpenImageOcclusionEditor(dataUrl, tab.title);
      }
    });
  } catch (error) {
    console.error('AddFlashcard: Error capturing full page:', error);
  }
}

// Handle Image Occlusion from hover icon or alt-click
async function handleCreateImageOcclusion(message, sender) {
  try {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    // Inject overlay deps in MAIN world
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      files: [
        'vendor/jszip.min.js',
        'vendor/sql-wasm.js',
        'anki-export-unified.js',
        'overlay-editor-updated.js'
      ]
    });
    
    // Send image data to overlay editor
    await chrome.tabs.sendMessage(tabId, {
      action: 'showOverlayEditor',
      imageData: message.imageData,
      area: null,
      source: message.source
    });
  } catch (error) {
    console.error('AddFlashcard: Error creating image occlusion:', error);
  }
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
      
    case 'createImageOcclusion':
      handleCreateImageOcclusion(message, sender);
      sendResponse({ success: true });
      break;
      
    case 'openManagePage':
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('manage.html'),
        active: true
      });
      if (message.mode === 'createDeck') {
        // Send message to manage.html to focus on create deck mode after it loads
        setTimeout(() => {
          chrome.tabs.query({ url: chrome.runtime.getURL('manage.html') }, (tabs) => {
            if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'focusCreateDeck' });
            }
          });
        }, 500);
      }
      sendResponse({ success: true });
      break;
      
    // Image Occlusion handlers
    case 'captureForOverlay':
      handleCaptureForOverlay(message.area, sender.tab);
      sendResponse({ success: true });
      break;
      
    case 'openImageOcclusionEditor':
      handleOpenImageOcclusionEditor(message.imageData, message.pageTitle, message.occlusions, message.autoExport);
      sendResponse({ success: true });
      break;

    // Ensure overlay dependencies are injected (requested by content script)
    case 'injectOverlayDeps':
      (async () => {
        try {
          const tabId = sender.tab?.id;
          if (!tabId) return sendResponse({ success: false, error: 'No tab' });
          await chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            files: [
              'vendor/jszip.min.js',
              'vendor/sql-wasm.js',
              'anki-export-unified.js',
              'overlay-editor-updated.js'
            ]
          });
          sendResponse({ success: true });
        } catch (err) {
          console.error('AddFlashcard: injectOverlayDeps failed', err);
          sendResponse({ success: false, error: err && err.message ? err.message : String(err) });
        }
      })();
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

// Helper: Escape HTML (string-only, safe for service worker context)
function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  const s = String(text);
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\"/g, '&quot;')
          .replace(/'/g, '&#39;');
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

// Image Occlusion helper: Capture area for overlay
async function handleCaptureForOverlay(area, tab) {
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    // Crop image if area is specified
    const croppedImage = area ? await cropImage(dataUrl, area) : dataUrl;

    // Send to page overlay editor (in-page)
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showOverlayEditor',
        imageData: croppedImage,
        area: area
      });
    } catch (err) {
      // Fallback: open editor tab if sending message fails
      console.warn('AddFlashcard: sending showOverlayEditor failed, opening editor tab instead', err);
      handleOpenImageOcclusionEditor(croppedImage, tab.title);
    }
  });
}

// Image Occlusion helper: Open editor in new tab
function handleOpenImageOcclusionEditor(imageData, pageTitle, occlusions, autoExport) {
  chrome.tabs.create({
    url: chrome.runtime.getURL('image-occlusion-editor.html')
  }, (tab) => {
    // Wait for tab to load then send data
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.sendMessage(tab.id, {
          action: 'loadImage',
          imageData: imageData,
          pageTitle: pageTitle || 'Image Occlusion',
          occlusions: occlusions || null,
          autoExport: !!autoExport
        });
      }
    });
  });
}

// Crop image helper
async function cropImage(dataUrl, area) {
  return new Promise((resolve) => {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        const canvas = new OffscreenCanvas(
          area.width * area.devicePixelRatio,
          area.height * area.devicePixelRatio
        );
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(
          bitmap,
          area.left * area.devicePixelRatio,
          area.top * area.devicePixelRatio,
          area.width * area.devicePixelRatio,
          area.height * area.devicePixelRatio,
          0,
          0,
          area.width * area.devicePixelRatio,
          area.height * area.devicePixelRatio
        );
        
        return canvas.convertToBlob({ type: 'image/png' });
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error('Crop image error:', err);
        resolve(dataUrl);
      });
  });
}

console.log('AddFlashcard: Background service worker loaded');
