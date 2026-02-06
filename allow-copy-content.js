// Allow Copy Content Script - Cho phép copy và chuột phải
(function() {
  'use strict';

  let isEnabled = true;
  let styleElement = null;
  let observer = null;

  // Lấy trạng thái từ storage
  chrome.storage.local.get(['allowCopyEnabled'], (result) => {
    isEnabled = result.allowCopyEnabled !== false;
    if (isEnabled) {
      enableCopy();
    }
  });

  // Lắng nghe message từ background để bật/tắt ngay lập tức
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleAllowCopy') {
      isEnabled = request.enabled;
      if (isEnabled) {
        enableCopy();
        console.log('Allow Copy: Đã kích hoạt');
      } else {
        disableCopy();
        console.log('Allow Copy: Đã tắt');
      }
      sendResponse({ success: true });
    }
  });

  // Lắng nghe thay đổi trong storage
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.allowCopyEnabled) {
      isEnabled = changes.allowCopyEnabled.newValue;
      if (isEnabled) {
        enableCopy();
      } else {
        disableCopy();
      }
    }
  });

  function enableCopy() {
    // Loại bỏ các sự kiện ngăn chặn copy
    const events = [
      'copy', 'cut', 'paste',
      'contextmenu',
      'selectstart', 'select',
      'mousedown', 'mouseup',
      'mousemove',
      'keydown', 'keypress', 'keyup',
      'beforecopy', 'beforecut', 'beforepaste'
    ];

    // Xóa tất cả các event listener ngăn chặn
    events.forEach(event => {
      document.addEventListener(event, function(e) {
        e.stopPropagation();
      }, true);
    });

    // Loại bỏ user-select: none
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'allow-copy-style';
      styleElement.textContent = `
        * {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
        
        *::selection {
          background-color: #b3d4fc !important;
          color: inherit !important;
        }
        
        *::-moz-selection {
          background-color: #b3d4fc !important;
          color: inherit !important;
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Loại bỏ oncopy, oncontextmenu, onselectstart từ các elements
    const removeProtection = () => {
      document.querySelectorAll('*').forEach(element => {
        element.oncopy = null;
        element.oncut = null;
        element.onpaste = null;
        element.oncontextmenu = null;
        element.onselectstart = null;
        element.ondragstart = null;
        element.onmousedown = null;
        element.onmouseup = null;
      });

      // Loại bỏ style ngăn chặn
      document.querySelectorAll('[style*="user-select"]').forEach(element => {
        element.style.userSelect = 'text';
        element.style.webkitUserSelect = 'text';
        element.style.mozUserSelect = 'text';
        element.style.msUserSelect = 'text';
      });
    };

    // Chạy ngay lập tức
    removeProtection();

    // Chạy lại khi DOM thay đổi
    if (observer) {
      observer.disconnect();
    }
    observer = new MutationObserver(removeProtection);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['oncopy', 'oncontextmenu', 'onselectstart', 'style']
    });

    // Loại bỏ các script chặn copy
    document.addEventListener('DOMContentLoaded', removeProtection);
    window.addEventListener('load', removeProtection);

    // Override các hàm JavaScript có thể chặn copy
    try {
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = function(type, listener, options) {
        if (events.includes(type)) {
          // Không cho phép thêm listener ngăn chặn copy
          return;
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    } catch (e) {
      // Ignore errors
    }

    console.log('Allow Copy: Đã kích hoạt');
  }

  function disableCopy() {
    // Xóa style element
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
      styleElement = null;
    }

    // Ngắt kết nối observer
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    console.log('Allow Copy: Đã tắt');
  }
})();
