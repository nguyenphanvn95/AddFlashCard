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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
});

// Load all data
function loadData() {
  chrome.storage.local.get(['cards', 'decks'], (result) => {
    allCards = result.cards || [];
    allDecks = result.decks || ['Default'];
    
    renderDecks();
    renderCards();
  });
}

// Setup event listeners
function setupEventListeners() {
  addDeckBtn.addEventListener('click', createDeck);
  deleteAllBtn.addEventListener('click', deleteAllCards);
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importData);
  searchInput.addEventListener('input', renderCards);
  sortSelect.addEventListener('change', renderCards);
  
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
}

// Render decks
function renderDecks() {
  if (allDecks.length === 0) {
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
  allDecks.forEach(deck => {
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
    : allCards.filter(c => c.deck === currentDeck);
  
  // Search filter
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    cards = cards.filter(c => 
      c.front.toLowerCase().includes(searchTerm) || 
      c.back.toLowerCase().includes(searchTerm) ||
      c.deck.toLowerCase().includes(searchTerm)
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
  
  // Update header
  currentDeckName.textContent = currentDeck === null ? 'All Cards' : currentDeck;
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

// Rename deck
function renameDeck(oldName) {
  const newName = prompt('Enter new deck name:', oldName);
  if (newName && newName.trim() && newName.trim() !== oldName) {
    if (allDecks.includes(newName.trim())) {
      alert('Deck name already exists!');
      return;
    }
    
    // Update deck name in decks array
    const index = allDecks.indexOf(oldName);
    allDecks[index] = newName.trim();
    
    // Update all cards with this deck
    allCards.forEach(card => {
      if (card.deck === oldName) {
        card.deck = newName.trim();
      }
    });
    
    // Update current deck if it was selected
    if (currentDeck === oldName) {
      currentDeck = newName.trim();
    }
    
    chrome.storage.local.set({ decks: allDecks, cards: allCards }, () => {
      renderDecks();
      renderCards();
    });
  }
}

// Delete deck
function deleteDeck(name) {
  const cardsInDeck = allCards.filter(c => c.deck === name).length;
  const message = cardsInDeck > 0 
    ? `Delete deck "${name}" and all ${cardsInDeck} cards in it?`
    : `Delete deck "${name}"?`;
  
  if (confirm(message)) {
    // Remove deck
    allDecks = allDecks.filter(d => d !== name);
    
    // Remove cards in this deck
    allCards = allCards.filter(c => c.deck !== name);
    
    // Reset current deck if it was deleted
    if (currentDeck === name) {
      currentDeck = null;
    }
    
    chrome.storage.local.set({ decks: allDecks, cards: allCards }, () => {
      renderDecks();
      renderCards();
    });
  }
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

  // Send card data to sidebar window for editing.
  // This allows using the same rich editors (and browser input features)
  // as the normal "Add card" workflow.
  chrome.runtime.sendMessage({ action: 'openEditCard', card });
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
