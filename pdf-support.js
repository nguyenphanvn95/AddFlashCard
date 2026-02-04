// PDF Support Script - Enhanced version with better text detection
// Works with PDF.js viewer and Chrome's PDF viewer

let pdfSyncButton = null;
let pdfToolbarInjected = false;
let textSelectionTimeout = null;

// Initialize PDF support
function initPDFSupport() {
  console.log('AddFlashcard PDF: Initializing enhanced version...');
  
  // Check if we're on a PDF page
  if (!isPDFPage()) {
    console.log('AddFlashcard PDF: Not a PDF page');
    return;
  }

  console.log('AddFlashcard PDF: PDF page detected, setting up...');
  
  // Wait for PDF to load with retry logic
  waitForPDFLoad();
  
  // Setup text selection listener
  setupTextSelectionListener();
}

// Check if current page is a PDF
function isPDFPage() {
  // Check 1: URL contains .pdf
  if (window.location.href.toLowerCase().includes('.pdf')) {
    console.log('AddFlashcard PDF: Detected via URL');
    return true;
  }
  
  // Check 2: PDF.js viewer elements
  if (document.querySelector('#viewer') || 
      document.querySelector('.pdfViewer') ||
      document.querySelector('#viewerContainer') ||
      document.querySelector('.textLayer')) {
    console.log('AddFlashcard PDF: Detected via PDF.js elements');
    return true;
  }
  
  // Check 3: Embedded PDF
  if (document.querySelector('embed[type="application/pdf"]') || 
      document.querySelector('object[type="application/pdf"]') ||
      document.querySelector('iframe[src*=".pdf"]')) {
    console.log('AddFlashcard PDF: Detected via embedded PDF');
    return true;
  }
  
  // Check 4: Chrome's native PDF viewer
  if (document.querySelector('embed[type="application/x-google-chrome-pdf"]')) {
    console.log('AddFlashcard PDF: Detected via Chrome PDF viewer');
    return true;
  }
  
  // Check 5: PDF viewer extension page
  if (window.location.href.includes('pdf-viewer.html')) {
    console.log('AddFlashcard PDF: PDF viewer extension page');
    return true;
  }
  
  return false;
}

// Wait for PDF to fully load
function waitForPDFLoad() {
  let attempts = 0;
  const maxAttempts = 40; // 20 seconds total
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    // Check for text layer or PDF viewer elements
    const textLayer = document.querySelector('.textLayer');
    const pdfViewer = document.querySelector('.pdfViewer');
    const viewerContainer = document.querySelector('#viewerContainer');
    const pdfPages = document.querySelectorAll('.page');
    const embed = document.querySelector('embed[type="application/pdf"]');
    
    // Check if PDF has loaded
    const hasTextLayer = textLayer && textLayer.textContent.trim().length > 0;
    const hasViewer = pdfViewer || viewerContainer;
    const hasPages = pdfPages && pdfPages.length > 0;
    const hasEmbed = embed !== null;
    
    console.log(`AddFlashcard PDF: Load check ${attempts}/${maxAttempts}`, {
      hasTextLayer,
      hasViewer,
      hasPages,
      hasEmbed
    });
    
    if (hasTextLayer || (hasViewer && hasPages) || hasEmbed) {
      console.log('AddFlashcard PDF: PDF loaded successfully!');
      clearInterval(checkInterval);
      setupPDFFeatures();
    } else if (attempts >= maxAttempts) {
      console.log('AddFlashcard PDF: Timeout waiting for PDF load, setting up anyway...');
      clearInterval(checkInterval);
      setupPDFFeatures(); // Try anyway
    }
  }, 500);
}

// Setup PDF-specific features
function setupPDFFeatures() {
  console.log('AddFlashcard PDF: Setting up features...');
  
  // Inject floating toolbar for PDF (only once)
  if (!pdfToolbarInjected) {
    injectPDFToolbar();
    pdfToolbarInjected = true;
  }
  
  // Enable text selection context menu
  enablePDFContextMenu();
  
  // Inject "Open in PDF Viewer" button if Chrome PDF
  injectOpenInViewerButton();
  
  console.log('AddFlashcard PDF: Features enabled successfully!');
}

// Setup text selection listener for better detection
function setupTextSelectionListener() {
  document.addEventListener('selectionchange', () => {
    clearTimeout(textSelectionTimeout);
    textSelectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        console.log('AddFlashcard PDF: Text selected:', selectedText.substring(0, 50) + '...');
      }
    }, 100);
  });
  
  // Also listen for mouseup
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        console.log('AddFlashcard PDF: Text selected via mouseup:', selectedText.substring(0, 50) + '...');
        showQuickActions();
      }
    }, 100);
  });
}

// Show quick action buttons when text is selected
function showQuickActions() {
  // Remove existing quick actions
  const existing = document.querySelector('.pdf-quick-actions');
  if (existing) {
    existing.remove();
  }
  
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  if (rect.width === 0 || rect.height === 0) return;
  
  const quickActions = document.createElement('div');
  quickActions.className = 'pdf-quick-actions';
  quickActions.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top - 50}px;
    transform: translateX(-50%);
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 8px;
    display: flex;
    gap: 8px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    animation: fadeInQuick 0.2s ease-out;
  `;
  
  const frontBtn = createQuickActionButton('📌 Front', 'rgb(46, 170, 220)', () => {
    handlePDFSelection('sendToFront');
    quickActions.remove();
  });
  
  const backBtn = createQuickActionButton('📋 Back', 'rgb(76, 175, 80)', () => {
    handlePDFSelection('sendToBack');
    quickActions.remove();
  });
  
  quickActions.appendChild(frontBtn);
  quickActions.appendChild(backBtn);
  
  document.body.appendChild(quickActions);
  
  // Remove on click outside
  setTimeout(() => {
    document.addEventListener('click', function removeQuickActions(e) {
      if (!quickActions.contains(e.target)) {
        quickActions.remove();
        document.removeEventListener('click', removeQuickActions);
      }
    });
  }, 100);
}

// Create quick action button
function createQuickActionButton(text, bgColor, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: ${bgColor};
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;
  
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.filter = 'brightness(0.9)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.filter = 'brightness(1)';
  });
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  
  return btn;
}

// Inject "Open in PDF Viewer" button for Chrome PDF viewer
function injectOpenInViewerButton() {
  // Only for Chrome's native PDF viewer
  const embed = document.querySelector('embed[type="application/pdf"]');
  if (!embed) return;
  
  // Check if button already exists
  if (document.querySelector('#open-in-pdf-viewer-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'open-in-pdf-viewer-btn';
  button.textContent = '📖 Mở trong PDF Viewer của AddFlashcard';
  button.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    transition: all 0.3s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
  });
  
  button.addEventListener('click', () => {
    openInPDFViewer();
  });
  
  document.body.appendChild(button);
}

// Open PDF in extension's PDF viewer
function openInPDFViewer() {
  const pdfUrl = window.location.href;
  const viewerUrl = chrome.runtime.getURL('pdf-viewer.html') + '?file=' + encodeURIComponent(pdfUrl);
  
  chrome.runtime.sendMessage({
    action: "openPDFViewer",
    url: viewerUrl
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('AddFlashcard PDF: Error opening viewer:', chrome.runtime.lastError);
      showPDFNotification('Không thể mở PDF Viewer. Vui lòng thử lại.', 'error');
    }
  });
}

// Inject floating toolbar for PDF pages
function injectPDFToolbar() {
  // Check if toolbar already exists
  if (document.querySelector('#addflashcard-pdf-toolbar')) {
    console.log('AddFlashcard PDF: Toolbar already exists');
    return;
  }

  console.log('AddFlashcard PDF: Injecting toolbar...');

  const toolbar = document.createElement('div');
  toolbar.id = 'addflashcard-pdf-toolbar';
  toolbar.setAttribute('data-addflashcard', 'pdf-toolbar');
  toolbar.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 12px;
    display: flex;
    gap: 8px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Add to Front button
  const frontBtn = createToolbarButton('📌 Front', 'rgb(46, 170, 220)', () => {
    handlePDFSelection('sendToFront');
  });

  // Add to Back button
  const backBtn = createToolbarButton('📋 Back', 'rgb(76, 175, 80)', () => {
    handlePDFSelection('sendToBack');
  });

  // Extract All button
  const extractBtn = createToolbarButton('📄 Extract All', 'rgb(255, 152, 0)', () => {
    extractAllPDFText();
  });

  toolbar.appendChild(frontBtn);
  toolbar.appendChild(backBtn);
  toolbar.appendChild(extractBtn);

  document.body.appendChild(toolbar);

  // Add hover animation
  toolbar.addEventListener('mouseenter', () => {
    toolbar.style.transform = 'translateY(-4px)';
    toolbar.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
  });
  toolbar.addEventListener('mouseleave', () => {
    toolbar.style.transform = 'translateY(0)';
    toolbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
  });

  toolbar.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
  
  console.log('AddFlashcard PDF: Toolbar injected successfully!');
}

// Create toolbar button
function createToolbarButton(text, bgColor, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: ${bgColor};
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.filter = 'brightness(0.9)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.filter = 'brightness(1)';
  });

  btn.addEventListener('click', onClick);

  return btn;
}

// Handle PDF text selection with better text extraction
function handlePDFSelection(action) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (!selectedText) {
    showPDFNotification('Vui lòng chọn văn bản trước!', 'warning');
    return;
  }

  // Get selected HTML with formatting
  let selectedHtml = '';
  try {
    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    selectedHtml = container.innerHTML || `<p>${escapeHtml(selectedText)}</p>`;
  } catch (e) {
    selectedHtml = `<p>${escapeHtml(selectedText)}</p>`;
  }

  // Get page info
  const pageUrl = window.location.href;
  const pageTitle = document.title || 'PDF Document';

  // Create content payload
  const content = {
    type: action,
    dataText: selectedText,
    dataHtml: selectedHtml,
    pageUrl: pageUrl,
    pageTitle: pageTitle,
    sourceType: 'pdf',
    timestamp: new Date().toISOString()
  };

  console.log('AddFlashcard PDF: Sending content:', content);

  // Open sidebar with content
  chrome.runtime.sendMessage({
    action: "openSidebarWithContent",
    content: content
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('AddFlashcard PDF: Error:', chrome.runtime.lastError);
      showPDFNotification('Lỗi khi mở sidebar. Vui lòng thử lại.', 'error');
    } else {
      // Clear selection
      selection.removeAllRanges();
      showPDFNotification(`Đã thêm vào ${action === 'sendToFront' ? 'Front' : 'Back'}`, 'success');
    }
  });
}

// Extract all text from PDF with better detection
function extractAllPDFText() {
  showPDFNotification('Đang trích xuất văn bản từ PDF...', 'info');

  setTimeout(() => {
    const allText = [];
    
    // Strategy 1: Try textLayer elements (PDF.js)
    const textLayers = document.querySelectorAll('.textLayer');
    console.log('AddFlashcard PDF: Found', textLayers.length, 'text layers');
    
    if (textLayers.length > 0) {
      textLayers.forEach((layer, index) => {
        const pageText = layer.textContent.trim();
        if (pageText) {
          allText.push(`=== Trang ${index + 1} ===\n${pageText}\n`);
        }
      });
    }
    
    // Strategy 2: Try PDF pages directly
    if (allText.length === 0) {
      const pages = document.querySelectorAll('.page');
      console.log('AddFlashcard PDF: Found', pages.length, 'pages');
      
      pages.forEach((page, index) => {
        const pageText = page.textContent.trim();
        if (pageText) {
          allText.push(`=== Trang ${index + 1} ===\n${pageText}\n`);
        }
      });
    }
    
    // Strategy 3: Try viewer container
    if (allText.length === 0) {
      const viewer = document.querySelector('#viewer') || 
                    document.querySelector('.pdfViewer') ||
                    document.querySelector('#viewerContainer');
      
      if (viewer) {
        console.log('AddFlashcard PDF: Extracting from viewer container');
        const text = viewer.textContent.trim();
        if (text) {
          allText.push(text);
        }
      }
    }
    
    // Strategy 4: Try all text content
    if (allText.length === 0) {
      console.log('AddFlashcard PDF: Trying full document text extraction');
      const bodyText = document.body.textContent.trim();
      if (bodyText && bodyText.length > 100) {
        allText.push(bodyText);
      }
    }

    if (allText.length === 0) {
      showPDFNotification('Không tìm thấy văn bản trong PDF (có thể là ảnh scan)', 'error');
      return;
    }

    const fullText = allText.join('\n\n');
    console.log('AddFlashcard PDF: Extracted', fullText.length, 'characters');
    
    // Open sidebar with extracted text
    const content = {
      type: 'sendToBack',
      dataText: fullText,
      dataHtml: `<pre style="white-space: pre-wrap; font-family: system-ui; font-size: 13px; line-height: 1.6; padding: 10px; background: #f5f5f5; border-radius: 8px;">${escapeHtml(fullText)}</pre>`,
      pageUrl: window.location.href,
      pageTitle: document.title || 'PDF Document',
      sourceType: 'pdf-full',
      timestamp: new Date().toISOString()
    };

    // Send to content script
    chrome.runtime.sendMessage({
      action: "openSidebarWithContent",
      content: content
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('AddFlashcard PDF: Error sending message:', chrome.runtime.lastError);
        showPDFNotification('Lỗi khi mở sidebar. Vui lòng thử lại.', 'error');
      } else {
        const pageCount = textLayers.length || 
                         document.querySelectorAll('.page').length || 
                         'tất cả';
        showPDFNotification(`Đã trích xuất văn bản từ ${pageCount} trang`, 'success');
      }
    });
  }, 500);
}

// Enable context menu for PDF
function enablePDFContextMenu() {
  // Ensure text is selectable
  document.addEventListener('contextmenu', (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      console.log('AddFlashcard PDF: Context menu available for selected text');
    }
  }, true);
}

// Show notification for PDF
function showPDFNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.pdf-flashcard-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'pdf-flashcard-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : type === 'warning' ? '#fbbc04' : '#1a73e8'};
    color: white;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    animation: slideInPDF 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutPDF 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInPDF {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutPDF {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  @keyframes fadeInQuick {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPDFSupport);
} else {
  initPDFSupport();
}

console.log('AddFlashcard PDF support script loaded (Enhanced version)');
