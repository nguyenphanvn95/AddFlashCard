// Biến global để theo dõi sidebar
let sidebarHost = null;   // host element living in Shadow DOM
let sidebarShadow = null; // shadow root
let sidebarIframe = null;
let sidebarOverlay = null; // dim background overlay
let isPinned = false; // pinned sidebar state
let dockSide = "right"; // "right" | "left"
let overlayOpacity = 0.38; // 0..0.8

// Sidebar sizing (keep in sync with CSS below)
const SIDEBAR_WIDTH = 420;

// Inject sidebar vào trang
function getOpenTransform() {
  return 'translateX(0px)';
}
function getClosedTransform() {
  // When docked right, move out to the right; when left, move out to the left
  return dockSide === 'left' ? `translateX(-${SIDEBAR_WIDTH}px)` : `translateX(${SIDEBAR_WIDTH}px)`;
}
function applyDockSide() {
  if (!sidebarHost || !sidebarShadow) return;

  // Host positioning
  sidebarHost.style.right = dockSide === 'right' ? '0' : 'auto';
  sidebarHost.style.left  = dockSide === 'left'  ? '0' : 'auto';

  // Update wrap positioning and box shadow direction via CSS variables
  const wrap = sidebarShadow.querySelector('.wrap');
  if (wrap) {
    if (dockSide === 'left') {
      wrap.style.left = '0';
      wrap.style.right = 'auto';
      wrap.style.boxShadow = '4px 0 20px rgba(0, 0, 0, 0.3)';
    } else {
      wrap.style.right = '0';
      wrap.style.left = 'auto';
      wrap.style.boxShadow = '-4px 0 20px rgba(0, 0, 0, 0.3)';
    }
  }

  // Keep current open/closed state consistent
  const isOpen = sidebarHost.style.pointerEvents === 'auto' && sidebarHost.style.transform === getOpenTransform();
  sidebarHost.style.transform = isOpen ? getOpenTransform() : getClosedTransform();
}
function applyOverlayOpacity() {
  if (!sidebarOverlay) return;
  const o = Math.max(0, Math.min(0.8, Number(overlayOpacity) || 0));
  sidebarOverlay.style.background = `rgba(0,0,0,${o})`;
}
async function loadUiSettings() {
  try {
    const res = await chrome.storage.local.get(['afc_sidebar_pinned','afc_overlay_opacity','afc_dock_side']);
    if (typeof res.afc_sidebar_pinned === 'boolean') isPinned = res.afc_sidebar_pinned;
    if (typeof res.afc_overlay_opacity !== 'undefined') {
      const v = Number(res.afc_overlay_opacity);
      if (!Number.isNaN(v)) overlayOpacity = v;
    }
    if (res.afc_dock_side === 'left' || res.afc_dock_side === 'right') dockSide = res.afc_dock_side;
  } catch (e) {}
}

function createSidebar() {
  if (sidebarIframe && sidebarHost) {
    return; // Sidebar đã tồn tại
  }

  // Host element (so website CSS can't affect our iframe)
  sidebarHost = document.createElement('div');
  sidebarHost.id = 'addflashcard-sidebar-host';
  sidebarHost.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    left: auto;
    width: ${SIDEBAR_WIDTH}px;
    height: 100%;
    z-index: 2147483647;
    pointer-events: none; /* enable only when open */
    transform: translateX(${SIDEBAR_WIDTH}px);
    transition: transform 0.3s ease-in-out;
  `;

  // Shadow root to isolate styles
  sidebarShadow = sidebarHost.attachShadow({ mode: 'open' });

  // Local styles inside shadow DOM
  const style = document.createElement('style');
  style.setAttribute('data-afc','host-style');
  style.textContent = `
    :host { all: initial; }
    .wrap {
      position: fixed;
      top: 0;
      bottom: 0;
      right: 0;
      left: auto;
      width: ${SIDEBAR_WIDTH}px;
      height: 100%;
      pointer-events: auto;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: transparent;
    }
  `;
  sidebarShadow.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Iframe for sidebar UI
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'addflashcard-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
  wrap.appendChild(sidebarIframe);
  sidebarShadow.appendChild(wrap);

  // Append to <html> so it still works on pages with body overflow tricks
  (document.documentElement || document.body).appendChild(sidebarHost);

  // Apply dock + initial closed transform
  applyDockSide();
  sidebarHost.style.transform = getClosedTransform();
}



function createOverlay() {
  if (sidebarOverlay) return;
  sidebarOverlay = document.createElement('div');
  sidebarOverlay.id = 'addflashcard-sidebar-overlay';
  sidebarOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.38);
    z-index: 2147483646;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
  `;
  sidebarOverlay.addEventListener('click', () => {
    // Click on dim background closes sidebar only when not pinned
    if (!isPinned) closeSidebar();
  });
  (document.documentElement || document.body).appendChild(sidebarOverlay);
  applyOverlayOpacity();
}


function showOverlay() {
  createOverlay();
  if (!sidebarOverlay) return;
  sidebarOverlay.style.opacity = '1';
  sidebarOverlay.style.pointerEvents = 'auto';
}

function hideOverlay() {
  if (!sidebarOverlay) return;
  sidebarOverlay.style.opacity = '0';
  sidebarOverlay.style.pointerEvents = 'none';
}

// Mở sidebar
function openSidebar() {
  if (!sidebarIframe) {
    createSidebar();
  applyDockSide();
    // Đợi iframe load xong
    setTimeout(() => {
      if (sidebarHost) {
        sidebarHost.style.pointerEvents = 'auto';
        sidebarHost.style.transform = getOpenTransform();
      }
    }, 100);
  } else {
    sidebarHost.style.pointerEvents = 'auto';
    sidebarHost.style.transform = getOpenTransform();
  }
  // Overlay dim background (only when not pinned)
  if (isPinned) {
    hideOverlay();
  } else {
    showOverlay();
  }

  // Sync pin state to iframe UI
  try {
    if (sidebarIframe && sidebarIframe.contentWindow) {
      sidebarIframe.contentWindow.postMessage({ action: 'setPinned', pinned: isPinned }, '*');
      sidebarIframe.contentWindow.postMessage({ action: 'setDockSide', side: dockSide }, '*');
      sidebarIframe.contentWindow.postMessage({ action: 'setOverlayOpacity', opacity: overlayOpacity }, '*');
    }
  } catch (e) {}

}

// Đóng sidebar
function closeSidebar() {
  hideOverlay();
  if (sidebarHost) {
    sidebarHost.style.transform = getClosedTransform();
    // After animation, disable pointer events so page is fully clickable
    setTimeout(() => {
      if (sidebarHost && sidebarHost.style.transform.includes(`${SIDEBAR_WIDTH}`)) {
        sidebarHost.style.pointerEvents = 'none';
      }
    }, 320);
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
    const isOpen = !!sidebarHost && sidebarHost.style.transform === getOpenTransform();
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
  
  // Handle settings updates from popup
  if (message.action === "settingsUpdated") {
    const settings = message.settings || {};
    if (settings.opacity !== undefined) {
      overlayOpacity = settings.opacity;
      try { sidebarIframe?.contentWindow?.postMessage({ action: 'setOverlayOpacity', opacity: overlayOpacity }, '*'); } catch (e) {}
      applyOverlayOpacity();
    }
    if (settings.dockSide) {
      dockSide = settings.dockSide;
      try { sidebarIframe?.contentWindow?.postMessage({ action: 'setDockSide', side: dockSide }, '*'); } catch (e) {}
      applyDockSide();
    }
    if (settings.theme) {
      try { sidebarIframe?.contentWindow?.postMessage({ action: 'setTheme', theme: settings.theme }, '*'); } catch (e) {}
    }
  }
  
  return true;
});

// Lắng nghe message từ sidebar iframe
window.addEventListener('message', (event) => {
  // Only accept messages from our sidebar iframe
  if (event.source !== sidebarIframe?.contentWindow) return;

  if (event.data?.action === "closeSidebar") {
    // Allow close only when not pinned (or when sidebar explicitly requests close after unpin)
    if (!isPinned) closeSidebar();
  } else if (event.data?.action === "openManagePage") {
    chrome.runtime.sendMessage({ action: "openManagePage" });
  } else if (event.data?.action === "togglePin") {
    isPinned = !!event.data.pinned;
    try { chrome.storage.local.set({ afc_sidebar_pinned: isPinned }); } catch (e) {}

    // Update overlay + keep open when pinned
    if (isPinned) {
      openSidebar(); // ensures it's open and syncs UI
      hideOverlay();
    } else {
      // If sidebar is open, re-enable overlay
      const isOpen = !!sidebarHost && sidebarHost.style.transform === getOpenTransform();
      if (isOpen) showOverlay();
    }

    // Echo pin state back to iframe (in case it needs sync)
    try {
      sidebarIframe?.contentWindow?.postMessage({ action: 'setPinned', pinned: isPinned }, '*');
    } catch (e) {}
} else if (event.data?.action === "setOverlayOpacity") {
  const v = Number(event.data.opacity);
  if (!Number.isNaN(v)) {
    overlayOpacity = Math.max(0, Math.min(0.8, v));
    try { chrome.storage.local.set({ afc_overlay_opacity: overlayOpacity }); } catch (e) {}
    applyOverlayOpacity();
    // Sync back to iframe UI
    try { sidebarIframe?.contentWindow?.postMessage({ action: 'setOverlayOpacity', opacity: overlayOpacity }, '*'); } catch (e) {}
  }
} else if (event.data?.action === "toggleDock") {
  dockSide = dockSide === 'left' ? 'right' : 'left';
  try { chrome.storage.local.set({ afc_dock_side: dockSide }); } catch (e) {}
  applyDockSide();
  // If open and not pinned, overlay stays
  // Sync back to iframe UI
  try { sidebarIframe?.contentWindow?.postMessage({ action: 'setDockSide', side: dockSide }, '*'); } catch (e) {}
} else if (event.data?.action === "setDockSide") {
  const side = event.data.side;
  if (side === 'left' || side === 'right') {
    dockSide = side;
    try { chrome.storage.local.set({ afc_dock_side: dockSide }); } catch (e) {}
    applyDockSide();
    try { sidebarIframe?.contentWindow?.postMessage({ action: 'setDockSide', side: dockSide }, '*'); } catch (e) {}
  }
} else if (event.data?.action === "setTheme") {
  const theme = event.data.theme;
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    try { chrome.storage.local.set({ afc_theme: theme }); } catch (e) {}
    // Sync back to iframe UI
    try { sidebarIframe?.contentWindow?.postMessage({ action: 'setTheme', theme: theme }, '*'); } catch (e) {}
  }

  }
});



async function initUiState() {
  await loadUiSettings();
  // If pinned, restore sidebar on page load
  if (isPinned) {
    createSidebar();
    // Ensure dock + overlay settings applied
    applyDockSide();
    createOverlay();
    applyOverlayOpacity();
    // Open without dim overlay when pinned
    setTimeout(() => {
      openSidebar();
      hideOverlay();
    }, 50);
  }
}
initUiState();


// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt+Q: Toggle sidebar
  if (e.altKey && e.key.toLowerCase() === 'q') {
    e.preventDefault();
    const isOpen = !!sidebarHost && sidebarHost.style.transform === getOpenTransform();
    if (isOpen) {
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
            if (sidebarHost && sidebarIframe) {
              sidebarHost.style.pointerEvents = 'auto';
              sidebarHost.style.transform = getOpenTransform();
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
            if (sidebarHost && sidebarIframe) {
              sidebarHost.style.pointerEvents = 'auto';
              sidebarHost.style.transform = getOpenTransform();
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

// --- Area selection (triggered by background/popup) -----------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'startSelection') {
    startAreaSelection();
    sendResponse({ started: true });
  }
});

// Handle showOverlayEditor: display in-page editor and initialize canvas
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'showOverlayEditor') {
    const imageData = message.imageData;
    showOverlayEditorInPage(imageData);
    sendResponse({ shown: true });
  }
});


function afcSendOverlayCommand(cmdDetail, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const reqId = String(Date.now()) + '_' + Math.random().toString(16).slice(2);
    const detail = Object.assign({ reqId }, cmdDetail || {});
    let timer = null;

    function onResult(ev) {
      const d = (ev && ev.detail) ? ev.detail : {};
      if (d.reqId !== reqId) return;
      window.removeEventListener('AFC_OVERLAY_RESULT', onResult);
      if (timer) clearTimeout(timer);
      if (d.ok) resolve(d);
      else reject(new Error(d.message || 'Command failed'));
    }

    window.addEventListener('AFC_OVERLAY_RESULT', onResult);
    try {
      window.dispatchEvent(new CustomEvent('AFC_OVERLAY_CMD', { detail }));
    } catch (e) {
      window.removeEventListener('AFC_OVERLAY_RESULT', onResult);
      reject(e);
      return;
    }

    timer = setTimeout(() => {
      window.removeEventListener('AFC_OVERLAY_RESULT', onResult);
      reject(new Error('Timeout waiting for overlay response'));
    }, timeoutMs);
  });
}

async function ensureOverlayScriptInjected() {
  if (document.documentElement.getAttribute('data-afc-overlay-ready') === '1' && document.documentElement.getAttribute('data-afc-anki-export-ready') === '1') {
    return Promise.resolve();
  }

  // Inject required scripts into the page in order: JSZip, sql-wasm, anki-export, overlay editor
  const scripts = [
    'vendor/jszip.min.js',
    'vendor/sql-wasm.js',
    'anki-export-unified.js',
    'overlay-editor-updated.js'
  ];

  return new Promise((resolve) => {
    (function injectNext(i) {
      if (i >= scripts.length) {
        // Wait for all exports to be available (up to 10s for SQL.js to initialize)
        const start = Date.now();
        (function waitForGlobals() {
          const hasInit = typeof window.initializeCanvas === 'function';
          const hasExportSingle = typeof window.exportAnkiSingleCard === 'function';
          const hasCreateSingle = typeof window.createApkgSingleCard === 'function';
          const hasExportMulti = typeof window.exportAnkiMultiCard === 'function';
          const hasHelpers = typeof window.createOriginalImageFromOverlay === 'function' && 
                             typeof window.createOccludedImageFromOverlay === 'function';
          
          if (hasInit && (hasExportSingle || hasCreateSingle) && hasHelpers) {
            return resolve();
          }
          
          if (Date.now() - start > 10000) {
            console.warn('Script injection timeout: some functions may not be ready', {
              hasInit, hasExportSingle, hasCreateSingle, hasExportMulti, hasHelpers
            });
            // Try a more reliable injection path via background (MAIN world) before giving up.
            try {
              chrome.runtime.sendMessage({ action: 'injectOverlayDeps' }, () => {
                // Wait a short moment and re-check
                setTimeout(() => resolve(), 300);
              });
              return;
            } catch (e) {
              return resolve(); // Continue anyway
            }
          }
          
          setTimeout(waitForGlobals, 100);
        })();
        return;
      }

      const path = scripts[i];
      // Avoid injecting same script twice
      const already = Array.from(document.scripts).some(s => s.src && s.src.endsWith(path));
      if (already) return injectNext(i + 1);

      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(path);
      script.onload = () => injectNext(i + 1);
      script.onerror = () => {
        console.error('Failed to load script:', path);
        injectNext(i + 1);
      };
      document.documentElement.appendChild(script);
    })(0);
  });
}

async function showOverlayEditorInPage(imageData) {
  // Avoid duplicate editor
  if (document.getElementById('afc-occlusion-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'afc-occlusion-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.6)', zIndex: 2147483647,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });

  const panel = document.createElement('div');
  panel.style.cssText = 'width:80vw; height:80vh; background:#fff; border-radius:8px; overflow:hidden; display:flex; flex-direction:column;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px; background:#f4f4f4;';

  const titleInput = document.createElement('input');
  titleInput.id = 'anki-card-title';
  titleInput.placeholder = 'Tiêu đề thẻ Anki...';
  titleInput.style.cssText = 'flex:1; padding:6px 8px;';
  // Tool buttons (Rect, Ellipse, Delete, Clear)
  const btnRect = document.createElement('button');
  btnRect.id = 'drawRectBtn';
  btnRect.textContent = 'Hình chữ nhật';
  btnRect.style.cssText = 'padding:6px 10px; margin-right:6px;';
  btnRect.addEventListener('click', (ev) => { ev.preventDefault(); afcSendOverlayCommand({ cmd: 'selectTool', tool: 'rect' }).catch(()=>{}); });

  const btnEllipse = document.createElement('button');
  btnEllipse.id = 'drawEllipseBtn';
  btnEllipse.textContent = 'Ellipse';
  btnEllipse.style.cssText = 'padding:6px 10px; margin-right:6px;';
  btnEllipse.addEventListener('click', (ev) => { ev.preventDefault(); afcSendOverlayCommand({ cmd: 'selectTool', tool: 'ellipse' }).catch(()=>{}); });

  const btnDelete = document.createElement('button');
  btnDelete.id = 'deleteBtn';
  btnDelete.textContent = 'Xóa';
  btnDelete.style.cssText = 'padding:6px 10px; margin-right:6px;';
  btnDelete.addEventListener('click', () => { afcSendOverlayCommand({ cmd: 'deleteSelected' }).catch(()=>{}); });

  const btnClear = document.createElement('button');
  btnClear.id = 'clearBtn';
  btnClear.textContent = 'Xóa tất cả';
  btnClear.style.cssText = 'padding:6px 10px; margin-right:6px;';
  btnClear.addEventListener('click', () => { afcSendOverlayCommand({ cmd: 'clearAll' }).catch(()=>{}); });

  // Hide mode selector (fixed: only Hide 1 => mỗi block = 1 thẻ)
  const hideModeSelect = document.createElement('select');
  hideModeSelect.id = 'hideModeSelect';
  hideModeSelect.title = 'Hide 1 (mỗi block = 1 thẻ)';
  hideModeSelect.style.cssText = 'padding:6px 8px; margin-right:8px; border:1px solid #ddd; border-radius:4px;';
  hideModeSelect.innerHTML = '<option value="hide-one-reveal-one">Hide 1</option>';
  hideModeSelect.disabled = true;

  const exportBtn = document.createElement('button');
  exportBtn.id = 'exportBtn';
  exportBtn.textContent = 'Xuất .apkg';
  exportBtn.style.cssText = 'padding:6px 10px; margin-left:8px;';
  exportBtn.addEventListener('click', async () => {
    const origText = exportBtn.textContent;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Chuẩn bị...';
    
    try {
      // Ensure all scripts are injected and ready
      await ensureOverlayScriptInjected();

      // Wait longer for export function to be available (poll up to 8s)
      const start = Date.now();
      let ready = false;
      await afcSendOverlayCommand({ cmd: 'exportApkg' }, 30000);
} catch (e) {
      console.error('Export error:', e);
      alert('Lỗi xuất file: ' + (e && e.message ? e.message : String(e)));
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = origText;
    }
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Đóng';
  closeBtn.style.cssText = 'padding:6px 10px; margin-left:8px;';
  closeBtn.addEventListener('click', () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  });

  toolbar.appendChild(titleInput);
  toolbar.appendChild(btnRect);
  toolbar.appendChild(btnEllipse);
  toolbar.appendChild(btnDelete);
  toolbar.appendChild(btnClear);
  toolbar.appendChild(hideModeSelect);
  toolbar.appendChild(exportBtn);
  toolbar.appendChild(closeBtn);

  // Canvas container
  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; background:#f4f4f4; padding:12px;';

  const canvas = document.createElement('canvas');
  canvas.id = 'anki-overlay-canvas';
  canvas.style.cssText = 'max-width:100%; max-height:100%; background:#fff; box-shadow: 0 6px 18px rgba(0,0,0,0.25);';
  canvasWrap.appendChild(canvas);

  panel.appendChild(toolbar);
  panel.appendChild(canvasWrap);
  overlay.appendChild(panel);
  (document.documentElement || document.body).appendChild(overlay);

  // Immediately draw the captured image into the canvas so the user sees it fast
  (function drawImmediatePreview() {
    overlay._afc_imageData = imageData;
    const imgEl = new Image();
    imgEl.onload = () => {
      // set canvas pixel size to image actual size for crispness
      const dpr = window.devicePixelRatio || 1;
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      // scale CSS to fit container
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    };
    imgEl.src = imageData;
  })();

  // Inject heavier editor scripts in background; when ready, initialize full editor
  ensureOverlayScriptInjected().then(() => {
    try {
      if (typeof window.initializeCanvas === 'function') {
        window.initializeCanvas(imageData);
      }
    } catch (err) {
      console.error('AddFlashcard: Error initializing full overlay editor after injection', err);
      // fallback: open dedicated editor tab
      try { chrome.runtime.sendMessage({ action: 'openImageOcclusionEditor', imageData: imageData, pageTitle: document.title }); } catch (e) {}
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  }).catch(err => {
    console.warn('AddFlashcard: overlay script injection failed', err);
  });
}

function startAreaSelection() {
  // Avoid multiple overlays
  if (document.getElementById('afc-selection-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'afc-selection-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: 2147483647, cursor: 'crosshair',
    background: 'rgba(0,0,0,0.02)'
  });

  const box = document.createElement('div');
  box.id = 'afc-selection-box';
  Object.assign(box.style, {
    position: 'absolute', border: '2px dashed #4A90E2', background: 'rgba(74,144,226,0.12)'
  });

  overlay.appendChild(box);
  (document.documentElement || document.body).appendChild(overlay);

  let startX = 0, startY = 0, dragging = false;

  function onPointerDown(e) {
    // Only start on left button
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    updateBox(startX, startY, 0, 0);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const x = e.clientX;
    const y = e.clientY;
    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);
    updateBox(left, top, width, height);
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    const rect = box.getBoundingClientRect();
    // If region too small, cancel
    if (rect.width < 6 || rect.height < 6) {
      cleanup();
      return;
    }

    const area = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      devicePixelRatio: window.devicePixelRatio || 1
    };

    // Send area to background to capture & crop
    try {
      chrome.runtime.sendMessage({ action: 'captureForOverlay', area: area }, () => {});
    } catch (err) {
      console.error('AddFlashcard: Failed to send captureForOverlay', err);
    }

    cleanup();
    e.preventDefault();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') cleanup();
  }

  function updateBox(left, top, width, height) {
    box.style.left = left + 'px';
    box.style.top = top + 'px';
    box.style.width = width + 'px';
    box.style.height = height + 'px';
  }

  function cleanup() {
    overlay.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('keydown', onKeyDown);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  overlay.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('keydown', onKeyDown);
}

// -------------------------------------------------------------------------
