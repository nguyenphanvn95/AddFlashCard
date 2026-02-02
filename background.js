// Tạo context menu khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
  // Menu chính
  chrome.contextMenus.create({
    id: "addflashcard",
    title: "AddFlashcard",
    contexts: ["selection", "image"]
  });

  // Sub-menu: Send to Front
  chrome.contextMenus.create({
    id: "sendToFront",
    parentId: "addflashcard",
    title: "Send to Front",
    contexts: ["selection", "image"]
  });

  // Sub-menu: Send to Back
  chrome.contextMenus.create({
    id: "sendToBack",
    parentId: "addflashcard",
    title: "Send to Back",
    contexts: ["selection", "image"]
  });
});

// Xử lý khi click vào context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendToFront" || info.menuItemId === "sendToBack") {
    let content = {
      type: info.menuItemId,
      data: null,
      isImage: false
    };

    // Nếu là văn bản được chọn
    if (info.selectionText) {
      content.data = info.selectionText;
      content.isImage = false;
    }
    // Nếu là ảnh
    else if (info.srcUrl) {
      content.data = info.srcUrl;
      content.isImage = true;
    }

    // Gửi message đến content script để mở sidebar và thêm nội dung
    chrome.tabs.sendMessage(tab.id, {
      action: "openSidebarWithContent",
      content: content
    });
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

    // Store edit context so sidebar can pick it up on load.
    chrome.storage.local.set({ editCardContext: card }, () => {
      chrome.windows.create({
        url: chrome.runtime.getURL('sidebar.html?mode=edit'),
        type: 'popup',
        width: 460,
        height: 780
      });
    });
  }
  return true;
});
