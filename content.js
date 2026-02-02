// Biến global để theo dõi sidebar
let sidebarIframe = null;

// Inject sidebar vào trang
function createSidebar() {
  if (sidebarIframe) {
    return; // Sidebar đã tồn tại
  }

  // Tạo iframe cho sidebar
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'addflashcard-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
  sidebarIframe.style.cssText = `
    position: fixed;
    top: 0;
    right: -420px;
    width: 420px;
    height: 100%;
    border: none;
    z-index: 2147483647;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
    transition: right 0.3s ease-in-out;
  `;
  
  document.body.appendChild(sidebarIframe);
}

// Mở sidebar
function openSidebar() {
  if (!sidebarIframe) {
    createSidebar();
    // Đợi iframe load xong
    setTimeout(() => {
      if (sidebarIframe) {
        sidebarIframe.style.right = '0';
      }
    }, 100);
  } else {
    sidebarIframe.style.right = '0';
  }
}

// Đóng sidebar
function closeSidebar() {
  if (sidebarIframe) {
    sidebarIframe.style.right = '-420px';
  }
}

// Lắng nghe message từ background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSidebarWithContent") {
    openSidebar();
    
    // Đợi sidebar load xong rồi gửi content
    setTimeout(() => {
      if (sidebarIframe && sidebarIframe.contentWindow) {
        const content = message.content;
        
        // Convert to the same format as Alt+A/Alt+B
        // Prefer dataHtml (rich formatting) over dataText (plain)
        const htmlContent = content.dataHtml || content.data || '';
        
        if (content.type === 'sendToFront') {
          sidebarIframe.contentWindow.postMessage({
            action: "addToFront",
            content: htmlContent,
            isHtml: !!content.dataHtml  // true if we have HTML, false if plain text
          }, '*');
        } else if (content.type === 'sendToBack') {
          sidebarIframe.contentWindow.postMessage({
            action: "addToBack",
            content: htmlContent,
            isHtml: !!content.dataHtml
          }, '*');
        }
      }
    }, 200);
  }

  // Open sidebar and switch it to Edit mode with provided card data.
  // Used when clicking Edit in manage.html.
  if (message.action === 'openSidebarForEdit' && message.card) {
    openSidebar();

    // Wait for iframe to be ready then post edit payload.
    setTimeout(() => {
      if (sidebarIframe && sidebarIframe.contentWindow) {
        sidebarIframe.contentWindow.postMessage({
          action: 'editCard',
          card: message.card
        }, '*');
      }
    }, 250);
  }
  
  if (message.action === "closeSidebar") {
    closeSidebar();
  }
  
  if (message.action === "toggleSidebar") {
    if (sidebarIframe && sidebarIframe.style.right === '0px') {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
  
  return true;
});

// Lắng nghe message từ sidebar iframe
window.addEventListener('message', (event) => {
  // Kiểm tra nguồn gốc message
  if (event.source === sidebarIframe?.contentWindow) {
    if (event.data.action === "closeSidebar") {
      closeSidebar();
    } else if (event.data.action === "openManagePage") {
      chrome.runtime.sendMessage({ action: "openManagePage" });
    }
  }
});

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt+Q: Toggle sidebar
  if (e.altKey && e.key.toLowerCase() === 'q') {
    e.preventDefault();
    if (sidebarIframe && sidebarIframe.style.right === '0px') {
      closeSidebar();
    } else {
      openSidebar();
    }
    return;
  }
  
  // Alt+A: Send selected content to Front field (with formatting)
  if (e.altKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    
    // Get rich HTML selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      
      // Normalize relative URLs
      const makeAbs = (url) => {
        try { return new URL(url, location.href).href; } catch { return url; }
      };
      container.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', makeAbs(a.getAttribute('href'))));
      container.querySelectorAll('img[src]').forEach(img => img.setAttribute('src', makeAbs(img.getAttribute('src'))));
      container.querySelectorAll('video[src]').forEach(v => v.setAttribute('src', makeAbs(v.getAttribute('src'))));
      container.querySelectorAll('source[src]').forEach(s => s.setAttribute('src', makeAbs(s.getAttribute('src'))));
      
      const htmlContent = container.innerHTML;
      const textContent = selection.toString().trim();
      
      if (htmlContent || textContent) {
        if (!sidebarIframe) {
          createSidebar();
          setTimeout(() => {
            if (sidebarIframe) {
              sidebarIframe.style.right = '0';
              setTimeout(() => {
                sidebarIframe.contentWindow.postMessage({
                  action: "addToFront",
                  content: htmlContent || textContent,
                  isHtml: true
                }, '*');
              }, 200);
            }
          }, 100);
        } else {
          openSidebar();
          setTimeout(() => {
            sidebarIframe.contentWindow.postMessage({
              action: "addToFront",
              content: htmlContent || textContent,
              isHtml: true
            }, '*');
          }, 100);
        }
      }
    }
    return;
  }
  
  // Alt+B: Send selected content to Back field (with formatting)
  if (e.altKey && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    
    // Get rich HTML selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      
      // Normalize relative URLs
      const makeAbs = (url) => {
        try { return new URL(url, location.href).href; } catch { return url; }
      };
      container.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', makeAbs(a.getAttribute('href'))));
      container.querySelectorAll('img[src]').forEach(img => img.setAttribute('src', makeAbs(img.getAttribute('src'))));
      container.querySelectorAll('video[src]').forEach(v => v.setAttribute('src', makeAbs(v.getAttribute('src'))));
      container.querySelectorAll('source[src]').forEach(s => s.setAttribute('src', makeAbs(s.getAttribute('src'))));
      
      const htmlContent = container.innerHTML;
      const textContent = selection.toString().trim();
      
      if (htmlContent || textContent) {
        if (!sidebarIframe) {
          createSidebar();
          setTimeout(() => {
            if (sidebarIframe) {
              sidebarIframe.style.right = '0';
              setTimeout(() => {
                sidebarIframe.contentWindow.postMessage({
                  action: "addToBack",
                  content: htmlContent || textContent,
                  isHtml: true
                }, '*');
              }, 200);
            }
          }, 100);
        } else {
          openSidebar();
          setTimeout(() => {
            sidebarIframe.contentWindow.postMessage({
              action: "addToBack",
              content: htmlContent || textContent,
              isHtml: true
            }, '*');
          }, 100);
        }
      }
    }
    return;
  }
});

console.log('AddFlashcard content script loaded');
