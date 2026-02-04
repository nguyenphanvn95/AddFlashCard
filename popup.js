// Popup.js - Enhanced with PDF Viewer button

document.addEventListener('DOMContentLoaded', async () => {
  // Load stats
  await loadStats();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup settings modal
  setupSettingsModal();
  
  // Setup about modal
  setupAboutModal();
  
  // Update UI based on current state
  updateUI();
});

// Load statistics
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['cards']);
    const cards = result.cards || [];
    const today = new Date().toDateString();
    
    document.getElementById('total-cards').textContent = cards.length;
    
    // Count cards created today
    const todayCards = cards.filter(card => {
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
    openSettingsModal();
  });
  
  // Help button
  document.getElementById('help-btn').addEventListener('click', () => {
    openAboutModal();
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

// Settings Modal
function setupSettingsModal() {
  // No separate setup needed - just functionality
}

function openSettingsModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #2c3e50;
    border: 1px solid #3d5266;
    border-radius: 12px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
    color: #ecf0f1;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="font-size: 18px; margin: 0;">⚙️ Cài đặt</h2>
      <button class="close-modal-btn" style="background: none; border: none; color: #ecf0f1; font-size: 24px; cursor: pointer; padding: 0;">&times;</button>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <span style="font-weight: 500;">Theme:</span>
      </label>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-left: 0;">
        <button class="theme-btn" data-theme="light" style="padding: 8px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s;">☀️ Light</button>
        <button class="theme-btn" data-theme="dark" style="padding: 8px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s;">🌙 Dark</button>
        <button class="theme-btn" data-theme="system" style="padding: 8px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s;">🖥️ System</button>
      </div>
      
      <hr style="border: none; border-top: 1px solid #3d5266; margin: 12px 0;">
      
      <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <input type="checkbox" id="notificationsToggle" style="width: 18px; height: 18px; cursor: pointer;">
        <span style="font-weight: 500;">Bật thông báo</span>
      </label>
      
      <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <input type="checkbox" id="autoSyncToggle" style="width: 18px; height: 18px; cursor: pointer;">
        <span style="font-weight: 500;">Tự động đồng bộ Anki</span>
      </label>
    </div>
    
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button class="close-modal-btn" style="flex: 1; padding: 10px; background: #34495e; border: 1px solid #4a5f7f; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-weight: 500;">Đóng</button>
      <button class="save-settings-btn" style="flex: 1; padding: 10px; background: #5dade2; border: 1px solid #5dade2; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">Lưu</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Load saved settings
  chrome.storage.local.get(['afc_theme', 'afc_notifications', 'afc_auto_sync'], (result) => {
    const theme = result.afc_theme || 'light';
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.style.background = '#5dade2';
        btn.style.borderColor = '#5dade2';
      }
    });
    
    const notificationsCheckbox = document.getElementById('notificationsToggle');
    const autoSyncCheckbox = document.getElementById('autoSyncToggle');
    if (notificationsCheckbox) notificationsCheckbox.checked = result.afc_notifications !== false;
    if (autoSyncCheckbox) autoSyncCheckbox.checked = result.afc_auto_sync === true;
  });
  
  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = e.target.getAttribute('data-theme');
      document.querySelectorAll('.theme-btn').forEach(b => {
        b.style.background = '#34495e';
        b.style.borderColor = '#4a5f7f';
      });
      e.target.style.background = '#5dade2';
      e.target.style.borderColor = '#5dade2';
    });
  });
  
  // Save settings
  document.querySelector('.save-settings-btn').addEventListener('click', () => {
    const theme = document.querySelector('.theme-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-theme') || 'light';
    const notificationsCheckbox = document.getElementById('notificationsToggle');
    const autoSyncCheckbox = document.getElementById('autoSyncToggle');
    
    chrome.storage.local.set({
      afc_theme: theme,
      afc_notifications: notificationsCheckbox.checked,
      afc_auto_sync: autoSyncCheckbox.checked
    });
    
    overlay.remove();
    showNotification('Cài đặt đã được lưu!', 'success');
  });
  
  // Close modal
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => overlay.remove());
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// About Modal
function setupAboutModal() {
  // No separate setup needed - just functionality
}

function openAboutModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border: 1px solid #3d5266;
    border-radius: 12px;
    padding: 30px;
    width: 90%;
    max-width: 380px;
    color: #ecf0f1;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;
  
  modal.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 15px;">📚</div>
    <h2 style="font-size: 20px; margin: 0 0 8px 0; color: #5dade2;">AddFlashcard</h2>
    <p style="font-size: 14px; color: #95a5a6; margin: 0 0 20px 0; line-height: 1.6;">
      Tạo flashcard từ văn bản, ảnh, media trên web<br>
      Export APKG và sync với Anki qua AnkiConnect
    </p>
    
    <div style="background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 8px 0; font-size: 13px;">
        <span style="color: #95a5a6;">Phiên bản:</span> <span style="color: #5dade2; font-weight: 600;">2.6.1</span>
      </p>
      <p style="margin: 8px 0; font-size: 13px;">
        <span style="color: #95a5a6;">Tác giả:</span> <span style="color: #ecf0f1;">Nguyễn Văn Phán</span>
      </p>
      <p style="margin: 8px 0; font-size: 13px;">
        <span style="color: #95a5a6;">Website:</span> <a href="https://github.com" target="_blank" style="color: #5dade2; text-decoration: none;">GitHub</a>
      </p>
    </div>
    
    <div style="display: flex; gap: 10px;">
      <button class="close-about-btn" style="flex: 1; padding: 10px; background: #34495e; border: 1px solid #4a5f7f; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-weight: 500;">Đóng</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close modal
  document.querySelector('.close-about-btn').addEventListener('click', () => overlay.remove());
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
