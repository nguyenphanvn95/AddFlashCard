// DOM Elements
const frontEditor = document.getElementById('frontEditor');
const backEditor = document.getElementById('backEditor');
const deckSelect = document.getElementById('deckSelect');
const addCardBtn = document.getElementById('addCardBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const newDeckBtn = document.getElementById('newDeckBtn');
const manageBtn = document.getElementById('manageBtn');
const statsContent = document.getElementById('statsContent');
const headerTitle = document.querySelector('.sidebar-header h1');
const tagsInput = document.getElementById('tagsInput');
const tagsDisplay = document.getElementById('tagsDisplay');

// Edit state
let isEditMode = false;
let editingCardId = null;
let editingCreatedAt = null;
let currentTags = [];

// Toolbar buttons
const toolbarBtns = document.querySelectorAll('.toolbar-btn[data-command]');

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
  loadDecks();
  setupToolbar();
  setupEditors();
  setupTags();
  setupRichTextShortcuts();
  loadStatistics();

  // If opened in edit mode (e.g. from Manage page), load context and switch UI.
  const params = new URLSearchParams(location.search);
  if (params.get('mode') === 'edit') {
    chrome.storage.local.get(['editCardContext'], (result) => {
      if (result.editCardContext && typeof result.editCardContext.id === 'number') {
        enterEditMode(result.editCardContext);
      }
    });
  }
});

function setHeaderAndButtonForMode() {
  if (isEditMode) {
    if (headerTitle) headerTitle.textContent = 'Edit card';
    addCardBtn.textContent = 'SAVE CARD';
    addCardBtn.classList.add('is-edit');
  } else {
    if (headerTitle) headerTitle.textContent = 'Add Card';
    addCardBtn.textContent = 'ADD CARD';
    addCardBtn.classList.remove('is-edit');
  }
}

function enterEditMode(card) {
  isEditMode = true;
  editingCardId = card.id;
  editingCreatedAt = card.createdAt || null;

  // Ensure decks are loaded then select correct deck.
  chrome.storage.local.get(['decks'], (result) => {
    const decks = result.decks || ['Default'];
    if (!decks.includes(card.deck)) {
      decks.push(card.deck);
      chrome.storage.local.set({ decks }, () => loadDecks());
    } else {
      loadDecks();
    }

    // Populate fields
    deckSelect.value = card.deck;
    frontEditor.innerHTML = card.front || '';
    backEditor.innerHTML = card.back || '';
    
    // Load tags
    currentTags = card.tags || [];
    renderTags();
    
    setHeaderAndButtonForMode();

    // Focus front editor for immediate editing
    frontEditor.focus();
  });
}

function exitEditMode() {
  isEditMode = false;
  editingCardId = null;
  editingCreatedAt = null;
  setHeaderAndButtonForMode();
}

// Load danh sách decks
function loadDecks() {
  chrome.storage.local.get(['decks', 'cards'], (result) => {
    const decks = result.decks || ['Default'];
    const cards = result.cards || [];

    // Preserve selection (especially important for Edit mode)
    const preferred = isEditMode && deckSelect.value ? deckSelect.value : deckSelect.value;
    
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
    
    // Restore selection if possible; otherwise select first deck
    if (preferred && decks.includes(preferred)) {
      deckSelect.value = preferred;
    } else if (decks.length > 0) {
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
  // Handle old-style addContent with type field
  if (event.data.action === 'addContent') {
    const content = event.data.content;
    
    if (content.type === 'sendToFront') {
      insertContent(frontEditor, content);
    } else if (content.type === 'sendToBack') {
      insertContent(backEditor, content);
    }
  }

  // Handle new-style direct addToFront/addToBack actions
  if (event.data.action === 'addToFront') {
    insertContentFromSelection(frontEditor, event.data.content, event.data.isHtml);
  }
  
  if (event.data.action === 'addToBack') {
    insertContentFromSelection(backEditor, event.data.content, event.data.isHtml);
  }

  // Allow parent/content script to switch sidebar into Edit mode
  if (event.data.action === 'editCard' && event.data.card) {
    enterEditMode(event.data.card);
  }
});

// Chèn nội dung vào editor
function insertContent(editor, content) {
  // Prefer rich HTML payload to preserve formatting (bold/links/lists, etc.)
  // Supported: text/html (selection), image/link/video from context menu.
  if (content && content.dataHtml) {
    const fragment = htmlToSafeFragment(content.dataHtml);
    editor.appendChild(fragment);
  } else if (content && (content.isImage || content.mediaType === 'image') && content.data) {
    const img = document.createElement('img');
    img.src = content.data;
    img.style.maxWidth = '100%';
    editor.appendChild(img);
  } else if (content && content.data) {
    const p = document.createElement('p');
    p.textContent = content.data;
    editor.appendChild(p);
  }
  
  editor.focus();
  showNotification('Content added!', 'success');
}

// Chèn nội dung từ selection (Alt+A hoặc Alt+B)
function insertContentFromSelection(editor, content, isHtml) {
  if (!content) return;
  
  // Nếu là HTML, parse và sanitize
  if (isHtml) {
    const fragment = htmlToSafeFragment(content);
    
    // Chuyển đổi ảnh từ URL thành base64 để lưu trữ offline
    fragment.querySelectorAll('img[src]').forEach(async (img) => {
      const src = img.getAttribute('src');
      // Chỉ convert ảnh từ URL, không convert ảnh đã là base64
      if (src && !src.startsWith('data:') && (src.startsWith('http://') || src.startsWith('https://'))) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result;
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.warn('Could not convert image to base64:', error);
          // Giữ nguyên URL nếu không convert được
        }
      }
    });
    
    editor.appendChild(fragment);
  } else {
    // Plain text
    const p = document.createElement('p');
    p.textContent = content;
    editor.appendChild(p);
  }
  
  editor.focus();
  showNotification('Content added!', 'success');
}

/**
 * Convert HTML string to a safe DocumentFragment.
 * - strips <script>/<style>
 * - removes event handler attrs (on*)
 * - keeps formatting tags so “Send to Front/Back” preserves layout
 */
function htmlToSafeFragment(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');

  // Remove scripts/styles
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Remove on* attributes and javascript: URLs
  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const val = String(attr.value || '');

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src') && val.trim().toLowerCase().startsWith('javascript:')) {
        el.removeAttribute(attr.name);
        return;
      }
    });
  });

  const frag = document.createDocumentFragment();
  // Keep body children to avoid wrapping <html><body> artifacts
  [...doc.body.childNodes].forEach(n => frag.appendChild(n));
  return frag;
}

// Add card
addCardBtn.addEventListener('click', async () => {
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

  if (isEditMode && typeof editingCardId === 'number') {
    await updateCard({
      id: editingCardId,
      deck,
      front,
      back,
      tags: currentTags,
      createdAt: editingCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } else {
    const card = {
      id: Date.now(),
      deck: deck,
      front: front,
      back: back,
      tags: currentTags,
      createdAt: new Date().toISOString()
    };
    await saveCard(card);
  }
});

// Update existing card (Edit mode) with media download
async function updateCard(card) {
  // Show processing notification
  showNotification('Processing media files...', 'info');
  
  try {
    // Process front and back content to download media
    if (MediaHandler && typeof MediaHandler.processHTMLContent === 'function') {
      card.front = await MediaHandler.processHTMLContent(card.front);
      card.back = await MediaHandler.processHTMLContent(card.back);
    }
    
    chrome.storage.local.get(['cards'], (result) => {
      const cards = result.cards || [];
      const idx = cards.findIndex(c => c.id === card.id);
      if (idx === -1) {
        showNotification('Card not found (maybe deleted).', 'error');
        exitEditMode();
        return;
      }

      // Preserve original createdAt if present
      const original = cards[idx];
      cards[idx] = {
        ...original,
        deck: card.deck,
        front: card.front,
        back: card.back,
        tags: card.tags || [],
        createdAt: original.createdAt || card.createdAt,
        updatedAt: card.updatedAt
      };

      chrome.storage.local.set({ cards }, () => {
        showNotification('Card saved successfully!', 'success');
        loadStatistics();
        loadDecks();

        // Clear edit context so next open is clean
        chrome.storage.local.remove(['editCardContext']);

        // Exit edit mode and clear editors (back to Add flow)
        frontEditor.innerHTML = '';
        backEditor.innerHTML = '';
        currentTags = [];
        renderTags();
        exitEditMode();
      });
    });
  } catch (error) {
    console.error('Error updating card:', error);
    showNotification('Error processing media, saving with original URLs', 'warning');
    
    // Fallback without media processing
    chrome.storage.local.get(['cards'], (result) => {
      const cards = result.cards || [];
      const idx = cards.findIndex(c => c.id === card.id);
      if (idx === -1) {
        showNotification('Card not found', 'error');
        exitEditMode();
        return;
      }
      
      const original = cards[idx];
      cards[idx] = {
        ...original,
        deck: card.deck,
        front: card.front,
        back: card.back,
        updatedAt: card.updatedAt
      };
      
      chrome.storage.local.set({ cards }, () => {
        showNotification('Card saved!', 'success');
        frontEditor.innerHTML = '';
        backEditor.innerHTML = '';
        currentTags = [];
        renderTags();
        exitEditMode();
      });
    });
  }
}

// Save card (with media download)
async function saveCard(card) {
  // Show processing notification
  showNotification('Processing media files...', 'info');
  
  try {
    // Process front and back content to download media
    if (MediaHandler && typeof MediaHandler.processHTMLContent === 'function') {
      card.front = await MediaHandler.processHTMLContent(card.front);
      card.back = await MediaHandler.processHTMLContent(card.back);
    }
    
    chrome.storage.local.get(['cards'], (result) => {
      const cards = result.cards || [];
      cards.push(card);
      chrome.storage.local.set({ cards: cards }, () => {
        // Clear editors
        frontEditor.innerHTML = '';
        backEditor.innerHTML = '';
        currentTags = [];
        renderTags();
        
        showNotification('Card added successfully!', 'success');
        loadStatistics();
        loadDecks();
        
        // Check storage usage
        if (MediaHandler && typeof MediaHandler.cleanupOldMedia === 'function') {
          MediaHandler.cleanupOldMedia();
        }
      });
    });
  } catch (error) {
    console.error('Error saving card:', error);
    showNotification('Error processing media, saving with original URLs', 'warning');
    
    // Fallback: save without processing
    chrome.storage.local.get(['cards'], (result) => {
      const cards = result.cards || [];
      cards.push(card);
      chrome.storage.local.set({ cards: cards }, () => {
        frontEditor.innerHTML = '';
        backEditor.innerHTML = '';
        currentTags = [];
        renderTags();
        showNotification('Card added!', 'success');
        loadStatistics();
        loadDecks();
      });
    });
  }
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
  // If running inside an injected iframe, ask parent to close.
  // If running standalone (popup window), just close the window.
  if (window.top === window.self) {
    window.close();
  } else {
    window.parent.postMessage({ action: 'closeSidebar' }, '*');
  }
});

// Open manage page
manageBtn.addEventListener('click', () => {
  if (window.top === window.self) {
    chrome.runtime.sendMessage({ action: 'openManagePage' });
  } else {
    window.parent.postMessage({ action: 'openManagePage' }, '*');
  }
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

// Tags Management
function setupTags() {
  if (!tagsInput || !tagsDisplay) return;
  
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  });
  
  tagsInput.addEventListener('blur', () => {
    if (tagsInput.value.trim()) {
      addTag();
    }
  });
}

function addTag() {
  const tagText = tagsInput.value.trim().replace(/,/g, '');
  if (!tagText) return;
  
  // Avoid duplicates
  if (currentTags.includes(tagText)) {
    tagsInput.value = '';
    return;
  }
  
  currentTags.push(tagText);
  renderTags();
  tagsInput.value = '';
}

function removeTag(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderTags();
}

function renderTags() {
  if (!tagsDisplay) return;
  
  tagsDisplay.innerHTML = '';
  currentTags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.innerHTML = `
      ${tag}
      <span class="tag-remove" data-tag="${tag}">×</span>
    `;
    
    const removeBtn = tagEl.querySelector('.tag-remove');
    removeBtn.addEventListener('click', () => removeTag(tag));
    
    tagsDisplay.appendChild(tagEl);
  });
}

// Rich Text Keyboard Shortcuts
function setupRichTextShortcuts() {
  const editors = [frontEditor, backEditor];
  
  editors.forEach(editor => {
    if (!editor) return;
    
    editor.addEventListener('keydown', (e) => {
      // Ctrl+B: Bold
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
        return;
      }
      
      // Ctrl+I: Italic
      if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
        return;
      }
      
      // Ctrl+U: Underline
      if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
        return;
      }
      
      // Ctrl+K: Insert Link
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        insertLink(editor);
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
        increaseFontSize(editor);
        return;
      }
      
      // Ctrl+[: Decrease Font Size
      if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        decreaseFontSize(editor);
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
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        document.execCommand('justifyCenter', false, null);
        return;
      }
      
      // Ctrl+L: Left Align
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        document.execCommand('justifyLeft', false, null);
        return;
      }
      
      // Ctrl+R: Right Align
      if (e.ctrlKey && e.key.toLowerCase() === 'r') {
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
    });
  });
}

// Insert Link Helper
function insertLink(editor) {
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

// Font Size Helpers
function increaseFontSize(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const selectedContent = range.extractContents();
  
  // Wrap in span with larger font
  const span = document.createElement('span');
  span.style.fontSize = 'larger';
  span.appendChild(selectedContent);
  
  range.insertNode(span);
  
  // Restore selection
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  selection.addRange(newRange);
}

function decreaseFontSize(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const selectedContent = range.extractContents();
  
  // Wrap in span with smaller font
  const span = document.createElement('span');
  span.style.fontSize = 'smaller';
  span.appendChild(selectedContent);
  
  range.insertNode(span);
  
  // Restore selection
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  selection.addRange(newRange);
}

