// DOM Elements
const frontEditor = document.getElementById('frontEditor');
const backEditor = document.getElementById('backEditor');
const deckInput = document.getElementById('deckInput');
const addCardBtn = document.getElementById('addCardBtn');
const cardsList = document.getElementById('cardsList');
const clearBtn = document.getElementById('clearBtn');

// Toolbar buttons
const toolbarBtns = document.querySelectorAll('.toolbar-btn[data-command]');
const frontStyle = document.getElementById('frontStyle');
const backStyle = document.getElementById('backStyle');

// Khởi tạo khi mở popup
document.addEventListener('DOMContentLoaded', () => {
  loadCards();
  loadPendingContent();
  setupToolbar();
  setupEditors();
});

// Xử lý pending content từ context menu
function loadPendingContent() {
  chrome.storage.local.get(['pendingContent'], (result) => {
    const pending = result.pendingContent || [];
    
    if (pending.length > 0) {
      pending.forEach(content => {
        if (content.type === 'sendToFront') {
          insertContent(frontEditor, content);
        } else if (content.type === 'sendToBack') {
          insertContent(backEditor, content);
        }
      });
      
      // Xóa pending content sau khi đã load
      chrome.storage.local.set({ pendingContent: [] });
    }
  });
}

// Lắng nghe message từ background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'addContent') {
    const content = message.content;
    
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
    // Chèn ảnh
    const img = document.createElement('img');
    img.src = content.data;
    img.style.maxWidth = '100%';
    editor.appendChild(img);
  } else {
    // Chèn văn bản
    const p = document.createElement('p');
    p.textContent = content.data;
    editor.appendChild(p);
  }
  
  // Focus vào editor
  editor.focus();
}

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

  // Style selects
  frontStyle.addEventListener('change', (e) => {
    applyStyle(frontEditor, e.target.value);
  });

  backStyle.addEventListener('change', (e) => {
    applyStyle(backEditor, e.target.value);
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

  // Code buttons
  document.getElementById('codeBtnFront').addEventListener('click', () => {
    insertCode(frontEditor);
  });

  document.getElementById('codeBtnBack').addEventListener('click', () => {
    insertCode(backEditor);
  });
}

// Apply style
function applyStyle(editor, style) {
  editor.focus();
  
  switch(style) {
    case 'heading1':
      document.execCommand('formatBlock', false, '<h1>');
      break;
    case 'heading2':
      document.execCommand('formatBlock', false, '<h2>');
      break;
    default:
      document.execCommand('formatBlock', false, '<p>');
  }
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

// Insert code
function insertCode(editor) {
  editor.focus();
  const selection = window.getSelection();
  const selectedText = selection.toString();
  
  if (selectedText) {
    const code = document.createElement('code');
    code.textContent = selectedText;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(code);
  } else {
    const code = document.createElement('code');
    code.textContent = 'code';
    editor.appendChild(code);
  }
}

// Setup editors
function setupEditors() {
  // Placeholder behavior
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

// Add card
addCardBtn.addEventListener('click', () => {
  const deck = deckInput.value.trim();
  const front = frontEditor.innerHTML.trim();
  const back = backEditor.innerHTML.trim();

  if (!front || !back) {
    showNotification('Please fill in both front and back', 'error');
    return;
  }

  const card = {
    id: Date.now(),
    deck: deck || 'Default',
    front: front,
    back: back,
    createdAt: new Date().toISOString()
  };

  saveCard(card);
  
  // Clear editors
  frontEditor.innerHTML = '';
  backEditor.innerHTML = '';
  
  showNotification('Card added successfully!');
  loadCards();
});

// Save card to storage
function saveCard(card) {
  chrome.storage.local.get(['cards'], (result) => {
    const cards = result.cards || [];
    cards.push(card);
    chrome.storage.local.set({ cards: cards });
  });
}

// Load cards from storage
function loadCards() {
  chrome.storage.local.get(['cards'], (result) => {
    const cards = result.cards || [];
    displayCards(cards);
  });
}

// Display cards
function displayCards(cards) {
  cardsList.innerHTML = '';
  
  if (cards.length === 0) {
    cardsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No cards yet. Add your first card!</p>';
    return;
  }

  cards.reverse().forEach(card => {
    const cardItem = document.createElement('div');
    cardItem.className = 'card-item';
    cardItem.innerHTML = `
      <div class="card-item-header">
        <span class="card-item-deck">📚 ${card.deck}</span>
        <button class="card-item-delete" data-id="${card.id}">🗑️</button>
      </div>
      <div class="card-item-content">
        <div class="card-item-front">${card.front}</div>
        <div class="card-item-back">${card.back}</div>
      </div>
    `;
    
    cardsList.appendChild(cardItem);
  });

  // Add delete listeners
  document.querySelectorAll('.card-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cardId = parseInt(e.target.getAttribute('data-id'));
      deleteCard(cardId);
    });
  });
}

// Delete card
function deleteCard(cardId) {
  chrome.storage.local.get(['cards'], (result) => {
    const cards = result.cards || [];
    const updatedCards = cards.filter(card => card.id !== cardId);
    chrome.storage.local.set({ cards: updatedCards }, () => {
      loadCards();
      showNotification('Card deleted');
    });
  });
}

// Clear all cards
clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all cards?')) {
    chrome.storage.local.set({ cards: [] }, () => {
      loadCards();
      showNotification('All cards deleted');
    });
  }
});

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
