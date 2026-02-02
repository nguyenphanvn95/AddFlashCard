// Tạo context menu khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
  console.log('[AddFlashcard] Extension installed/updated');
  
  // Check chrome.storage availability
  chrome.storage.local.get(null, (result) => {
    console.log('[AddFlashcard] Storage initialized. Keys:', Object.keys(result));
  });
  
  // Menu chính
  chrome.contextMenus.create({
    id: "addflashcard",
    title: "AddFlashcard",
    contexts: ["selection", "image", "link", "video"]
  });

  // Sub-menu: Send to Front
  chrome.contextMenus.create({
    id: "sendToFront",
    parentId: "addflashcard",
    title: "Send to Front",
    contexts: ["selection", "image", "link", "video"]
  });

  // Sub-menu: Send to Back
  chrome.contextMenus.create({
    id: "sendToBack",
    parentId: "addflashcard",
    title: "Send to Back",
    contexts: ["selection", "image", "link", "video"]
  });
});

// Log storage changes in the background context so we can see writes from any page
if (chrome && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    try {
      console.log('[AddFlashcard][background storage.onChanged] keys:', Object.keys(changes));
      for (const k in changes) {
        console.log('[AddFlashcard][background storage.onChanged]', k, '=>', changes[k]);
      }
    } catch (err) {
      console.error('[AddFlashcard][background storage.onChanged] error:', err);
    }
  });
}

/**
 * Get rich selection HTML from the page to preserve formatting (bold/italic/links/lists, etc.).
 * Also normalizes relative URLs to absolute.
 */
async function getRichSelectionFromTab(tabId) {
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      try {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return { html: '', text: '', pageUrl: location.href, pageTitle: document.title };
        }

        const range = sel.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());

        // Normalize relative URLs (a/img/video/source/iframe)
        const makeAbs = (url) => {
          try { return new URL(url, location.href).href; } catch { return url; }
        };
        container.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', makeAbs(a.getAttribute('href'))));
        container.querySelectorAll('img[src]').forEach(img => img.setAttribute('src', makeAbs(img.getAttribute('src'))));
        container.querySelectorAll('video[src]').forEach(v => v.setAttribute('src', makeAbs(v.getAttribute('src'))));
        container.querySelectorAll('source[src]').forEach(s => s.setAttribute('src', makeAbs(s.getAttribute('src'))));
        container.querySelectorAll('iframe[src]').forEach(f => f.setAttribute('src', makeAbs(f.getAttribute('src'))));

        return {
          html: container.innerHTML,
          text: sel.toString(),
          pageUrl: location.href,
          pageTitle: document.title
        };
      } catch (e) {
        return { html: '', text: '', pageUrl: location.href, pageTitle: document.title, error: String(e) };
      }
    }
  });

  return res && res.result ? res.result : { html: '', text: '', pageUrl: '', pageTitle: '' };
}

// Minimal escaping helpers for HTML templates
function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttr(str) {
  // For URLs used in HTML attributes
  return escapeHtml(str).replaceAll('`', '&#96;').replaceAll('\n', ' ');
}

// Xử lý khi click vào context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendToFront" || info.menuItemId === "sendToBack") {
    // Build rich payload (keep formatting, support link/image/video)
    const buildAndSend = async () => {
      /** @type {{type:string, dataText?:string, dataHtml?:string, mediaType?:string, srcUrl?:string, pageUrl?:string, pageTitle?:string}} */
      const content = { type: info.menuItemId };

      content.pageUrl = tab?.url || '';
      content.pageTitle = tab?.title || '';

      // 1) If user right-clicked an image/video/link, prefer direct URL from context menu
      if (info.linkUrl) {
        content.mediaType = 'link';
        content.dataHtml = `<a href="${escapeHtmlAttr(info.linkUrl)}" target="_blank" rel="noopener">${escapeHtml(info.selectionText || info.linkUrl)}</a>`;
        content.dataText = info.selectionText || info.linkUrl;
      } else if (info.mediaType === 'video' && info.srcUrl) {
        content.mediaType = 'video';
        content.srcUrl = info.srcUrl;
        content.dataHtml = `<video controls src="${escapeHtmlAttr(info.srcUrl)}" style="max-width:100%;"></video>`;
      } else if (info.srcUrl) {
        // image (or other media)
        content.mediaType = info.mediaType || 'image';
        content.srcUrl = info.srcUrl;
        content.dataHtml = `<img src="${escapeHtmlAttr(info.srcUrl)}" style="max-width:100%;" />`;
      }

      // 2) If there is a selection, get HTML to preserve formatting (bold/links/lists, etc.)
      if (!content.dataHtml && tab && tab.id) {
        const rich = await getRichSelectionFromTab(tab.id);
        if (rich && (rich.html || rich.text)) {
          content.dataHtml = rich.html || '';
          content.dataText = rich.text || '';
          content.pageUrl = rich.pageUrl || content.pageUrl;
          content.pageTitle = rich.pageTitle || content.pageTitle;
        }
      }

      // 3) Final fallback: plain selectionText
      if (!content.dataHtml && info.selectionText) {
        content.dataText = info.selectionText;
        content.dataHtml = `<p>${escapeHtml(info.selectionText)}</p>`;
      }

      // If still nothing, don't send
      if (!content.dataHtml && !content.dataText) return;

      chrome.tabs.sendMessage(tab.id, {
        action: "openSidebarWithContent",
        content
      });
    };

    buildAndSend();
  }
});

// Xử lý khi click vào icon extension
chrome.action.onClicked.addListener((tab) => {
  // Mở trang quản lý
  chrome.tabs.create({
    url: chrome.runtime.getURL('manage.html')
  });
});

// Lắng nghe message từ content script hoặc sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openManagePage") {
    chrome.tabs.create({
      url: chrome.runtime.getURL('manage.html')
    });
  }

  // Open a dedicated sidebar window to edit an existing card.
  // The card payload is provided by manage.js.
  if (message.action === "openEditCard") {
    const card = message.card;
    if (!card || typeof card.id !== 'number') {
      return true;
    }

    // Prefer opening the in-page sidebar (same as Send to Front/Back) in the
    // most recently used normal tab (http/https/file). This matches the user's
    // expectation of seeing the injected sidebar UI, not a separate popup.
    chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
      const candidates = (tabs || [])
        .filter(t => t && typeof t.id === 'number')
        .filter(t => {
          const url = (t.url || '').toLowerCase();
          // Exclude internal/extension pages
          if (!url) return false;
          if (url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('chrome://')) return false;
          return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://');
        })
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

      const targetTab = candidates[0];
      if (targetTab && targetTab.id) {
        chrome.tabs.sendMessage(targetTab.id, {
          action: 'openSidebarForEdit',
          card
        });
      } else {
        // Fallback: if no suitable tab is found, open a dedicated popup so the edit
        // action still works.
        chrome.storage.local.set({ editCardContext: card }, () => {
          chrome.windows.create({
            url: chrome.runtime.getURL('sidebar.html?mode=edit'),
            type: 'popup',
            width: 460,
            height: 780
          });
        });
      }
    });
  }
  return true;
});
