// DOM Elements
const deckList = document.getElementById('deckList');
const cardsGrid = document.getElementById('cardsGrid');
const currentDeckName = document.getElementById('currentDeckName');
const cardCount = document.getElementById('cardCount');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const addDeckBtn = document.getElementById('addDeckBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const emptyState = document.getElementById('emptyState');
const studyModeBtn = document.getElementById('studyModeBtn');
const tagFilter = document.getElementById('tagFilter');
const selectSyncFolderBtn = document.getElementById('selectSyncFolderBtn');
const syncNowBtn = document.getElementById('syncNowBtn');
const syncStatusText = document.getElementById('syncStatusText');

// Modal elements
const editModal = document.getElementById('editModal');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');
const modalDeckSelect = document.getElementById('modalDeckSelect');
const modalFrontEditor = document.getElementById('modalFrontEditor');
const modalBackEditor = document.getElementById('modalBackEditor');

// Preview modal
const previewModal = document.getElementById('previewModal');
const previewClose = document.getElementById('previewClose');
const previewFrontContent = document.getElementById('previewFrontContent');
const previewBackContent = document.getElementById('previewBackContent');

// State
let currentDeck = null;
let currentCard = null;
let allCards = [];
let allDecks = [];
let syncStatusTimer = null;
const defaultSyncPath = 'C:\\Users\\Admin\\Documents\\GitHub\\AddFlashCard\\data-sync';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    await initStorageSync();
    await loadData();
    setupEventListeners();
    setupRichTextShortcuts();

    // Check if we should open deck creation modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'createDeck') {
      // Switch to home view and open deck modal
      const homeTab = document.querySelector('[data-tab="home"]');
      if (homeTab) {
        homeTab.click(); // Switch to home view
        
        // Wait for integratedManager to be ready, then open modal
        const checkAndOpen = () => {
          if (window.integratedManager && typeof window.integratedManager.showDeckModal === 'function') {
            console.log('Opening deck creation modal...');
            window.integratedManager.showDeckModal();
            // Clean up URL after opening
            window.history.replaceState({}, document.title, chrome.runtime.getURL('manage.html'));
          } else {
            // Retry after a bit
            setTimeout(checkAndOpen, 100);
          }
        };
        
        // Start checking with initial delay
        setTimeout(checkAndOpen, 200);
      }
    }

    // Auto-refresh UI when cards/decks are updated elsewhere (e.g. sidebar edit/save)
    // so the manager reflects changes immediately without manual reload.
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      let needsRender = false;

      if (changes.cards) {
        allCards = changes.cards.newValue || [];
        needsRender = true;
      }

      if (changes.decks) {
        allDecks = changes.decks.newValue || ['Default'];
        needsRender = true;
      }

      if (needsRender) {
        renderDecks();
        renderCards();
      }
    });

    // Handle messages from sidebar to open manager in create deck mode
    window.addEventListener('message', (event) => {
      if (event.data.action === 'openManagePage' && event.data.mode === 'createDeck') {
        // Switch to home view and open deck modal
        const homeTab = document.querySelector('[data-tab="home"]');
        const cardsTab = document.querySelector('[data-tab="cards"]');
        
        if (homeTab && cardsTab) {
          homeTab.click(); // Switch to home view
          
          // Wait a moment for view to switch, then open modal
          setTimeout(() => {
            if (window.integratedManager && typeof window.integratedManager.showDeckModal === 'function') {
              window.integratedManager.showDeckModal();
            }
          }, 100);
        }
      }
    });
  })();
});

async function initStorageSync() {
  if (!syncStatusText) return;
  if (!window.storageManager) {
    syncStatusText.textContent = 'Auto-sync: Không khả dụng (thiếu storage-manager.js)';
    return;
  }

  try {
    await window.storageManager.initialize();
    updateSyncStatus();
    if (!syncStatusTimer) {
      syncStatusTimer = setInterval(() => {
        updateSyncStatus();
      }, 3000);
    }
  } catch (error) {
    console.error('Storage sync init error:', error);
    syncStatusText.textContent = 'Auto-sync: Lỗi khởi tạo';
  }
}

function formatTimestamp(value) {
  if (!value) return 'chưa có';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return 'chưa có';
  }
}

function updateSyncStatus() {
  if (!syncStatusText || !window.storageManager) return;

  const status = window.storageManager.getStatus();
  if (!status.fileSystemAvailable) {
    syncStatusText.textContent = 'Auto-sync: Trình duyệt không hỗ trợ';
    return;
  }

  if (!status.directorySelected) {
    syncStatusText.textContent = `Auto-sync: Chưa chọn thư mục. Mặc định mong muốn: ${defaultSyncPath}\\flashcards.json`;
    return;
  }

  const folderName = window.storageManager.storageDir ? window.storageManager.storageDir.name : 'Thư mục đã chọn';
  const browserTime = formatTimestamp(status.lastBrowserUpdate);
  const fileTime = formatTimestamp(status.lastFileUpdate);
  syncStatusText.textContent = `Auto-sync: ${folderName}\\flashcards.json | Browser: ${browserTime} | File: ${fileTime}`;
}

// Load all data
function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['cards', 'decks'], (result) => {
      allCards = result.cards || [];
      let decks = result.decks;
      
      // Handle both array (legacy) and object (new) formats
      if (Array.isArray(decks)) {
        allDecks = decks;
      } else if (decks && typeof decks === 'object') {
        // Convert object format to array format for manage.js compatibility
        allDecks = Object.values(decks).map(d => d.name || d);
      } else {
        allDecks = ['Default'];
      }
      
      console.log('loadData: allDecks after update =', allDecks);
      console.log('loadData: allCards after update =', allCards);
      
      renderDecks();
      renderCards();
      resolve();
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Use IntegratedManager deck modal if available, otherwise fallback to createDeck
  addDeckBtn.addEventListener('click', () => {
    if (window.integratedManager && typeof window.integratedManager.showDeckModal === 'function') {
      window.integratedManager.showDeckModal();
    } else {
      createDeck();
    }
  });
  deleteAllBtn.addEventListener('click', deleteAllCards);
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importData);
  searchInput.addEventListener('input', renderCards);
  sortSelect.addEventListener('change', renderCards);

  if (selectSyncFolderBtn) {
    selectSyncFolderBtn.addEventListener('click', async () => {
      if (!window.storageManager) {
        alert('Storage manager chưa sẵn sàng.');
        return;
      }
      try {
        const ok = await window.storageManager.requestDirectoryAccess();
        if (ok) {
          await window.storageManager.syncBothWays();
        }
        updateSyncStatus();
      } catch (error) {
        console.error('Select sync folder error:', error);
        alert('Không thể chọn thư mục sync. Vui lòng thử lại.');
      }
    });
  }

  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', async () => {
      if (!window.storageManager) {
        alert('Storage manager chưa sẵn sàng.');
        return;
      }
      try {
        await window.storageManager.syncBothWays();
        updateSyncStatus();
      } catch (error) {
        console.error('Sync now error:', error);
        alert('Sync thất bại. Vui lòng thử lại.');
      }
    });
  }
  
  // Modal
  modalClose.addEventListener('click', closeEditModal);
  modalCancel.addEventListener('click', closeEditModal);
  modalSave.addEventListener('click', saveCard);
  
  // Preview modal
  previewClose.addEventListener('click', closePreviewModal);
  
  // Close modals on backdrop click
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });
  
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closePreviewModal();
  });
  
  // Sidebar editor event listeners
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebarCancelBtn = document.getElementById('sidebarCancelBtn');
  const sidebarSaveBtn = document.getElementById('sidebarSaveBtn');
  
  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', closeEditSidebar);
  }
  
  if (sidebarCancelBtn) {
    sidebarCancelBtn.addEventListener('click', closeEditSidebar);
  }
  
  if (sidebarSaveBtn) {
    sidebarSaveBtn.addEventListener('click', saveSidebarCard);
  }
  
  // Setup toolbar buttons for sidebar
  setupSidebarToolbar();
}

// Setup sidebar toolbar
function setupSidebarToolbar() {
  const frontEditor = document.getElementById('sidebarFrontEditor');
  const backEditor = document.getElementById('sidebarBackEditor');
  
  // Toolbar buttons
  const toolbarBtns = document.querySelectorAll('.editor-toolbar .toolbar-btn[data-command]');
  toolbarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.getAttribute('data-command');
      const target = btn.getAttribute('data-target');
      const editor = target === 'front' ? frontEditor : backEditor;
      
      editor.focus();
      document.execCommand(command, false, null);
    });
  });
  
  // Link buttons
  const linkBtnFront = document.getElementById('linkBtnFrontSidebar');
  const linkBtnBack = document.getElementById('linkBtnBackSidebar');
  
  if (linkBtnFront) {
    linkBtnFront.addEventListener('click', () => insertLink(frontEditor));
  }
  
  if (linkBtnBack) {
    linkBtnBack.addEventListener('click', () => insertLink(backEditor));
  }
  
  // Image buttons
  const imageBtnFront = document.getElementById('imageBtnFrontSidebar');
  const imageBtnBack = document.getElementById('imageBtnBackSidebar');
  
  if (imageBtnFront) {
    imageBtnFront.addEventListener('click', () => insertImage(frontEditor));
  }
  
  if (imageBtnBack) {
    imageBtnBack.addEventListener('click', () => insertImage(backEditor));
  }
}

// Insert link helper
function insertLink(editor) {
  const url = prompt('Enter URL:');
  if (url) {
    editor.focus();
    document.execCommand('createLink', false, url);
  }
}

// Insert image helper
function insertImage(editor) {
  const url = prompt('Enter image URL:');
  if (url) {
    editor.focus();
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    editor.appendChild(img);
  }
}

// Render decks
function renderDecks() {
  // Handle both array (legacy) and object (new) formats
  let decksList = [];
  if (Array.isArray(allDecks)) {
    decksList = allDecks;
  } else if (typeof allDecks === 'object') {
    decksList = Object.values(allDecks).map(d => d.name || d);
  }
  
  if (decksList.length === 0) {
    deckList.innerHTML = '<div class="deck-loading">No decks yet</div>';
    return;
  }
  
  let html = '';
  
  // All cards option
  const totalCards = allCards.length;
  html += `
    <div class="deck-item ${currentDeck === null ? 'active' : ''}" data-deck="all">
      <div class="deck-info">
        <div class="deck-name">All Cards</div>
        <div class="deck-count">${totalCards} cards</div>
      </div>
    </div>
  `;
  
  // Individual decks
  decksList.forEach(deck => {
    const count = allCards.filter(c => c.deck === deck).length;
    html += `
      <div class="deck-item ${currentDeck === deck ? 'active' : ''}" data-deck="${deck}">
        <div class="deck-info">
          <div class="deck-name">${deck}</div>
          <div class="deck-count">${count} cards</div>
        </div>
        <div class="deck-actions">
          <button class="deck-action-btn rename" data-deck="${deck}" title="Rename">✏️</button>
          <button class="deck-action-btn delete" data-deck="${deck}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  });
  
  deckList.innerHTML = html;
  
  // Add event listeners
  document.querySelectorAll('.deck-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('deck-action-btn')) {
        const deck = item.getAttribute('data-deck');
        selectDeck(deck === 'all' ? null : deck);
      }
    });
  });
  
  document.querySelectorAll('.deck-action-btn.rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renameDeck(btn.getAttribute('data-deck'));
    });
  });
  
  document.querySelectorAll('.deck-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteDeck(btn.getAttribute('data-deck'));
    });
  });
}

// Select deck
function selectDeck(deck) {
  currentDeck = deck;
  renderDecks();
  renderCards();
}

// Render cards
function renderCards() {
  let cards = currentDeck === null 
    ? allCards 
    : allCards.filter(c => c.deck === currentDeck || c.deckId === currentDeck);
  
  // Search filter
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    cards = cards.filter(c => 
      c.front.toLowerCase().includes(searchTerm) || 
      c.back.toLowerCase().includes(searchTerm) ||
      (c.deck ? c.deck.toLowerCase().includes(searchTerm) : false)
    );
  }
  
  // Sort
  const sortBy = sortSelect.value;
  cards.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'front') {
      return a.front.localeCompare(b.front);
    }
    return 0;
  });
  
  // Update header - show deck name if available
  let headerText = 'All Cards';
  if (currentDeck !== null) {
    // Try to find deck name from allDecks
    if (Array.isArray(allDecks)) {
      if (allDecks.includes(currentDeck)) {
        headerText = currentDeck;
      }
    } else if (typeof allDecks === 'object') {
      const deckObj = allDecks[currentDeck];
      if (deckObj) {
        headerText = deckObj.name || currentDeck;
      }
    }
  }
  currentDeckName.textContent = headerText;
  cardCount.textContent = `${cards.length} cards`;
  
  // Render
  if (cards.length === 0) {
    cardsGrid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  cardsGrid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  let html = '';
  cards.forEach(card => {
    const date = new Date(card.createdAt).toLocaleDateString('vi-VN');
    const frontPreview = stripHtml(card.front).substring(0, 100);
    const backPreview = stripHtml(card.back).substring(0, 100);
    
    html += `
      <div class="card-item" data-id="${card.id}">
        <div class="card-item-header">
          <span class="card-deck-badge">${card.deck}</span>
          <div class="card-item-actions">
            <button class="card-action-btn preview" data-id="${card.id}" title="Preview">👁️</button>
            <button class="card-action-btn edit" data-id="${card.id}" title="Edit">✏️</button>
            <button class="card-action-btn delete" data-id="${card.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="card-content">
          <div class="card-side">
            <div class="card-side-label">FRONT</div>
            <div class="card-side-content">
              ${frontPreview}${frontPreview.length >= 100 ? '...' : ''}
              ${frontPreview.length >= 80 ? '<div class="card-fade"></div>' : ''}
            </div>
          </div>
          <div class="card-side">
            <div class="card-side-label">BACK</div>
            <div class="card-side-content">
              ${backPreview}${backPreview.length >= 100 ? '...' : ''}
              ${backPreview.length >= 80 ? '<div class="card-fade"></div>' : ''}
            </div>
          </div>
        </div>
        <div class="card-footer">
          Created: ${date}
        </div>
      </div>
    `;
  });
  
  cardsGrid.innerHTML = html;
  
  // Add event listeners
  document.querySelectorAll('.card-action-btn.preview').forEach(btn => {
    btn.addEventListener('click', () => previewCard(parseInt(btn.getAttribute('data-id'))));
  });
  
  document.querySelectorAll('.card-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => editCard(parseInt(btn.getAttribute('data-id'))));
  });
  
  document.querySelectorAll('.card-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => deleteCard(parseInt(btn.getAttribute('data-id'))));
  });
}

// Strip HTML tags
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Create deck
function createDeck() {
  // Use IntegratedManager deck modal if available
  if (window.integratedManager && typeof window.integratedManager.showDeckModal === 'function') {
    window.integratedManager.showDeckModal();
  } else {
    // Fallback to legacy behavior
    const name = prompt('Enter deck name:');
    if (name && name.trim()) {
      if (allDecks.includes(name.trim())) {
        alert('Deck already exists!');
        return;
      }
      
      allDecks.push(name.trim());
      chrome.storage.local.set({ decks: allDecks }, () => {
        renderDecks();
      });
    }
  }
}

// Rename deck
function renameDeck(deckName) {
  // Find the deck ID from storage and use IntegratedManager modal for editing
  chrome.storage.local.get(['decks'], (result) => {
    const decks = result.decks || {};
    
    // Find deck by name in the new object format
    let deckId = null;
    for (const id in decks) {
      if (decks[id].name === deckName) {
        deckId = id;
        break;
      }
    }
    
    if (deckId && window.integratedManager && typeof window.integratedManager.showDeckModal === 'function') {
      // Use IntegratedManager modal for editing
      window.integratedManager.showDeckModal(deckId);
    } else {
      // Fallback to legacy behavior
      const newName = prompt('Enter new deck name:', deckName);
      if (newName && newName.trim() && newName.trim() !== deckName) {
        if (allDecks.includes(newName.trim())) {
          alert('Deck name already exists!');
          return;
        }
        
        // Update deck name in decks array
        const index = allDecks.indexOf(deckName);
        allDecks[index] = newName.trim();
        
        // Update all cards with this deck
        allCards.forEach(card => {
          if (card.deck === deckName) {
            card.deck = newName.trim();
          }
        });
        
        // Update current deck if it was selected
        if (currentDeck === deckName) {
          currentDeck = newName.trim();
        }
        
        chrome.storage.local.set({ decks: allDecks, cards: allCards }, () => {
          renderDecks();
          renderCards();
        });
      }
    }
  });
}

// Delete deck
function deleteDeck(deckName) {
  // Find the deck ID from storage and use IntegratedManager delete method
  chrome.storage.local.get(['decks'], (result) => {
    const decks = result.decks || {};
    
    // Find deck by name in the new object format
    let deckId = null;
    for (const id in decks) {
      if (decks[id].name === deckName) {
        deckId = id;
        break;
      }
    }
    
    if (deckId && window.integratedManager && typeof window.integratedManager.deleteDeck === 'function') {
      // Use IntegratedManager delete method
      if (confirm(`Delete deck "${deckName}"? This will not delete the cards.`)) {
        window.integratedManager.deleteDeck(deckId);
      }
    } else {
      // Fallback to legacy behavior
      const cardsInDeck = allCards.filter(c => c.deck === deckName).length;
      const message = cardsInDeck > 0 
        ? `Delete deck "${deckName}" and all ${cardsInDeck} cards in it?`
        : `Delete deck "${deckName}"?`;
      
      if (confirm(message)) {
        // Remove deck
        allDecks = allDecks.filter(d => d !== deckName);
        
        // Remove cards in this deck
        allCards = allCards.filter(c => c.deck !== deckName);
        
        // Reset current deck if it was deleted
        if (currentDeck === deckName) {
          currentDeck = null;
        }
        
        chrome.storage.local.set({ decks: allDecks, cards: allCards }, () => {
          renderDecks();
          renderCards();
        });
      }
    }
  });
}

// Preview card
function previewCard(id) {
  const card = allCards.find(c => c.id === id);
  if (!card) return;
  
  previewFrontContent.innerHTML = card.front;
  previewBackContent.innerHTML = card.back;
  previewModal.classList.add('active');
}

// Close preview modal
function closePreviewModal() {
  previewModal.classList.remove('active');
}

// Edit card
function editCard(id) {
  const card = allCards.find(c => c.id === id);
  if (!card) return;

  // Open the sidebar editor instead of sending to background
  openEditSidebar(card);
}

// Open edit sidebar
function openEditSidebar(card) {
  currentCard = card;
  
  // Create overlay
  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }
  
  // Get sidebar elements
  const sidebar = document.getElementById('editSidebar');
  const deckSelect = document.getElementById('sidebarDeckSelect');
  const frontEditor = document.getElementById('sidebarFrontEditor');
  const backEditor = document.getElementById('sidebarBackEditor');
  
  // Populate deck select - handle both array and object formats
  deckSelect.innerHTML = '';
  let decksList = [];
  if (Array.isArray(allDecks)) {
    decksList = allDecks;
  } else if (typeof allDecks === 'object') {
    decksList = Object.values(allDecks).map(d => d.name || d);
  }
  
  decksList.forEach(deck => {
    const option = document.createElement('option');
    option.value = deck;
    option.textContent = deck;
    if (card && deck === card.deck) {
      option.selected = true;
    }
    deckSelect.appendChild(option);
  });
  
  // Populate editors
  if (card) {
    frontEditor.innerHTML = card.front || '';
    backEditor.innerHTML = card.back || '';
  } else {
    frontEditor.innerHTML = '';
    backEditor.innerHTML = '';
  }
  
  // Show sidebar
  overlay.classList.add('active');
  sidebar.classList.add('active');
  
  // Close on overlay click
  overlay.onclick = () => closeEditSidebar();
}

// Close edit sidebar
function closeEditSidebar() {
  const sidebar = document.getElementById('editSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  
  currentCard = null;
}

// Save card from sidebar
async function saveSidebarCard() {
  if (!currentCard) return;
  
  const deckSelect = document.getElementById('sidebarDeckSelect');
  const frontEditor = document.getElementById('sidebarFrontEditor');
  const backEditor = document.getElementById('sidebarBackEditor');
  
  let front = frontEditor.innerHTML.trim();
  let back = backEditor.innerHTML.trim();
  
  if (!front || !back) {
    alert('Please fill in both front and back');
    return;
  }
  
  // Show processing notification
  showNotification('Processing media files...', 'info');
  
  try {
    // Process media if MediaHandler is available
    if (typeof MediaHandler !== 'undefined' && MediaHandler.processHTMLContent) {
      front = await MediaHandler.processHTMLContent(front);
      back = await MediaHandler.processHTMLContent(back);
    }
    
    // Update card
    currentCard.deck = deckSelect.value;
    currentCard.front = front;
    currentCard.back = back;
    currentCard.updatedAt = new Date().toISOString();
    
    chrome.storage.local.set({ cards: allCards }, () => {
      closeEditSidebar();
      renderCards();
      renderDecks();
      showNotification('Card saved successfully!', 'success');
    });
  } catch (error) {
    console.error('Error saving card:', error);
    
    // Fallback: save without media processing
    currentCard.deck = deckSelect.value;
    currentCard.front = front;
    currentCard.back = back;
    currentCard.updatedAt = new Date().toISOString();
    
    chrome.storage.local.set({ cards: allCards }, () => {
      closeEditSidebar();
      renderCards();
      renderDecks();
      showNotification('Card saved (media not processed)', 'warning');
    });
  }
}

// Show notification helper
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideInNotif 0.3s ease-out;
  `;
  notification.textContent = message;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInNotif {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutNotif {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  if (!document.querySelector('style[data-notif-style]')) {
    style.setAttribute('data-notif-style', 'true');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutNotif 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Close edit modal
function closeEditModal() {
  editModal.classList.remove('active');
  currentCard = null;
}

// Save card
function saveCard() {
  if (!currentCard) return;
  
  const deck = modalDeckSelect.value;
  const front = modalFrontEditor.innerHTML.trim();
  const back = modalBackEditor.innerHTML.trim();
  
  if (!front || !back) {
    alert('Please fill in both front and back');
    return;
  }
  
  // Update card
  currentCard.deck = deck;
  currentCard.front = front;
  currentCard.back = back;
  
  chrome.storage.local.set({ cards: allCards }, () => {
    closeEditModal();
    renderCards();
    renderDecks();
  });
}

// Delete card
function deleteCard(id) {
  if (confirm('Delete this card?')) {
    allCards = allCards.filter(c => c.id !== id);
    chrome.storage.local.set({ cards: allCards }, () => {
      renderCards();
      renderDecks();
    });
  }
}

// Delete all cards
function deleteAllCards() {
  const message = currentDeck === null
    ? `Delete all ${allCards.length} cards?`
    : `Delete all ${allCards.filter(c => c.deck === currentDeck).length} cards in "${currentDeck}"?`;
  
  if (confirm(message)) {
    if (currentDeck === null) {
      allCards = [];
    } else {
      allCards = allCards.filter(c => c.deck !== currentDeck);
    }
    
    chrome.storage.local.set({ cards: allCards }, () => {
      renderCards();
      renderDecks();
    });
  }
}

// Export data
function exportData() {
  const data = {
    cards: allCards,
    decks: allDecks,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import data
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (!data.cards || !data.decks) {
        alert('Invalid file format!');
        return;
      }
      
      if (confirm(`Import ${data.cards.length} cards and ${data.decks.length} decks? This will merge with existing data.`)) {
        // Merge decks
        data.decks.forEach(deck => {
          if (!allDecks.includes(deck)) {
            allDecks.push(deck);
          }
        });
        
        // Merge cards (avoid duplicates by ID)
        data.cards.forEach(card => {
          if (!allCards.find(c => c.id === card.id)) {
            allCards.push(card);
          }
        });
        
        chrome.storage.local.set({ cards: allCards, decks: allDecks }, () => {
          loadData();
          alert('Data imported successfully!');
        });
      }
    } catch (error) {
      alert('Error reading file!');
    }
  };
  
  reader.readAsText(file);
  importFileInput.value = '';
}

// ===== APKG Export Functionality =====
const apkgModal = document.getElementById('apkgModal');
const apkgModalClose = document.getElementById('apkgModalClose');
const apkgModalCancel = document.getElementById('apkgModalCancel');
const apkgExportBtn = document.getElementById('apkgExportBtn');
const exportApkgBtn = document.getElementById('exportApkgBtn');
const apkgParentDeck = document.getElementById('apkgParentDeck');
const apkgDeckList = document.getElementById('apkgDeckList');
const apkgProgress = document.getElementById('apkgProgress');
const apkgProgressFill = document.getElementById('apkgProgressFill');
const apkgProgressText = document.getElementById('apkgProgressText');

// Open APKG export modal
exportApkgBtn.addEventListener('click', () => {
  openApkgModal();
});

function openApkgModal() {
  if (allCards.length === 0) {
    alert('No cards to export!');
    return;
  }

  // Populate deck list with checkboxes
  const deckCounts = {};
  allDecks.forEach(deck => {
    deckCounts[deck] = allCards.filter(c => c.deck === deck).length;
  });

  apkgDeckList.innerHTML = allDecks.map(deck => `
    <div class="deck-checkbox-item">
      <input type="checkbox" id="apkg-deck-${deck}" value="${deck}" ${deckCounts[deck] > 0 ? 'checked' : ''}>
      <label for="apkg-deck-${deck}">
        <span>${deck}</span>
        <span class="deck-card-count">${deckCounts[deck]} cards</span>
      </label>
    </div>
  `).join('');

  apkgModal.style.display = 'flex';
  apkgModal.classList.add('active');
}

function closeApkgModal() {
  apkgModal.style.display = 'none';
  apkgModal.classList.remove('active');
  apkgProgress.style.display = 'none';
  apkgProgressFill.style.width = '0%';
  apkgProgressText.textContent = 'Exporting... 0%';
}

apkgModalClose.addEventListener('click', closeApkgModal);
apkgModalCancel.addEventListener('click', closeApkgModal);

// Export APKG
apkgExportBtn.addEventListener('click', async () => {
  const parentDeckName = apkgParentDeck.value.trim() || 'AddFlashcard Export';
  
  // Get selected decks
  const selectedDecks = [];
  apkgDeckList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    selectedDecks.push(cb.value);
  });

  if (selectedDecks.length === 0) {
    alert('Please select at least one deck to export!');
    return;
  }

  try {
    // Show progress
    apkgProgress.style.display = 'block';
    apkgExportBtn.disabled = true;
    apkgExportBtn.textContent = 'Exporting...';

    // Load libraries (SQL.js and JSZip) - required for APKG export
    await window.apkgExporter.loadLibraries();

    // Prepare decks data
    const decksData = selectedDecks.map(deckName => ({
      name: deckName,
      cards: allCards.filter(c => c.deck === deckName)
    }));

    // Export using apkg-exporter
    const blob = await window.apkgExporter.exportMultipleDecks(
      decksData,
      parentDeckName,
      (progress) => {
        const percent = Math.round(progress * 100);
        apkgProgressFill.style.width = percent + '%';
        apkgProgressText.textContent = `Exporting... ${percent}%`;
      }
    );

    // Download file
    const totalCards = decksData.reduce((sum, d) => sum + d.cards.length, 0);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `AddFlashcard_${parentDeckName.replace(/[^\w\-]/g, '_')}_${timestamp}_${totalCards}cards.apkg`;
    
    window.apkgExporter.downloadBlob(blob, filename);

    // Success
    apkgProgressText.textContent = `Success! Exported ${totalCards} cards`;
    setTimeout(() => {
      closeApkgModal();
      apkgExportBtn.disabled = false;
      apkgExportBtn.textContent = 'Export APKG';
    }, 1500);

  } catch (error) {
    console.error('APKG export error:', error);
    alert('Error exporting APKG: ' + error.message);
    apkgExportBtn.disabled = false;
    apkgExportBtn.textContent = 'Export APKG';
    apkgProgress.style.display = 'none';
  }
});

// ===== AnkiConnect Sync Functionality =====
const ankiModal = document.getElementById('ankiModal');
const ankiModalClose = document.getElementById('ankiModalClose');
const ankiModalCancel = document.getElementById('ankiModalCancel');
const syncAnkiBtn = document.getElementById('syncAnkiBtn');
const ankiSyncBtn = document.getElementById('ankiSyncBtn');
const ankiStatus = document.getElementById('ankiStatus');
const ankiSyncForm = document.getElementById('ankiSyncForm');
const ankiSourceDeck = document.getElementById('ankiSourceDeck');
const ankiTargetDeck = document.getElementById('ankiTargetDeck');
const ankiFieldFront = document.getElementById('ankiFieldFront');
const ankiFieldBack = document.getElementById('ankiFieldBack');
const ankiProgress = document.getElementById('ankiProgress');
const ankiProgressFill = document.getElementById('ankiProgressFill');
const ankiProgressText = document.getElementById('ankiProgressText');
const ankiResult = document.getElementById('ankiResult');

// Auto-fill target deck when source deck is selected
ankiSourceDeck.addEventListener('change', () => {
  if (ankiSourceDeck.value) {
    ankiTargetDeck.value = ankiSourceDeck.value;
  }
});

// Open AnkiConnect modal
syncAnkiBtn.addEventListener('click', async () => {
  openAnkiModal();
});

async function openAnkiModal() {
  if (allCards.length === 0) {
    alert('No cards to sync!');
    return;
  }

  ankiModal.style.display = 'flex';
  ankiModal.classList.add('active');
  
  // Check AnkiConnect connection
  ankiStatus.innerHTML = `
    <div class="status-indicator">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      <span>Checking connection to Anki...</span>
    </div>
  `;

  try {
    const connected = await window.ankiConnectClient.testConnection();
    
    if (connected) {
      ankiStatus.innerHTML = `
        <div class="status-indicator success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
          <span>Connected to Anki successfully!</span>
        </div>
      `;

      // Populate source deck dropdown
      ankiSourceDeck.innerHTML = '<option value="">-- Select source deck --</option>' +
        allDecks.map(deck => {
          const count = allCards.filter(c => c.deck === deck).length;
          return `<option value="${deck}">${deck} (${count} cards)</option>`;
        }).join('');

      ankiSyncForm.style.display = 'block';
      ankiSyncBtn.style.display = 'inline-block';

    } else {
      throw new Error('Cannot connect to AnkiConnect');
    }

  } catch (error) {
    ankiStatus.innerHTML = `
      <div class="status-indicator error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span>Cannot connect to Anki. Please ensure:<br/>
        1. Anki is running<br/>
        2. AnkiConnect add-on is installed<br/>
        3. AnkiConnect is configured to allow connections</span>
      </div>
    `;
    ankiSyncForm.style.display = 'none';
    ankiSyncBtn.style.display = 'none';
  }
}

function closeAnkiModal() {
  ankiModal.style.display = 'none';
  ankiModal.classList.remove('active');
  ankiSyncForm.style.display = 'none';
  ankiProgress.style.display = 'none';
  ankiResult.style.display = 'none';
  ankiProgressFill.style.width = '0%';
  ankiProgressText.textContent = 'Syncing... 0%';
}

ankiModalClose.addEventListener('click', closeAnkiModal);
ankiModalCancel.addEventListener('click', closeAnkiModal);

// Sync to Anki
ankiSyncBtn.addEventListener('click', async () => {
  const sourceDeck = ankiSourceDeck.value;
  const targetDeck = ankiTargetDeck.value.trim();

  if (!sourceDeck) {
    alert('Please select a source deck!');
    return;
  }

  if (!targetDeck) {
    alert('Please enter a target Anki deck name!');
    return;
  }

  const fieldMapping = {
    'Front': ankiFieldFront.value,
    'Back': ankiFieldBack.value
  };

  try {
    ankiProgress.style.display = 'block';
    ankiResult.style.display = 'none';
    ankiSyncBtn.disabled = true;
    ankiSyncBtn.textContent = 'Syncing...';

    const cards = allCards.filter(c => c.deck === sourceDeck);
    const shouldUpdateDuplicates = document.getElementById('ankiUpdateDuplicates').checked;

    const result = await window.ankiConnectClient.exportCards(
      sourceDeck,
      targetDeck,
      cards,
      fieldMapping,
      {
        updateDuplicates: shouldUpdateDuplicates,
        onProgress: (progress) => {
          const percent = Math.round(progress * 100);
          ankiProgressFill.style.width = percent + '%';
          ankiProgressText.textContent = `Syncing... ${percent}%`;
        }
      }
    );

    ankiProgress.style.display = 'none';
    ankiResult.style.display = 'block';
    ankiResult.className = 'sync-result success';
    ankiResult.innerHTML = `
      <strong>Sync Complete!</strong><br/>
      Total cards: ${result.total}<br/>
      Successfully added: ${result.success}<br/>
      Successfully updated: ${result.updated || 0}<br/>
      Skipped/Failed: ${result.failed}
    `;

    ankiSyncBtn.disabled = false;
    ankiSyncBtn.textContent = 'Sync to Anki';

  } catch (error) {
    console.error('AnkiConnect sync error:', error);
    ankiProgress.style.display = 'none';
    ankiResult.style.display = 'block';
    ankiResult.className = 'sync-result error';
    ankiResult.innerHTML = `
      <strong>Sync Failed!</strong><br/>
      Error: ${error.message}
    `;
    ankiSyncBtn.disabled = false;
    ankiSyncBtn.textContent = 'Sync to Anki';
  }
});

// Tags Management
let currentCardTags = [];
const modalTagsInput = document.getElementById('modalTagsInput');
const modalTagsContainer = document.getElementById('modalTagsContainer');
const sidebarTagsInput = document.getElementById('sidebarTagsInput');
const sidebarTagsContainer = document.getElementById('sidebarTagsContainer');

function setupTagsInput(input, container, tagsArray) {
  if (!input || !container) return;
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.value.trim().replace(/,/g, '');
      if (tag && !tagsArray.includes(tag)) {
        tagsArray.push(tag);
        renderTagsInContainer(container, tagsArray);
      }
      input.value = '';
    }
  });
  
  input.addEventListener('blur', () => {
    const tag = input.value.trim().replace(/,/g, '');
    if (tag && !tagsArray.includes(tag)) {
      tagsArray.push(tag);
      renderTagsInContainer(container, tagsArray);
      input.value = '';
    }
  });
}

function renderTagsInContainer(container, tagsArray) {
  if (!container) return;
  container.innerHTML = '';
  tagsArray.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.innerHTML = `${tag} <span class="tag-remove" data-tag="${tag}">×</span>`;
    const removeBtn = tagEl.querySelector('.tag-remove');
    removeBtn.addEventListener('click', () => {
      const index = tagsArray.indexOf(tag);
      if (index > -1) {
        tagsArray.splice(index, 1);
        renderTagsInContainer(container, tagsArray);
      }
    });
    container.appendChild(tagEl);
  });
}

// Initialize tags for edit modal
if (modalTagsInput && modalTagsContainer) {
  setupTagsInput(modalTagsInput, modalTagsContainer, currentCardTags);
}

// Initialize tags for edit sidebar
if (sidebarTagsInput && sidebarTagsContainer) {
  const sidebarTags = [];
  setupTagsInput(sidebarTagsInput, sidebarTagsContainer, sidebarTags);
}

// Update tag filter
function updateTagFilter() {
  if (!tagFilter) return;
  
  const allTags = new Set();
  allCards.forEach(card => {
    if (card.tags && Array.isArray(card.tags)) {
      card.tags.forEach(tag => allTags.add(tag));
    }
  });
  
  tagFilter.innerHTML = '<option value="">All Tags</option>';
  Array.from(allTags).sort().forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

// Study Mode
if (studyModeBtn) {
  studyModeBtn.addEventListener('click', () => {
    let url = 'study.html';
    
    // Add deck filter if selected
    if (currentDeck && currentDeck !== 'all') {
      url += `?deck=${encodeURIComponent(currentDeck)}`;
    }
    
    // Add tag filter if selected
    if (tagFilter && tagFilter.value) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}tags=${encodeURIComponent(tagFilter.value)}`;
    }
    
    window.open(url, '_blank', 'width=1200,height=800');
  });
}

// Update filter event
if (tagFilter) {
  tagFilter.addEventListener('change', renderCards);
}

// Override renderCards to include tag filtering
const originalRenderCards = renderCards;
function renderCards() {
  let filtered = currentDeck === 'all' || !currentDeck
    ? allCards
    : allCards.filter(card => card.deck === currentDeck);
  
  // Apply tag filter
  if (tagFilter && tagFilter.value) {
    const selectedTag = tagFilter.value;
    filtered = filtered.filter(card => 
      card.tags && Array.isArray(card.tags) && card.tags.includes(selectedTag)
    );
  }
  
  // Apply search
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(card => {
      const frontText = stripHTML(card.front).toLowerCase();
      const backText = stripHTML(card.back).toLowerCase();
      const tagText = card.tags ? card.tags.join(' ').toLowerCase() : '';
      return frontText.includes(searchTerm) || 
             backText.includes(searchTerm) || 
             tagText.includes(searchTerm);
    });
  }
  
  // Sort
  const sortBy = sortSelect.value;
  if (sortBy === 'newest') {
    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return aTime - bTime;
    });
  } else if (sortBy === 'front') {
    filtered.sort((a, b) => {
      const aText = stripHTML(a.front);
      const bText = stripHTML(b.front);
      return aText.localeCompare(bText);
    });
  }
  
  // Update count
  cardCount.textContent = `${filtered.length} card${filtered.length !== 1 ? 's' : ''}`;
  
  // Render cards
  if (filtered.length === 0) {
    cardsGrid.style.display = 'none';
    emptyState.style.display = 'flex';
  } else {
    cardsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    cardsGrid.innerHTML = '';
    filtered.forEach(card => {
      const cardEl = createCardElement(card);
      cardsGrid.appendChild(cardEl);
    });
  }
  
  // Update tag filter options
  updateTagFilter();
}

// Helper to strip HTML
function stripHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Update createCardElement to show tags
const originalCreateCardElement = createCardElement;
function createCardElement(card) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';
  
  const tagsHTML = card.tags && card.tags.length > 0
    ? `<div class="card-tags">${card.tags.map(tag => 
        `<span class="card-tag-small">${tag}</span>`
      ).join('')}</div>`
    : '';
  
  cardEl.innerHTML = `
    <div class="card-front">
      <div class="card-label">FRONT</div>
      <div class="card-text">${card.front}</div>
      ${tagsHTML}
    </div>
    <div class="card-back">
      <div class="card-label">BACK</div>
      <div class="card-text">${card.back}</div>
    </div>
    <div class="card-actions">
      <button class="card-btn preview-btn" data-id="${card.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
      <button class="card-btn edit-btn" data-id="${card.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="card-btn delete-btn" data-id="${card.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Attach event listeners
  const previewBtn = cardEl.querySelector('.preview-btn');
  const editBtn = cardEl.querySelector('.edit-btn');
  const deleteBtn = cardEl.querySelector('.delete-btn');
  
  // Eye button: open this specific card in Study Mode
  previewBtn.addEventListener('click', () => openCardInStudy(card.id));
  // Pencil button: open right sidebar editor
  editBtn.addEventListener('click', () => openEditSidebar(card));
  deleteBtn.addEventListener('click', () => deleteCard(card.id));
  
  return cardEl;
}

// Open a single card in Study Mode (new tab)
function openCardInStudy(cardId) {
  try {
    const url = chrome.runtime.getURL(`study.html?cardId=${encodeURIComponent(cardId)}`);
    window.open(url, '_blank');
  } catch (e) {
    console.error('Open study mode failed:', e);
  }
}

// Backward-compatible alias (older code referenced editCardInSidebar)
function editCardInSidebar(card) {
  openEditSidebar(card);
}

// Rich Text Keyboard Shortcuts for all editors
function setupRichTextShortcuts() {
  const editors = [
    modalFrontEditor,
    modalBackEditor,
    document.getElementById('sidebarFrontEditor'),
    document.getElementById('sidebarBackEditor')
  ].filter(el => el !== null);
  
  editors.forEach(editor => {
    editor.addEventListener('keydown', (e) => {
      // Ctrl+B: Bold
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
        return;
      }
      
      // Ctrl+I: Italic
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
        return;
      }
      
      // Ctrl+U: Underline
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
        return;
      }
      
      // Ctrl+K: Insert Link
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        insertLinkInEditor(editor);
        return;
      }
      
      // Ctrl+Shift+S: Strikethrough
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        document.execCommand('strikeThrough', false, null);
        return;
      }
      
      // Ctrl+]: Increase Font Size
      if (e.ctrlKey && e.key === ']') {
        e.preventDefault();
        changeFontSize(editor, 'larger');
        return;
      }
      
      // Ctrl+[: Decrease Font Size
      if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        changeFontSize(editor, 'smaller');
        return;
      }
      
      // Ctrl+Shift+L: Bullet List
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        document.execCommand('insertUnorderedList', false, null);
        return;
      }
      
      // Ctrl+Shift+N: Numbered List
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        document.execCommand('insertOrderedList', false, null);
        return;
      }
      
      // Ctrl+E: Center Align
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        document.execCommand('justifyCenter', false, null);
        return;
      }
      
      // Ctrl+L: Left Align (only when not Shift is pressed)
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        document.execCommand('justifyLeft', false, null);
        return;
      }
      
      // Ctrl+R: Right Align
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        document.execCommand('justifyRight', false, null);
        return;
      }
      
      // Ctrl+Space: Clear Formatting
      if (e.ctrlKey && e.key === ' ') {
        e.preventDefault();
        document.execCommand('removeFormat', false, null);
        return;
      }
      
      // Ctrl+Shift+C: Code Block
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        formatAsCode();
        return;
      }
    });
  });
}

// Insert Link Helper
function insertLinkInEditor(editor) {
  const selection = window.getSelection();
  const selectedText = selection.toString();
  
  const url = prompt('Enter URL:', 'https://');
  if (!url) return;
  
  if (selectedText) {
    document.execCommand('createLink', false, url);
  } else {
    const linkText = prompt('Enter link text:', url);
    if (linkText) {
      const link = `<a href="${url}" target="_blank">${linkText}</a>`;
      document.execCommand('insertHTML', false, link);
    }
  }
}

// Font Size Helper
function changeFontSize(editor, size) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const selectedContent = range.extractContents();
  
  const span = document.createElement('span');
  span.style.fontSize = size;
  span.appendChild(selectedContent);
  
  range.insertNode(span);
  
  // Restore selection
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  selection.addRange(newRange);
}

// Format as Code
function formatAsCode() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const selectedContent = range.extractContents();
  
  const code = document.createElement('code');
  code.style.backgroundColor = '#0f172a';
  code.style.padding = '2px 6px';
  code.style.borderRadius = '3px';
  code.style.fontFamily = 'Courier New, monospace';
  code.style.fontSize = '13px';
  code.style.color = '#fbbf24';
  code.appendChild(selectedContent);
  
  range.insertNode(code);
  
  // Restore selection
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(code);
  selection.addRange(newRange);
}

// ==================== THEME MANAGEMENT ====================
function initTheme() {
  // Load saved theme
  chrome.storage.local.get(['afc_theme'], (res) => {
    const theme = res.afc_theme || 'light';
    applyTheme(theme);
  });
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeQuery.addEventListener('change', () => {
      chrome.storage.local.get(['afc_theme'], (res) => {
        if (res.afc_theme === 'system') {
          applyTheme('system');
        }
      });
    });
  }
  
  // Listen for theme changes from other pages
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.afc_theme) {
      applyTheme(changes.afc_theme.newValue);
    }
  });
}

function applyTheme(theme) {
  let effectiveTheme = theme;
  
  // Handle 'system' theme
  if (theme === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = prefersDark ? 'dark' : 'light';
  } else {
    effectiveTheme = (theme === 'light') ? 'light' : 'dark';
  }
  
  // Apply theme classes
  document.documentElement.classList.toggle('theme-light', effectiveTheme === 'light');
  document.documentElement.classList.toggle('theme-dark', effectiveTheme === 'dark');
  document.body.classList.toggle('theme-light', effectiveTheme === 'light');
  document.body.classList.toggle('theme-dark', effectiveTheme === 'dark');
}

// Initialize theme on load
initTheme();

// Export functions and state for external use (e.g., integrated-manager.js)
window.manageApp = {
  currentDeck: () => currentDeck,
  setCurrentDeck: (deck) => { currentDeck = deck; },
  renderCards,
  renderDecks,
  selectDeck,
  loadData,
  allCards: () => allCards,
  allDecks: () => allDecks,
  checkAndOpenDeckModal: () => {
    // Called by integrated-manager after initialization
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'createDeck') {
      const homeTab = document.querySelector('[data-tab="home"]');
      if (homeTab) {
        homeTab.click();
        setTimeout(() => {
          if (window.integratedManager && typeof window.integratedManager.showDeckModal === 'function') {
            console.log('Opening deck modal from integratedManager');
            window.integratedManager.showDeckModal();
            window.history.replaceState({}, document.title, chrome.runtime.getURL('manage.html'));
          }
        }, 50);
      }
    }
  }
};
