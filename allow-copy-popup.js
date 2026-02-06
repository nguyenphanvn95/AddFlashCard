// Allow Copy Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggle-switch');
  const statusText = document.getElementById('status-text');
  const currentUrlDiv = document.getElementById('current-url');
  const addToWhitelistBtn = document.getElementById('add-to-whitelist');
  const whitelistContainer = document.getElementById('whitelist-container');
  const exportDomainsBtn = document.getElementById('export-domains-btn');
  const importDomainsBtn = document.getElementById('import-domains-btn');
  const importDomainsInput = document.getElementById('import-domains-input');

  let currentUrl = '';
  let currentDomain = '';

  // Lấy URL của tab hiện tại
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentUrl = tabs[0].url;
      try {
        const url = new URL(currentUrl);
        currentDomain = url.hostname;
        currentUrlDiv.textContent = currentDomain;
      } catch (e) {
        currentUrlDiv.textContent = 'Không hợp lệ';
        addToWhitelistBtn.disabled = true;
      }
    }
  });

  // Lấy trạng thái hiện tại
  chrome.storage.local.get(['allowCopyEnabled', 'allowCopyWhitelist'], (result) => {
    const enabled = result.allowCopyEnabled !== false;
    const whitelist = result.allowCopyWhitelist || [];
    
    toggleSwitch.checked = enabled;
    updateStatusText(enabled);
    displayWhitelist(whitelist);
  });

  // Xử lý toggle switch - áp dụng ngay lập tức
  toggleSwitch.addEventListener('change', () => {
    const enabled = toggleSwitch.checked;
    chrome.storage.local.set({ allowCopyEnabled: enabled }, () => {
      updateStatusText(enabled);
      
      // Gửi message tới background để áp dụng ngay
      chrome.runtime.sendMessage({ 
        action: 'toggleAllowCopy', 
        enabled: enabled 
      });
      
      showNotification(enabled ? 'Đã bật - áp dụng ngay!' : 'Đã tắt - áp dụng ngay!');
    });
  });

  // Xử lý thêm vào whitelist
  addToWhitelistBtn.addEventListener('click', () => {
    if (!currentDomain) return;

    chrome.storage.local.get(['allowCopyWhitelist'], (result) => {
      const whitelist = result.allowCopyWhitelist || [];
      
      if (!whitelist.includes(currentDomain)) {
        whitelist.push(currentDomain);
        chrome.storage.local.set({ allowCopyWhitelist: whitelist }, () => {
          displayWhitelist(whitelist);
          showNotification('Đã thêm vào danh sách!');
        });
      } else {
        showNotification('Trang này đã có trong danh sách!');
      }
    });
  });

  // Export domains to JSON file
  exportDomainsBtn.addEventListener('click', () => {
    chrome.storage.local.get(['allowCopyWhitelist'], (result) => {
      const whitelist = result.allowCopyWhitelist || [];
      
      const data = {
        domains: whitelist,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `domains-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification('Đã xuất danh sách domains!');
    });
  });

  // Import domains from JSON file
  importDomainsBtn.addEventListener('click', () => {
    importDomainsInput.click();
  });

  importDomainsInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (!data.domains || !Array.isArray(data.domains)) {
          alert('File không đúng định dạng!');
          return;
        }

        chrome.storage.local.get(['allowCopyWhitelist'], (result) => {
          const currentWhitelist = result.allowCopyWhitelist || [];
          
          // Merge with existing domains (avoid duplicates)
          const mergedWhitelist = [...new Set([...currentWhitelist, ...data.domains])];
          
          if (confirm(`Import ${data.domains.length} domains? Sẽ merge với danh sách hiện tại.`)) {
            chrome.storage.local.set({ allowCopyWhitelist: mergedWhitelist }, () => {
              displayWhitelist(mergedWhitelist);
              showNotification(`Đã import ${data.domains.length} domains!`);
            });
          }
        });
      } catch (error) {
        alert('Lỗi đọc file: ' + error.message);
      }
    };

    reader.readAsText(file);
    importDomainsInput.value = '';
  });

  // Hiển thị whitelist
  function displayWhitelist(whitelist) {
    if (!whitelist || whitelist.length === 0) {
      whitelistContainer.innerHTML = '<p class="empty-state">Chưa có trang web nào trong danh sách</p>';
      return;
    }

    whitelistContainer.innerHTML = '';
    whitelist.forEach((domain) => {
      const item = document.createElement('div');
      item.className = 'whitelist-item';
      
      const urlSpan = document.createElement('span');
      urlSpan.className = 'whitelist-item-url';
      urlSpan.textContent = domain;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = 'Xóa';
      removeBtn.addEventListener('click', () => {
        removeFromWhitelist(domain, whitelist);
      });
      
      item.appendChild(urlSpan);
      item.appendChild(removeBtn);
      whitelistContainer.appendChild(item);
    });
  }

  // Xóa khỏi whitelist
  function removeFromWhitelist(domain, currentWhitelist) {
    const newWhitelist = currentWhitelist.filter(d => d !== domain);
    chrome.storage.local.set({ allowCopyWhitelist: newWhitelist }, () => {
      displayWhitelist(newWhitelist);
      showNotification('Đã xóa khỏi danh sách!');
    });
  }

  // Cập nhật text trạng thái
  function updateStatusText(enabled) {
    if (enabled) {
      statusText.textContent = 'Đang bật';
      statusText.classList.remove('disabled');
    } else {
      statusText.textContent = 'Đã tắt';
      statusText.classList.add('disabled');
    }
  }

  // Hiển thị thông báo
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  // CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
});
