// DOM Elements
const frontEditor = document.getElementById('frontEditor');
const backEditor = document.getElementById('backEditor');
const deckSelect = document.getElementById('deckSelect');
const addCardBtn = document.getElementById('addCardBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const newDeckBtn = document.getElementById('newDeckBtn');
const manageBtn = document.getElementById('manageBtn');
const statsContent = document.getElementById('statsContent');

// Toolbar buttons
const toolbarBtns = document.querySelectorAll('.toolbar-btn[data-command]');

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
  loadDecks();
  setupToolbar();
  setupEditors();
  loadStatistics();
});

// Load danh sách decks
function loadDecks() {
  chrome.storage.local.get(['decks', 'cards'], (result) => {
    const decks = result.decks || ['Default'];
    const cards = result.cards || [];
    
    // Clear current options
    deckSelect.innerHTML = '<option value="">Choose a deck...</option>';
    
    // Add decks
    decks.forEach(deck => {
      const option = document.createElement('option');
      option.value = deck;
      option.textContent = deck;
      
      // Count cards in this deck
      const count = cards.filter(c => c.deck === deck).length;
      option.textContent = `${deck} (${count})`;
      
      deckSelect.appendChild(option);
    });
    
    // Select first deck by default
    if (decks.length > 0) {
      deckSelect.value = decks[0];
    }
  });
}

// Create new deck
newDeckBtn.addEventListener('click', () => {
  const deckName = prompt('Enter deck name:');
  if (deckName && deckName.trim()) {
    chrome.storage.local.get(['decks'], (result) => {
      const decks = result.decks || ['Default'];
      
      if (decks.includes(deckName.trim())) {
        showNotification('Deck already exists!', 'error');
        return;
      }
      
      decks.push(deckName.trim());
      chrome.storage.local.set({ decks: decks }, () => {
        loadDecks();
        deckSelect.value = deckName.trim();
        showNotification('Deck created!', 'success');
      });
    });
  }
});

// Setup toolbar
function setupToolbar() {
  // Các nút formatting
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
  document.getElementById('linkBtnFront').addEventListener('click', () => {
    insertLink(frontEditor);
  });

  document.getElementById('linkBtnBack').addEventListener('click', () => {
    insertLink(backEditor);
  });

  // Image buttons
  document.getElementById('imageBtnFront').addEventListener('click', () => {
    insertImage(frontEditor);
  });

  document.getElementById('imageBtnBack').addEventListener('click', () => {
    insertImage(backEditor);
  });
}

// Insert link
function insertLink(editor) {
  const url = prompt('Enter URL:');
  if (url) {
    editor.focus();
    document.execCommand('createLink', false, url);
  }
}

// Insert image
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

// Setup editors
function setupEditors() {
  [frontEditor, backEditor].forEach(editor => {
    editor.addEventListener('focus', () => {
      if (editor.textContent.trim() === '') {
        editor.textContent = '';
      }
    });

    editor.addEventListener('blur', () => {
      if (editor.textContent.trim() === '') {
        editor.innerHTML = '';
      }
    });
  });
}

// Lắng nghe message từ parent window (content script)
window.addEventListener('message', (event) => {
  if (event.data.action === 'addContent') {
    const content = event.data.content;
    
    if (content.type === 'sendToFront') {
      insertContent(frontEditor, content);
    } else if (content.type === 'sendToBack') {
      insertContent(backEditor, content);
    }
  }
});

// Chèn nội dung vào editor
function insertContent(editor, content) {
  if (content.isImage) {
    const img = document.createElement('img');
    img.src = content.data;
    img.style.maxWidth = '100%';
    editor.appendChild(img);
  } else {
    const p = document.createElement('p');
    p.textContent = content.data;
    editor.appendChild(p);
  }
  
  editor.focus();
  showNotification('Content added!', 'success');
}

// Add card
addCardBtn.addEventListener('click', () => {
  const deck = deckSelect.value.trim();
  const front = frontEditor.innerHTML.trim();
  const back = backEditor.innerHTML.trim();

  if (!deck) {
    showNotification('Please select a deck', 'error');
    return;
  }

  if (!front || !back) {
    showNotification('Please fill in both front and back', 'error');
    return;
  }

  const card = {
    id: Date.now(),
    deck: deck,
    front: front,
    back: back,
    createdAt: new Date().toISOString()
  };

  saveCard(card);
});

// Save card
function saveCard(card) {
  chrome.storage.local.get(['cards'], (result) => {
    const cards = result.cards || [];
    cards.push(card);
    chrome.storage.local.set({ cards: cards }, () => {
      // Clear editors
      frontEditor.innerHTML = '';
      backEditor.innerHTML = '';
      
      showNotification('Card added successfully!', 'success');
      loadStatistics();
      loadDecks();
    });
  });
}

// Load statistics
function loadStatistics() {
  chrome.storage.local.get(['cards', 'decks'], (result) => {
    const cards = result.cards || [];
    const decks = result.decks || ['Default'];
    
    if (cards.length === 0) {
      statsContent.innerHTML = '<div class="stats-loading">No cards yet</div>';
      return;
    }
    
    // Count cards by deck
    const deckCounts = {};
    decks.forEach(deck => {
      deckCounts[deck] = cards.filter(c => c.deck === deck).length;
    });
    
    // Build HTML
    let html = '';
    Object.entries(deckCounts).forEach(([deck, count]) => {
      if (count > 0) {
        html += `
          <div class="stat-item">
            <span class="stat-deck">${deck}</span>
            <span class="stat-count">${count}</span>
          </div>
        `;
      }
    });
    
    // Total
    html += `
      <div class="stat-item stat-total">
        <span class="stat-deck">Total Cards</span>
        <span class="stat-count">${cards.length}</span>
      </div>
    `;
    
    statsContent.innerHTML = html;
  });
}

// Close sidebar
closeSidebarBtn.addEventListener('click', () => {
  window.parent.postMessage({ action: 'closeSidebar' }, '*');
});

// Open manage page
manageBtn.addEventListener('click', () => {
  window.parent.postMessage({ action: 'openManagePage' }, '*');
});

// Show notification
function showNotification(message, type = 'success') {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
