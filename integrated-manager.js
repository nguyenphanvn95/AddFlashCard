// Integrated Home Manager Logic
class IntegratedManager {
  constructor() {
    this.currentView = 'home';
    this.currentDeckId = null;
    this.selectedEmoji = '😊';
    this.selectedColor = '#10b981';
    this.editingDeckId = null;
  }

  init() {
    console.log('IntegratedManager init() called');
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const deckParam = params.get('deck');
    
    if (deckParam) {
      console.log('Deck param found:', deckParam);
      this.currentDeckId = deckParam;
      this.switchToCardsView();
    } else {
      console.log('No deck param, switching to home view');
      this.switchToHomeView();
    }

    this.bindEvents();
    console.log('About to load decks, currentView:', this.currentView);
    this.loadDecks();
  }

  bindEvents() {
    // Tab switching
    document.getElementById('homeTab')?.addEventListener('click', () => {
      this.switchToHomeView();
    });

    document.getElementById('cardsTab')?.addEventListener('click', () => {
      this.switchToCardsView();
    });

    // Deck modal
    document.getElementById('deckModalClose')?.addEventListener('click', () => {
      this.hideDeckModal();
    });

    document.getElementById('deckModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'deckModalBackdrop') {
        this.hideDeckModal();
      }
    });

    // Emoji selection
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedEmoji = btn.getAttribute('data-emoji');
      });
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedColor = btn.getAttribute('data-color');
      });
    });

    // Save deck
    document.getElementById('deckModalSave')?.addEventListener('click', () => {
      this.saveDeck();
    });

    // Add deck button (in sidebar)
    document.getElementById('addDeckBtn')?.addEventListener('click', () => {
      this.showDeckModal();
    });
  }

  switchToHomeView() {
    this.currentView = 'home';
    this.currentDeckId = null;
    
    document.getElementById('homeTab')?.classList.add('active');
    document.getElementById('cardsTab')?.classList.remove('active');
    document.getElementById('homeView')?.classList.add('active');
    document.getElementById('cardsView')?.classList.remove('active');
    document.getElementById('headerSubtitle').textContent = 'Home';
    
    // Update URL
    history.pushState({}, '', 'manage.html');
    
    this.loadDecks();
  }

  switchToCardsView(deckId = null) {
    this.currentView = 'cards';
    if (deckId) {
      this.currentDeckId = deckId;
    }
    
    document.getElementById('homeTab')?.classList.remove('active');
    document.getElementById('cardsTab')?.classList.add('active');
    document.getElementById('homeView')?.classList.remove('active');
    document.getElementById('cardsView')?.classList.add('active');
    
    // Update URL and tab label
    if (this.currentDeckId) {
      history.pushState({}, '', `manage.html?deck=${this.currentDeckId}`);
      
      chrome.storage.local.get(['decks'], (result) => {
        const decks = result.decks || {};
        const deck = decks[this.currentDeckId];
        if (deck) {
          document.getElementById('cardsTabLabel').textContent = deck.name;
          document.getElementById('headerSubtitle').textContent = deck.name;
          
          // Set current deck using DECK NAME (not ID) for compatibility with popup/manage.js
          if (window.manageApp) {
            window.manageApp.setCurrentDeck(deck.name);
            // Use setTimeout to ensure state is set before rendering
            setTimeout(() => {
              window.manageApp.renderCards();
            }, 10);
          }
        }
      });
    } else {
      history.pushState({}, '', 'manage.html?view=cards');
      document.getElementById('cardsTabLabel').textContent = 'All Cards';
      document.getElementById('headerSubtitle').textContent = 'All Cards';
      
      // Set to all cards
      if (window.manageApp) {
        window.manageApp.setCurrentDeck(null);
        setTimeout(() => {
          window.manageApp.renderCards();
        }, 10);
      }
    }
  }

  async loadDecks() {
    // Store current view to avoid race condition
    const targetView = this.currentView;
    
    if (targetView !== 'home') {
      console.log('Not in home view, skipping deck load');
      return;
    }

    console.log('Loading decks from storage, targetView:', targetView);

    try {
      const result = await chrome.storage.local.get(['decks', 'cards']);
      let decks = result.decks || {};
      const cards = result.cards || [];

      // Handle both array format (old) and object format (new)
      if (Array.isArray(decks)) {
        console.log('Converting decks from array to object format:', decks);
        const decksObj = {};
        decks.forEach((deckName, index) => {
          decksObj['deck_' + index] = {
            name: deckName,
            emoji: '📚',
            color: '#10b981',
            created: Date.now(),
            pinned: false
          };
        });
        decks = decksObj;
        // Save converted format
        await chrome.storage.local.set({ decks });
      }

      console.log('Decks from storage:', decks);
      console.log('Cards from storage:', cards);

      const decksGrid = document.getElementById('decksGrid');
      if (!decksGrid) {
        console.error('Element #decksGrid not found!');
        return;
      }

      // Check if user already switched view
      if (this.currentView !== targetView) {
        console.log('View changed during async load, skipping render');
        return;
      }

      decksGrid.innerHTML = '';

      const deckArray = Object.entries(decks).map(([id, deck]) => {
        // Count cards by deckId field, falling back to deck name
        const deckCards = cards.filter(c => c.deckId === id || c.deck === deck.name);
        
        // Count new cards - cards without lastReviewed or with no study history
        const newCards = deckCards.filter(c => !c.lastReviewed && !c.lastReview).length;
        
        return {
          id,
          ...deck,
          deckCards, // Pass the actual cards array
          cardCount: deckCards.length,
          newCards: newCards,
          dueCards: this.getDueCards(deckCards)
        };
      });

      console.log('Processed deck array:', deckArray);

      // Sort: pinned first
      deckArray.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastModified || 0) - (a.lastModified || 0);
      });

      deckArray.forEach(deck => {
        const deckCard = this.createDeckCard(deck);
        decksGrid.appendChild(deckCard);
      });

      // Add new deck card
      const newDeckCard = document.createElement('div');
      newDeckCard.className = 'deck-card new-deck-card';
      newDeckCard.innerHTML = `
        <div style="text-align: center;">
          <div class="new-deck-icon">+</div>
          <div class="new-deck-text">New deck</div>
        </div>
      `;
      newDeckCard.addEventListener('click', () => this.showDeckModal());
      decksGrid.appendChild(newDeckCard);

      console.log('Decks loaded and rendered successfully. Total decks rendered:', deckArray.length + 1);
      
      // Also update manage.js state if available
      if (window.manageApp) {
        console.log('Updating manage.js state with decks');
        // This will trigger manage.js to reload data and update allDecks
        window.manageApp.renderDecks?.();
      }

    } catch (error) {
      console.error('Error loading decks:', error);
    }
  }

  createDeckCard(deck) {
    const card = document.createElement('div');
    card.className = 'deck-card';
    if (deck.pinned) card.classList.add('pinned');

    const color = deck.color || '#10b981';
    card.style.background = `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;

    let statusIcon = '📝';
    let statusText = 'Empty';
    if (deck.cardCount === 0) {
      statusIcon = '📝';
      statusText = 'Empty';
    } else if (deck.newCards > 0) {
      statusIcon = '📚';
      statusText = `${deck.newCards} new`;
    } else if (deck.dueCards > 0) {
      statusIcon = '⏰';
      statusText = `${deck.dueCards} due`;
    } else {
      statusIcon = '✓';
      statusText = 'Up to date';
    }

    let dueBadge = '';
    if (deck.dueCards > 0) {
      dueBadge = `<div class="deck-due-badge">${deck.dueCards} Due</div>`;
    }

    let loadBadge = '';
    if (deck.newCards > 0) {
      loadBadge = `<div class="deck-load-badge">Load</div>`;
    }

    let lastReviewed = 'Never studied';
    
    // Calculate last reviewed from cards in this deck
    const deckCards = deck.deckCards || [];
    if (deckCards && deckCards.length > 0) {
      const reviewedCards = deckCards.filter(c => c.lastReviewed);
      if (reviewedCards.length > 0) {
        // Get the most recent lastReviewed time
        const mostRecent = Math.max(...reviewedCards.map(c => c.lastReviewed || 0));
        const daysAgo = Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24));
        if (daysAgo === 0) lastReviewed = 'Studied today';
        else if (daysAgo === 1) lastReviewed = 'Last studied yesterday';
        else lastReviewed = `Last studied ${daysAgo} days ago`;
      }
    }

    card.innerHTML = `
      ${dueBadge}
      ${loadBadge}
      <div class="deck-header">
        <div class="deck-emoji">${deck.emoji || '📚'}</div>
        <div class="deck-info">
          <h3 class="deck-name">${this.escapeHtml(deck.name)}</h3>
          ${deck.description ? `<p class="deck-description">${this.escapeHtml(deck.description)}</p>` : ''}
        </div>
      </div>
      <div class="deck-footer">
        <div class="deck-stats">
          <div class="deck-card-count">${deck.cardCount} card${deck.cardCount !== 1 ? 's' : ''}</div>
          <div class="deck-last-reviewed">${lastReviewed}</div>
        </div>
        <div class="deck-status">
          <span>${statusIcon}</span>
          ${statusText}
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      this.currentDeckId = deck.id;
      this.switchToCardsView(deck.id);
    });

    return card;
  }

  showDeckModal(deckId = null) {
    const modal = document.getElementById('deckModalBackdrop');
    const title = document.getElementById('deckModalTitle');
    const saveBtn = document.getElementById('deckModalSave');
    const nameInput = document.getElementById('deckNameInput');
    const descInput = document.getElementById('deckDescInput');
    const pinnedCheckbox = document.getElementById('deckPinnedCheckbox');

    this.editingDeckId = deckId;

    if (deckId) {
      chrome.storage.local.get(['decks'], (result) => {
        const deck = result.decks?.[deckId];
        if (!deck) return;

        title.textContent = 'Edit deck';
        saveBtn.textContent = 'Save';
        nameInput.value = deck.name || '';
        descInput.value = deck.description || '';
        pinnedCheckbox.checked = deck.pinned || false;

        this.selectedEmoji = deck.emoji || '😊';
        this.selectedColor = deck.color || '#10b981';
        
        document.querySelectorAll('.emoji-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-emoji') === this.selectedEmoji);
        });
        document.querySelectorAll('.color-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-color') === this.selectedColor);
        });
      });
    } else {
      title.textContent = 'Create deck';
      saveBtn.textContent = 'Create';
      nameInput.value = '';
      descInput.value = '';
      pinnedCheckbox.checked = false;

      this.selectedEmoji = '😊';
      this.selectedColor = '#10b981';
      
      document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-emoji') === this.selectedEmoji);
      });
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === this.selectedColor);
      });
    }

    modal.classList.add('show');
    nameInput.focus();
  }

  hideDeckModal() {
    document.getElementById('deckModalBackdrop')?.classList.remove('show');
    this.editingDeckId = null;
  }

  async saveDeck() {
    const nameInput = document.getElementById('deckNameInput');
    const descInput = document.getElementById('deckDescInput');
    const pinnedCheckbox = document.getElementById('deckPinnedCheckbox');

    const name = nameInput.value.trim();
    if (!name) {
      alert('Please enter a deck name');
      nameInput.focus();
      return;
    }

    const deckData = {
      name,
      description: descInput.value.trim(),
      emoji: this.selectedEmoji,
      color: this.selectedColor,
      pinned: pinnedCheckbox.checked,
      lastModified: Date.now()
    };

    try {
      const result = await chrome.storage.local.get(['decks']);
      const decks = result.decks || {};

      if (this.editingDeckId) {
        decks[this.editingDeckId] = {
          ...decks[this.editingDeckId],
          ...deckData
        };
      } else {
        const deckId = 'deck_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        decks[deckId] = {
          ...deckData,
          created: Date.now()
        };
      }

      await chrome.storage.local.set({ decks });

      this.hideDeckModal();
      this.loadDecks();

      // Reload sidebar in cards view
      if (window.manageApp) {
        window.manageApp.loadDecks();
      }

    } catch (error) {
      console.error('Error saving deck:', error);
      alert('Failed to save deck');
    }
  }

  getDueCards(cards) {
    const now = Date.now();
    return cards.filter(card => {
      if (!card.lastReviewed) return false;
      const nextReview = card.lastReviewed + (card.interval || 1) * 24 * 60 * 60 * 1000;
      return nextReview <= now;
    }).length;
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize with proper DOM ready check
function initializeIntegratedManager() {
  console.log('Initializing IntegratedManager, DOM readyState:', document.readyState);
  
  if (!window.integratedManager) {
    window.integratedManager = new IntegratedManager();
    window.integratedManager.init();
    
    // Debug: Log all storage
    chrome.storage.local.get(null, (result) => {
      console.log('=== FULL STORAGE DEBUG ===');
      console.log('All storage:', result);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeIntegratedManager);
} else {
  console.log('DOM already loaded, initializing now');
  initializeIntegratedManager();
}
