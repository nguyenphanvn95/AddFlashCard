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
        sidebarIframe.contentWindow.postMessage({
          action: "addContent",
          content: message.content
        }, '*');
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

console.log('AddFlashcard content script loaded');
