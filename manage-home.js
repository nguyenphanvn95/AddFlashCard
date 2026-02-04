/**
 * Manage Home Page - Deck Management
 */

class DeckManager {
  constructor() {
    this.currentDeck = null;
    this.selectedEmoji = '😊';
    this.selectedColor = '#10b981';
    this.editingDeckId = null;
    
    this.init();
  }

  init() {
    this.loadDecks();
    this.bindEvents();
  }

  bindEvents() {
    // New deck button
    document.getElementById('newDeckCard')?.addEventListener('click', () => {
      this.showDeckModal();
    });

    // Modal close
    document.getElementById('deckModalClose')?.addEventListener('click', () => {
      this.hideDeckModal();
    });

    // Click outside modal to close
    document.getElementById('deckModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'deckModalBackdrop') {
        this.hideDeckModal();
      }
    });

    // Emoji selection
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedEmoji = btn.getAttribute('data-emoji');
      });
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedColor = btn.getAttribute('data-color');
      });
    });

    // Save deck
    document.getElementById('deckModalSave')?.addEventListener('click', () => {
      this.saveDeck();
    });

    // Context menu
    document.addEventListener('click', () => {
      this.hideContextMenu();
    });

    // Import button
    document.getElementById('importBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });

    // Sort button
    document.getElementById('sortBtn')?.addEventListener('click', () => {
      this.showSortMenu();
    });
  }

  async loadDecks() {
    try {
      const result = await chrome.storage.local.get(['decks', 'cards']);
      const decks = result.decks || {};
      const cards = result.cards || [];

      const decksGrid = document.getElementById('decksGrid');
      if (!decksGrid) return;

      decksGrid.innerHTML = '';

      const deckArray = Object.entries(decks).map(([id, deck]) => ({
        id,
        ...deck,
        cardCount: cards.filter(c => c.deck === id).length,
        newCards: cards.filter(c => c.deck === id && !c.lastReviewed).length,
        dueCards: this.getDueCards(cards.filter(c => c.deck === id))
      }));

      // Sort: pinned first, then by last modified
      deckArray.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastModified || 0) - (a.lastModified || 0);
      });

      if (deckArray.length === 0) {
        decksGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h3>No decks yet</h3>
            <p>Create your first deck to get started</p>
          </div>
        `;
        return;
      }

      deckArray.forEach(deck => {
        const deckCard = this.createDeckCard(deck);
        decksGrid.appendChild(deckCard);
      });

    } catch (error) {
      console.error('Error loading decks:', error);
    }
  }

  createDeckCard(deck) {
    const card = document.createElement('div');
    card.className = 'deck-card';
    if (deck.pinned) {
      card.classList.add('pinned');
    }

    // Apply gradient color
    const color = deck.color || '#10b981';
    card.style.background = `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;

    // Status badge
    let statusHTML = '';
    let statusClass = '';
    let statusIcon = '';
    let statusText = '';

    if (deck.cardCount === 0) {
      statusClass = 'new';
      statusIcon = '📝';
      statusText = 'Empty';
    } else if (deck.newCards > 0) {
      statusClass = 'learning';
      statusIcon = '📚';
      statusText = `${deck.newCards} new`;
    } else if (deck.dueCards > 0) {
      statusClass = 'learning';
      statusIcon = '⏰';
      statusText = `${deck.dueCards} due`;
    } else {
      statusClass = 'completed';
      statusIcon = '✓';
      statusText = 'Up to date';
    }

    // Due badge
    let dueBadgeHTML = '';
    if (deck.dueCards > 0) {
      dueBadgeHTML = `<div class="deck-due-badge">${deck.dueCards} Due</div>`;
    }

    // Load badge (if has unreviewed cards)
    let loadBadgeHTML = '';
    if (deck.newCards > 0) {
      loadBadgeHTML = `
        <div class="deck-load-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Load
        </div>
      `;
    }

    // Last reviewed
    let lastReviewedText = 'Never studied';
    if (deck.lastReviewed) {
      const daysAgo = Math.floor((Date.now() - deck.lastReviewed) / (1000 * 60 * 60 * 24));
      if (daysAgo === 0) {
        lastReviewedText = 'Studied today';
      } else if (daysAgo === 1) {
        lastReviewedText = 'Last studied yesterday';
      } else {
        lastReviewedText = `Last studied ${daysAgo} days ago`;
      }
    }

    card.innerHTML = `
      ${dueBadgeHTML}
      ${loadBadgeHTML}
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
          <div class="deck-last-reviewed">${lastReviewedText}</div>
        </div>
        <div class="deck-status ${statusClass}">
          <span class="deck-status-icon">${statusIcon}</span>
          ${statusText}
        </div>
      </div>
    `;

    // Click to open deck
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.deck-load-badge')) {
        this.openDeck(deck.id);
      }
    });

    // Right click for context menu
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, deck.id);
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

    if (!modal) return;

    this.editingDeckId = deckId;

    if (deckId) {
      // Edit mode
      chrome.storage.local.get(['decks'], (result) => {
        const deck = result.decks?.[deckId];
        if (!deck) return;

        title.textContent = 'Edit deck';
        saveBtn.textContent = 'Save';
        nameInput.value = deck.name || '';
        descInput.value = deck.description || '';
        pinnedCheckbox.checked = deck.pinned || false;

        // Set emoji
        this.selectedEmoji = deck.emoji || '😊';
        document.querySelectorAll('.emoji-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-emoji') === this.selectedEmoji);
        });

        // Set color
        this.selectedColor = deck.color || '#10b981';
        document.querySelectorAll('.color-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-color') === this.selectedColor);
        });
      });
    } else {
      // Create mode
      title.textContent = 'Create deck';
      saveBtn.textContent = 'Create';
      nameInput.value = '';
      descInput.value = '';
      pinnedCheckbox.checked = false;

      // Reset to defaults
      this.selectedEmoji = '😊';
      this.selectedColor = '#10b981';
      document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-emoji') === this.selectedEmoji);
      });
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === this.selectedColor);
      });
    }

    modal.style.display = 'flex';
    nameInput.focus();
  }

  hideDeckModal() {
    const modal = document.getElementById('deckModalBackdrop');
    if (modal) {
      modal.style.display = 'none';
    }
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
        // Update existing deck
        decks[this.editingDeckId] = {
          ...decks[this.editingDeckId],
          ...deckData
        };
      } else {
        // Create new deck
        const deckId = this.generateId();
        decks[deckId] = {
          ...deckData,
          created: Date.now()
        };
      }

      await chrome.storage.local.set({ decks });

      this.hideDeckModal();
      this.loadDecks();

    } catch (error) {
      console.error('Error saving deck:', error);
      alert('Failed to save deck. Please try again.');
    }
  }

  showContextMenu(event, deckId) {
    const menu = document.getElementById('deckContextMenu');
    if (!menu) return;

    menu.style.display = 'block';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';

    // Remove old listeners
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);

    // Edit
    newMenu.querySelector('#contextEdit')?.addEventListener('click', () => {
      this.showDeckModal(deckId);
      this.hideContextMenu();
    });

    // Study
    newMenu.querySelector('#contextStudy')?.addEventListener('click', () => {
      this.openStudyMode(deckId);
      this.hideContextMenu();
    });

    // Export
    newMenu.querySelector('#contextExport')?.addEventListener('click', () => {
      this.exportDeck(deckId);
      this.hideContextMenu();
    });

    // Delete
    newMenu.querySelector('#contextDelete')?.addEventListener('click', () => {
      this.deleteDeck(deckId);
      this.hideContextMenu();
    });
  }

  hideContextMenu() {
    const menu = document.getElementById('deckContextMenu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  openDeck(deckId) {
    // Navigate to cards view for this deck
    window.location.href = `manage.html?deck=${deckId}`;
  }

  openStudyMode(deckId) {
    window.location.href = `study.html?deck=${deckId}`;
  }

  async exportDeck(deckId) {
    try {
      const result = await chrome.storage.local.get(['decks', 'cards']);
      const deck = result.decks?.[deckId];
      const deckCards = result.cards?.filter(c => c.deck === deckId) || [];

      if (!deck) return;

      const exportData = {
        deck,
        cards: deckCards,
        exported: Date.now()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting deck:', error);
      alert('Failed to export deck');
    }
  }

  async deleteDeck(deckId) {
    const confirmed = confirm('Are you sure you want to delete this deck? All cards in this deck will be deleted. This cannot be undone.');
    if (!confirmed) return;

    try {
      const result = await chrome.storage.local.get(['decks', 'cards']);
      const decks = result.decks || {};
      const cards = result.cards || [];

      delete decks[deckId];
      const filteredCards = cards.filter(c => c.deck !== deckId);

      await chrome.storage.local.set({
        decks,
        cards: filteredCards
      });

      this.loadDecks();

    } catch (error) {
      console.error('Error deleting deck:', error);
      alert('Failed to delete deck');
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

  generateId() {
    return 'deck_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSortMenu() {
    // TODO: Implement sort menu
    alert('Sort feature coming soon!');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DeckManager();
  });
} else {
  new DeckManager();
}
