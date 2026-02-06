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
    // Send response back to confirm sidebar toggle
    sendResponse({ success: true, isOpen: !isOpen });
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
    startAreaSelection(message.captureMode || 'overlay');
    sendResponse({ started: true });
  }
});

// Preferred Image-Occlusion UX: show the official editor UI (image-occlusion-editor.html)
// inside an in-page iframe overlay. This avoids duplicating drawing/export logic.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;

  if (message.action === 'showIoIframeEditor') {
    showImageOcclusionIframeOverlay(message.imageData, message.pageTitle || document.title);
    sendResponse({ shown: true });
    return;
  }

  // Backward compatibility: older background versions may still send showOverlayEditor
  if (message.action === 'showOverlayEditor') {
    showImageOcclusionIframeOverlay(message.imageData, message.pageTitle || document.title);
    sendResponse({ shown: true });
    return;
  }
});

// New: show image-occlusion-editor.html inside an iframe overlay.
// This reuses the existing editor UI & export code (no duplicated overlay logic).
function showImageOcclusionIframeOverlay(imageData, pageTitle) {
  // Avoid duplicates
  const existing = document.getElementById('afc-io-iframe-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'afc-io-iframe-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: 2147483647,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });

  // Panel wrapper so the editor looks like its own window
  const panel = document.createElement('div');
  panel.id = 'afc-io-iframe-panel';
  Object.assign(panel.style, {
    width: '92vw', height: '92vh',
    background: '#fff',
    borderRadius: '10px',
    overflow: 'visible',
    boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
    position: 'relative'
  });

  // Close button (always available even if iframe fails)
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  Object.assign(closeBtn.style, {
    position: 'absolute', top: '-20px', right: '-20px',
    zIndex: 5,
    width: '52px', height: '52px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(24,31,42,0.92)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '34px', lineHeight: '44px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.35)'
  });
  closeBtn.addEventListener('click', () => overlay.remove());

  // The editor iframe (extension page)
  const iframe = document.createElement('iframe');
  iframe.id = 'afc-io-editor-iframe';
  iframe.src = chrome.runtime.getURL('image-occlusion-editor.html');
  Object.assign(iframe.style, {
    width: '100%', height: '100%',
    border: '0', display: 'block'
  });

  const frameWrap = document.createElement('div');
  Object.assign(frameWrap.style, {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: '10px',
    background: '#fff'
  });

  // Allow Esc to close
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      overlay.remove();
    }
  }
  window.addEventListener('keydown', onKeyDown);
  overlay.addEventListener('remove', () => {
    window.removeEventListener('keydown', onKeyDown);
  });

  // Listen for close request from iframe
  function onMsg(ev) {
    const data = ev && ev.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'AFC_CLOSE_OVERLAY') {
      overlay.remove();
    }
  }
  window.addEventListener('message', onMsg);
  overlay.addEventListener('remove', () => {
    window.removeEventListener('message', onMsg);
  });

  // Mount
  frameWrap.appendChild(iframe);
  panel.appendChild(frameWrap);
  panel.appendChild(closeBtn);
  overlay.appendChild(panel);
  (document.documentElement || document.body).appendChild(overlay);

  // When iframe is ready, send the image payload via postMessage.
  const payload = {
    type: 'AFC_LOAD_IMAGE',
    imageData: imageData,
    pageTitle: pageTitle || document.title,
    // User preference: default to Hide 1 (multi-card). The editor already supports it.
    hideMode: 'hide-one-reveal-one',
    lockHideMode: false
  };

  const send = () => {
    try {
      iframe.contentWindow.postMessage(payload, '*');
    } catch (e) {
      // Ignore
    }
  };

  iframe.addEventListener('load', () => {
    // Send twice in case the editor registers listeners a bit late
    send();
    setTimeout(send, 150);
  });
}

function startAreaSelection(captureMode = 'overlay') {
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
    position: 'absolute', 
    background: 'rgba(74,144,226,0.12)',
    outline: '1px solid rgba(74,144,226,0.5)',
    outlineOffset: '-1px'
  });

  // Guide line horizontal - nằm ngoài, full width
  const guideH = document.createElement('div');
  Object.assign(guideH.style, {
    position: 'fixed', width: '100%', height: '1px',
    left: '0', top: '0',
    background: 'rgba(74,144,226,0.5)',
    pointerEvents: 'none',
    display: 'none'
  });

  // Guide line vertical - nằm ngoài, full height
  const guideV = document.createElement('div');
  Object.assign(guideV.style, {
    position: 'fixed', width: '1px', height: '100%',
    top: '0', left: '0',
    background: 'rgba(74,144,226,0.5)',
    pointerEvents: 'none',
    display: 'none'
  });

  overlay.appendChild(box);
  overlay.appendChild(guideH);
  overlay.appendChild(guideV);
  (document.documentElement || document.body).appendChild(overlay);

  let startX = 0, startY = 0, dragging = false;

  function onPointerDown(e) {
    // Only start on left button
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    updateBox(startX, startY, 0, 0);
    guideH.style.display = 'block';
    guideV.style.display = 'block';
    e.preventDefault();
  }

  function onPointerMove(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Update guide lines position
    guideH.style.top = y + 'px';
    guideV.style.left = x + 'px';

    if (!dragging) return;
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
    guideH.style.display = 'none';
    guideV.style.display = 'none';
    
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
    const captureAction = captureMode === 'new-tab' ? 'captureForEditorTab' : 'captureForOverlay';
    try {
      chrome.runtime.sendMessage({ action: captureAction, area: area }, () => {});
    } catch (err) {
      console.error('AddFlashcard: Failed to send capture area', err);
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
