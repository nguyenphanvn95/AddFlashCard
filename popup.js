// Popup.js - Enhanced with Allow Copy submenu v2.8.0

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  setupEventListeners();
  setupSettingsModal();
  setupAboutModal();
  updateUI();
});

async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['cards']);
    const cards = result.cards || [];
    const today = new Date().toDateString();
    
    document.getElementById('total-cards').textContent = cards.length;
    
    const todayCards = cards.filter(card => {
      const cardDate = new Date(card.created || 0).toDateString();
      return cardDate === today;
    }).length;
    
    document.getElementById('today-cards').textContent = todayCards;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function setupEventListeners() {
  document.getElementById('add-card-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
        window.close();
      } catch (error) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 300));
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
          window.close();
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError);
          window.close();
        }
      }
    } else {
      window.close();
    }
  });
  
  document.getElementById('manage-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html') });
    window.close();
  });
  
  document.getElementById('study-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('study.html') });
    window.close();
  });
  
  document.getElementById('pdf-viewer-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pdf-viewer.html') });
    window.close();
  });
  
  document.getElementById('image-occlusion-btn').addEventListener('click', async () => {
    const action = await showImageOcclusionMenu();
    if (action === 'capture-area') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
      }
      window.close();
    } else if (action === 'capture-page') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          chrome.tabs.sendMessage(tab.id, { action: 'showOverlayEditor', imageData: dataUrl, area: null });
        });
      }
      window.close();
    } else if (action === 'open-editor') {
      chrome.tabs.create({ url: chrome.runtime.getURL('image-occlusion-editor.html') });
      window.close();
    }
  });
  
  // NEW: Allow Copy with submenu
  document.getElementById('allow-copy-btn').addEventListener('click', async () => {
    const action = await showAllowCopyMenu();
    if (action === 'toggle') {
      const result = await chrome.storage.local.get(['allowCopyEnabled']);
      const currentEnabled = result.allowCopyEnabled !== false;
      const newEnabled = !currentEnabled;
      
      await chrome.storage.local.set({ allowCopyEnabled: newEnabled });
      chrome.runtime.sendMessage({ 
        action: 'toggleAllowCopy', 
        enabled: newEnabled 
      });
      
      showNotification(newEnabled ? 'Allow Copy: BẬT' : 'Allow Copy: TẮT', 'success');
      window.close();
    } else if (action === 'add-current') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        try {
          const url = new URL(tab.url);
          const domain = url.hostname;
          
          const result = await chrome.storage.local.get(['allowCopyWhitelist']);
          const whitelist = result.allowCopyWhitelist || [];
          
          if (!whitelist.includes(domain)) {
            whitelist.push(domain);
            await chrome.storage.local.set({ allowCopyWhitelist: whitelist });
            showNotification(`Đã thêm ${domain}`, 'success');
          } else {
            showNotification('Domain đã có trong danh sách', 'info');
          }
        } catch (e) {
          showNotification('Không thể lấy domain', 'error');
        }
      }
      window.close();
    } else if (action === 'manage') {
      chrome.tabs.create({ url: chrome.runtime.getURL('allow-copy-popup.html') });
      window.close();
    }
  });
  
  document.getElementById('settings-btn').addEventListener('click', () => {
    openSettingsModal();
  });
  
  document.getElementById('help-btn').addEventListener('click', () => {
    openAboutModal();
  });
  
  document.getElementById('notion-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/nguyenphanvn95/' });
    window.close();
  });
}

function updateUI() {
  const buttons = document.querySelectorAll('.action-btn');
  buttons.forEach((btn, index) => {
    btn.style.animationDelay = `${index * 0.05}s`;
    btn.classList.add('fade-in');
  });
}

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

const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-50px); opacity: 0; }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fade-in 0.3s ease-out forwards; }
`;
document.head.appendChild(style);

function setupSettingsModal() {}

function openSettingsModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #2c3e50; border: 1px solid #3d5266;
    border-radius: 12px; padding: 20px;
    width: 90%; max-width: 450px;
    color: #ecf0f1;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;
  
  chrome.storage.local.get(['afc_overlay_opacity', 'afc_dock_side', 'afc_theme', 'afc_image_alt_click'], (result) => {
    const opacity = (result.afc_overlay_opacity || 0.4) * 100;
    const dockSide = result.afc_dock_side || 'right';
    const theme = result.afc_theme || 'light';
    const enableAltClick = result.afc_image_alt_click !== false;
    
    modal.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #5dade2;">⚙️ Cài đặt</h2>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #bdc3c7;">
          Độ mờ overlay (${opacity}%)
        </label>
        <input type="range" id="popupOverlayOpacity" min="0" max="100" value="${opacity}" 
          style="width: 100%; height: 6px; border-radius: 3px; background: #34495e; outline: none; cursor: pointer;">
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #bdc3c7;">Vị trí sidebar</label>
        <div style="display: flex; gap: 10px;">
          <button class="dock-btn" data-side="left" style="flex: 1; padding: 10px; background: ${dockSide === 'left' ? '#5dade2' : '#34495e'}; 
            border: 1px solid ${dockSide === 'left' ? '#5dade2' : '#4a5f7f'}; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-size: 13px;">
            ⬅️ Trái
          </button>
          <button class="dock-btn" data-side="right" style="flex: 1; padding: 10px; background: ${dockSide === 'right' ? '#5dade2' : '#34495e'}; 
            border: 1px solid ${dockSide === 'right' ? '#5dade2' : '#4a5f7f'}; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-size: 13px;">
            ➡️ Phải
          </button>
        </div>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #bdc3c7;">Theme</label>
        <div style="display: flex; gap: 10px;">
          <button class="theme-btn" data-theme="light" style="flex: 1; padding: 10px; background: ${theme === 'light' ? '#5dade2' : '#34495e'}; 
            border: 1px solid ${theme === 'light' ? '#5dade2' : '#4a5f7f'}; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-size: 13px;">
            ☀️ Sáng
          </button>
          <button class="theme-btn" data-theme="dark" style="flex: 1; padding: 10px; background: ${theme === 'dark' ? '#5dade2' : '#34495e'}; 
            border: 1px solid ${theme === 'dark' ? '#5dade2' : '#4a5f7f'}; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-size: 13px;">
            🌙 Tối
          </button>
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #bdc3c7;">Alt + Click để lấy ảnh</label>
        <div style="display: flex; gap: 10px;">
          <button class="altclick-btn" data-value="on" style="flex: 1; padding: 10px; background: ${enableAltClick ? '#5dade2' : '#34495e'}; 
            border: 1px solid ${enableAltClick ? '#5dade2' : '#4a5f7f'}; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-size: 13px;">
            ✅ Bật
          </button>
          <button class="altclick-btn" data-value="off" style="flex: 1; padding: 10px; background: ${!enableAltClick ? '#5dade2' : '#34495e'}; 
            border: 1px solid ${!enableAltClick ? '#5dade2' : '#4a5f7f'}; border-radius: 6px; color: #ecf0f1; cursor: pointer; font-size: 13px;">
            ❌ Tắt
          </button>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="close-modal-btn" style="flex: 1; padding: 10px; background: #34495e; border: 1px solid #4a5f7f; 
          border-radius: 6px; color: #ecf0f1; cursor: pointer; font-weight: 500;">Hủy</button>
        <button class="save-settings-btn" style="flex: 1; padding: 10px; background: #27ae60; border: 1px solid #27ae60; 
          border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">Lưu</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const opacitySlider = document.getElementById('popupOverlayOpacity');
    const opacityLabel = modal.querySelector('label');
    opacitySlider.addEventListener('input', (e) => {
      opacityLabel.textContent = `Độ mờ overlay (${e.target.value}%)`;
    });
    
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
    
    document.querySelector('.save-settings-btn').addEventListener('click', () => {
      const opacity = parseFloat(document.getElementById('popupOverlayOpacity').value) / 100;
      const dockSide = document.querySelector('.dock-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-side') || 'right';
      const theme = document.querySelector('.theme-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-theme') || 'light';
      const enableAltClick = document.querySelector('.altclick-btn[style*="rgb(93, 173, 226)"]')?.getAttribute('data-value') === 'on';
      
      chrome.storage.local.set({
        afc_overlay_opacity: opacity,
        afc_dock_side: dockSide,
        afc_theme: theme,
        afc_image_alt_click: enableAltClick
      });
      
      try {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'settingsUpdated',
              settings: { opacity, dockSide, theme }
            }).catch(() => {});
            
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
    
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => overlay.remove());
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  });
}

function setupAboutModal() {}

function openAboutModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border: 1px solid #3d5266; border-radius: 12px; padding: 30px;
    width: 90%; max-width: 380px; color: #ecf0f1;
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
        <span style="color: #95a5a6;">Phiên bản:</span> <span style="color: #5dade2; font-weight: 600;">2.8.0</span>
      </p>
      <p style="margin: 8px 0; font-size: 13px;">
        <span style="color: #95a5a6;">Tác giả:</span> <span style="color: #ecf0f1;">Nguyễn Văn Phán</span>
      </p>
      <p style="margin: 8px 0; font-size: 13px;">
        <span style="color: #95a5a6;">Website:</span> 
        <a href="https://github.com/nguyenphanvn95/AddFlashCard" target="_blank" style="color: #5dade2; text-decoration: none;">GitHub</a>
      </p>
      <p style="margin: 8px 0; font-size: 13px;">
        <span style="color: #95a5a6;"></span> 
        <a href="huong-dan-su-dung.html" target="_blank" style="color: #5dade2; text-decoration: none;">Hướng dẫn sử dụng</a>
      </p>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="close-about-btn" style="flex: 1; padding: 10px; background: #34495e; border: 1px solid #4a5f7f; 
        border-radius: 6px; color: #ecf0f1; cursor: pointer; font-weight: 500;">Đóng</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  document.querySelector('.close-about-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function showImageOcclusionMenu() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: 1px solid #ff7eb3; border-radius: 12px; padding: 30px;
      width: 90%; max-width: 350px; color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
      <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">🖼️</div>
      <h2 style="font-size: 20px; margin: 0 0 20px 0; text-align: center;">Image Occlusion</h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="io-option" data-action="capture-area" style="padding: 12px; background: rgba(255,255,255,0.2); 
          border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; 
          font-weight: 500; transition: all 0.3s;">📐 Chụp một vùng</button>
        <button class="io-option" data-action="capture-page" style="padding: 12px; background: rgba(255,255,255,0.2); 
          border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; 
          font-weight: 500; transition: all 0.3s;">📱 Chụp toàn bộ trang</button>
        <button class="io-option" data-action="open-editor" style="padding: 12px; background: rgba(255,255,255,0.2); 
          border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; 
          font-weight: 500; transition: all 0.3s;">✏️ Mở Editor</button>
        <button class="io-cancel" style="padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); 
          border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; margin-top: 10px;">Hủy</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
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
        overlay.remove();
        resolve(e.target.dataset.action);
      });
    });
    
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

// NEW: Allow Copy Menu
function showAllowCopyMenu() {
  return new Promise(async (resolve) => {
    const result = await chrome.storage.local.get(['allowCopyEnabled', 'allowCopyWhitelist']);
    const enabled = result.allowCopyEnabled !== false;
    const whitelist = result.allowCopyWhitelist || [];
    
    let currentDomain = '';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        currentDomain = url.hostname;
      }
    } catch (e) {}
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      border: 1px solid #22d3ee; border-radius: 12px; padding: 30px;
      width: 90%; max-width: 350px; color: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    const isInWhitelist = currentDomain && whitelist.includes(currentDomain);
    
    modal.innerHTML = `
      <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">📋</div>
      <h2 style="font-size: 20px; margin: 0 0 20px 0; text-align: center;">Allow Copy</h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="ac-option" data-action="toggle" style="padding: 12px; background: rgba(255,255,255,0.2); 
          border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; 
          font-weight: 500; transition: all 0.3s;">
          ${enabled ? '🔴 Tắt' : '🟢 Bật'} Allow Copy
        </button>
        ${currentDomain && !isInWhitelist ? `
          <button class="ac-option" data-action="add-current" style="padding: 12px; background: rgba(255,255,255,0.2); 
            border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; 
            font-weight: 500; transition: all 0.3s;">➕ Thêm trang hiện tại</button>
        ` : ''}
        ${currentDomain && isInWhitelist ? `
          <div style="padding: 10px; background: rgba(255,255,255,0.15); border-radius: 8px; font-size: 13px; text-align: center;">
            ✅ Trang hiện tại đã có trong danh sách
          </div>
        ` : ''}
        <button class="ac-option" data-action="manage" style="padding: 12px; background: rgba(255,255,255,0.2); 
          border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 14px; 
          font-weight: 500; transition: all 0.3s;">⚙️ Quản lý danh sách</button>
        <button class="ac-cancel" style="padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); 
          border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500; margin-top: 10px;">Hủy</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    modal.querySelectorAll('.ac-option').forEach(btn => {
      btn.addEventListener('mouseenter', (e) => {
        e.target.style.background = 'rgba(255,255,255,0.3)';
        e.target.style.transform = 'translateY(-2px)';
      });
      btn.addEventListener('mouseleave', (e) => {
        e.target.style.background = 'rgba(255,255,255,0.2)';
        e.target.style.transform = 'translateY(0)';
      });
      btn.addEventListener('click', (e) => {
        overlay.remove();
        resolve(e.target.dataset.action);
      });
    });
    
    modal.querySelector('.ac-cancel').addEventListener('click', () => {
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
