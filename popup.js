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
  
  // Image Occlusion button
  document.getElementById('image-occlusion-btn').addEventListener('click', async () => {
    // Show submenu with options
    const action = await showImageOcclusionMenu();
    if (action === 'capture-area') {
      // Capture area on current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
      }
      window.close();
    } else if (action === 'capture-page') {
      // Capture full page on current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          // Send captured image to the page overlay editor
          chrome.tabs.sendMessage(tab.id, { action: 'showOverlayEditor', imageData: dataUrl, area: null });
        });
      }
      window.close();
    } else if (action === 'open-editor') {
      // Open editor in new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('image-occlusion-editor.html') });
      window.close();
    }
  });
  
  // Export button
  document.getElementById('export-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#export') });
    window.close();
  });
  
  // Anki Sync button
  document.getElementById('anki-sync-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#anki-sync') });
    window.close();
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
    max-width: 420px;
    color: #ecf0f1;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="font-size: 18px; margin: 0;">⚙️ Settings</h2>
      <button class="close-modal-btn" style="background: none; border: none; color: #ecf0f1; font-size: 24px; cursor: pointer; padding: 0;">&times;</button>
    </div>
    
    <!-- Image Hover Settings -->
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #3d5266;">
      <label style="display: block; margin-bottom: 10px;">
        <div style="font-weight: 600; margin-bottom: 4px;">🖼️ Image Occlusion Quick Access</div>
        <div style="font-size: 12px; color: #95a5a6;">Enable hover icon and Alt+Click on images</div>
      </label>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 14px;">Alt+Click on image to create occlusion</div>
          <div style="display: grid; grid-auto-flow: column; grid-auto-columns: min-content; gap: 8px;">
            <button class="altclick-btn" data-value="on" style="padding: 8px 10px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer;">On</button>
            <button class="altclick-btn" data-value="off" style="padding: 8px 10px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer;">Off</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Overlay Opacity -->
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #3d5266;">
      <label style="display: block; margin-bottom: 10px;">
        <div style="font-weight: 600; margin-bottom: 4px;">Overlay opacity</div>
        <div style="font-size: 12px; color: #95a5a6;">Dim background when sidebar is open (not pinned)</div>
      </label>
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="range" id="popupOverlayOpacity" min="0" max="80" step="1" value="38" style="flex: 1; cursor: pointer;">
        <span id="popupOpacityValue" style="color: #5dade2; font-weight: 600; min-width: 40px;">38%</span>
      </div>
    </div>
    
    <!-- Dock Side -->
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #3d5266;">
      <label style="display: block; margin-bottom: 10px;">
        <div style="font-weight: 600; margin-bottom: 4px;">Dock side</div>
        <div style="font-size: 12px; color: #95a5a6;">Choose default dock side</div>
      </label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="dock-btn" data-side="left" style="padding: 10px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s; font-weight: 500;">Left</button>
        <button class="dock-btn" data-side="right" style="padding: 10px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s; font-weight: 500;">Right</button>
      </div>
    </div>
    
    <!-- Theme -->
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 10px;">
        <div style="font-weight: 600; margin-bottom: 4px;">Theme</div>
        <div style="font-size: 12px; color: #95a5a6;">Choose appearance theme for all pages</div>
      </label>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <button class="theme-btn" data-theme="system" style="padding: 10px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s; font-weight: 500;">System</button>
        <button class="theme-btn" data-theme="light" style="padding: 10px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s; font-weight: 500;">Light</button>
        <button class="theme-btn" data-theme="dark" style="padding: 10px 12px; border: 1px solid #4a5f7f; border-radius: 6px; background: #34495e; color: #ecf0f1; cursor: pointer; transition: all 0.2s; font-weight: 500;">Dark</button>
      </div>
    </div>
    
    <div style="display: flex; gap: 10px; margin-top: 20px;">
      <button class="close-modal-btn" style="flex: 1; padding: 10px; background: #34495e; border: 1px solid #4a5f7f; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-weight: 500;">Close</button>
      <button class="save-settings-btn" style="flex: 1; padding: 10px; background: #5dade2; border: 1px solid #5dade2; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">Save</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Load saved settings
  chrome.storage.local.get(['afc_overlay_opacity', 'afc_dock_side', 'afc_theme', 'afc_image_alt_click'], (result) => {
    const opacity = result.afc_overlay_opacity || 0.38;
    const dockSide = result.afc_dock_side || 'right';
    const theme = result.afc_theme || 'light';
    const enableAltClick = result.afc_image_alt_click !== false;

    // Set image hover settings (Alt+Click toggle)
    document.querySelectorAll('.altclick-btn').forEach(btn => {
      if ((enableAltClick && btn.getAttribute('data-value') === 'on') || (!enableAltClick && btn.getAttribute('data-value') === 'off')) {
        btn.style.background = '#5dade2';
        btn.style.borderColor = '#5dade2';
      }
    });
    
    // Set opacity
    const opacitySlider = document.getElementById('popupOverlayOpacity');
    const opacityValue = document.getElementById('popupOpacityValue');
    opacitySlider.value = Math.round(opacity * 100);
    opacityValue.textContent = Math.round(opacity * 100) + '%';
    
    // Set dock side
    document.querySelectorAll('.dock-btn').forEach(btn => {
      if (btn.getAttribute('data-side') === dockSide) {
        btn.style.background = '#5dade2';
        btn.style.borderColor = '#5dade2';
      }
    });
    
    // Set theme
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.style.background = '#5dade2';
        btn.style.borderColor = '#5dade2';
      }
    });
  });
  
  // Opacity slider
  document.getElementById('popupOverlayOpacity').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('popupOpacityValue').textContent = value + '%';
  });
  
  // Dock side buttons
  document.querySelectorAll('.dock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.dock-btn').forEach(b => {
        b.style.background = '#34495e';
        b.style.borderColor = '#4a5f7f';
      });
      e.target.style.background = '#5dade2';
      e.target.style.borderColor = '#5dade2';
    });
  });
  
  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-btn').forEach(b => {
        b.style.background = '#34495e';
        b.style.borderColor = '#4a5f7f';
      });
      e.target.style.background = '#5dade2';
      e.target.style.borderColor = '#5dade2';
    });
  });

  // Alt+Click toggle buttons
  document.querySelectorAll('.altclick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.altclick-btn').forEach(b => {
        b.style.background = '#34495e';
        b.style.borderColor = '#4a5f7f';
      });
      e.target.style.background = '#5dade2';
      e.target.style.borderColor = '#5dade2';
    });
  });
  
  // Save settings
  document.querySelector('.save-settings-btn').addEventListener('click', () => {
    const opacity = parseFloat(document.getElementById('popupOverlayOpacity').value) / 100;
    const dockSide = document.querySelector('.dock-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-side') || 'right';
    const theme = document.querySelector('.theme-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-theme') || 'light';
    const enableAltClick = document.querySelector('.altclick-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-value') === 'on';
    
    // Save to storage
    chrome.storage.local.set({
      afc_overlay_opacity: opacity,
      afc_dock_side: dockSide,
      afc_theme: theme,
      afc_image_alt_click: enableAltClick
    });
    
    // Notify sidebar to update (if it's open)
    try {
      // Try to send message to all tabs (sidebar might be in an iframe)
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: { opacity, dockSide, theme }
          }).catch(() => {
            // Tab might not have content script
          });
          
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateImageHoverSettings',
            settings: { enableAltClick }
          }).catch(() => {});
        });
      });
    } catch (e) {}
    
    overlay.remove();
    showNotification('Settings saved!', 'success');
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

// Show Image Occlusion Menu
function showImageOcclusionMenu() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
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
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: 1px solid #ff7eb3;
      border-radius: 12px;
      padding: 30px;
      width: 90%;
      max-width: 350px;
      color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
      <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">🖼️</div>
      <h2 style="font-size: 20px; margin: 0 0 20px 0; text-align: center;">Image Occlusion</h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="io-option" data-action="capture-area" style="padding: 12px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;">
          📐 Chụp một vùng
        </button>
        <button class="io-option" data-action="capture-page" style="padding: 12px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;">
          📱 Chụp toàn bộ trang
        </button>
        <button class="io-option" data-action="open-editor" style="padding: 12px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;">
          ✏️ Mở Editor
        </button>
        <button class="io-cancel" style="padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; margin-top: 10px;">
          Hủy
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Handle option clicks
    modal.querySelectorAll('.io-option').forEach(btn => {
      btn.addEventListener('mouseenter', (e) => {
        e.target.style.background = 'rgba(255,255,255,0.3)';
        e.target.style.transform = 'translateY(-2px)';
      });
      btn.addEventListener('mouseleave', (e) => {
        e.target.style.background = 'rgba(255,255,255,0.2)';
        e.target.style.transform = 'translateY(0)';
      });
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        overlay.remove();
        resolve(action);
      });
    });
    
    // Handle cancel
    modal.querySelector('.io-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });
  });
}
