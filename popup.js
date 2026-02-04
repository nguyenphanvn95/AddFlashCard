// Popup.js - Enhanced with PDF Viewer button

document.addEventListener('DOMContentLoaded', async () => {
  // Load stats
  await loadStats();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update UI based on current state
  updateUI();
});

// Load statistics
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['flashcards', 'lastStudyDate']);
    const flashcards = result.flashcards || [];
    const today = new Date().toDateString();
    
    document.getElementById('total-cards').textContent = flashcards.length;
    
    // Count cards created today
    const todayCards = flashcards.filter(card => {
      const cardDate = new Date(card.created || 0).toDateString();
      return cardDate === today;
    }).length;
    
    document.getElementById('today-cards').textContent = todayCards;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Manage button
  document.getElementById('manage-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html') });
    window.close();
  });
  
  // Study button
  document.getElementById('study-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('study.html') });
    window.close();
  });
  
  // PDF Viewer button
  document.getElementById('pdf-viewer-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pdf-viewer.html') });
    window.close();
  });
  
  // Export button
  document.getElementById('export-btn').addEventListener('click', async () => {
    try {
      const result = await chrome.storage.local.get(['flashcards']);
      const flashcards = result.flashcards || [];
      
      if (flashcards.length === 0) {
        alert('Không có thẻ nào để export!');
        return;
      }
      
      // Send message to background to handle export
      chrome.runtime.sendMessage({
        action: 'exportAPKG',
        flashcards: flashcards
      });
      
      showNotification('Đang export...', 'info');
    } catch (error) {
      console.error('Error exporting:', error);
      showNotification('Lỗi khi export!', 'error');
    }
  });
  
  // Anki Sync button
  document.getElementById('anki-sync-btn').addEventListener('click', async () => {
    try {
      // Check AnkiConnect
      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'version',
          version: 6
        })
      });
      
      if (response.ok) {
        chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#anki-sync') });
        window.close();
      } else {
        alert('Không thể kết nối với AnkiConnect. Vui lòng đảm bảo Anki đang chạy và AnkiConnect đã được cài đặt.');
      }
    } catch (error) {
      alert('Không thể kết nối với AnkiConnect. Vui lòng đảm bảo Anki đang chạy và AnkiConnect đã được cài đặt.');
    }
  });
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#settings') });
    window.close();
  });
  
  // Help button
  document.getElementById('help-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#help') });
    window.close();
  });
  
  // Notion link
  document.getElementById('notion-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#notion') });
    window.close();
  });
}

// Update UI based on state
function updateUI() {
  // Add animations or state updates here
  const buttons = document.querySelectorAll('.action-btn');
  buttons.forEach((btn, index) => {
    btn.style.animationDelay = `${index * 0.05}s`;
    btn.classList.add('fade-in');
  });
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 6px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    font-size: 13px;
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(-50px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(-50px);
      opacity: 0;
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);
