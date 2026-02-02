// PDF Support Script - Extract text and create flashcards from PDFs
// This script works with PDF.js viewer to enable text selection and flashcard creation

let pdfSyncButton = null;
let pdfToolbarInjected = false;

// Initialize PDF support
function initPDFSupport() {
  console.log('AddFlashcard PDF: Initializing...');
  
  // Check if we're on a PDF page
  if (!isPDFPage()) {
    console.log('AddFlashcard PDF: Not a PDF page');
    return;
  }

  console.log('AddFlashcard PDF: PDF page detected, setting up...');
  
  // Wait for PDF to load with retry logic
  waitForPDFLoad();
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
      document.querySelector('#viewerContainer')) {
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
  
  // Check 5: Content-Type header (for local files)
  const metaTags = document.querySelectorAll('meta[http-equiv="content-type"]');
  for (const meta of metaTags) {
    if (meta.content && meta.content.includes('application/pdf')) {
      console.log('AddFlashcard PDF: Detected via content-type meta');
      return true;
    }
  }
  
  // Check 6: File protocol with .pdf
  if (window.location.protocol === 'file:' && window.location.pathname.toLowerCase().endsWith('.pdf')) {
    console.log('AddFlashcard PDF: Detected local PDF file');
    return true;
  }
  
  // Check 7: Body class or data attributes
  if (document.body.classList.contains('pdf') || 
      document.body.dataset.documentType === 'pdf') {
    console.log('AddFlashcard PDF: Detected via body class/data');
    return true;
  }
  
  return false;
}

// Wait for PDF to fully load
function waitForPDFLoad() {
  let attempts = 0;
  const maxAttempts = 30; // 15 seconds total
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    // Check for text layer or PDF viewer elements
    const textLayer = document.querySelector('.textLayer');
    const pdfViewer = document.querySelector('.pdfViewer');
    const viewerContainer = document.querySelector('#viewerContainer');
    const pdfPages = document.querySelectorAll('.page');
    
    // Check if PDF has loaded
    const hasTextLayer = textLayer && textLayer.textContent.trim().length > 0;
    const hasViewer = pdfViewer || viewerContainer;
    const hasPages = pdfPages && pdfPages.length > 0;
    
    console.log(`AddFlashcard PDF: Load check ${attempts}/${maxAttempts}`, {
      hasTextLayer,
      hasViewer,
      hasPages
    });
    
    if (hasTextLayer || (hasViewer && hasPages)) {
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
  
  console.log('AddFlashcard PDF: Features enabled successfully!');
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
  const frontBtn = createToolbarButton('Add to Front', 'rgb(46, 170, 220)', () => {
    handlePDFSelection('sendToFront');
  });

  // Add to Back button
  const backBtn = createToolbarButton('Add to Back', 'rgb(76, 175, 80)', () => {
    handlePDFSelection('sendToBack');
  });

  // Extract All button
  const extractBtn = createToolbarButton('Extract All', 'rgb(255, 152, 0)', () => {
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

// Handle PDF text selection
function handlePDFSelection(action) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (!selectedText) {
    showPDFNotification('Please select some text first', 'warning');
    return;
  }

  // Get selected HTML with formatting
  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());

  // Get page info
  const pageUrl = window.location.href;
  const pageTitle = document.title || 'PDF Document';

  // Create content payload
  const content = {
    type: action,
    dataText: selectedText,
    dataHtml: `<p>${escapeHtml(selectedText)}</p>`,
    pageUrl: pageUrl,
    pageTitle: pageTitle,
    sourceType: 'pdf'
  };

  // Open sidebar with content
  chrome.runtime.sendMessage({
    action: "openSidebarWithContent",
    content: content
  });

  // Clear selection
  selection.removeAllRanges();

  showPDFNotification(`Added to ${action === 'sendToFront' ? 'front' : 'back'}`, 'success');
}

// Extract all text from PDF
function extractAllPDFText() {
  showPDFNotification('Extracting text from PDF...', 'info');

  setTimeout(() => {
    const allText = [];
    
    // Strategy 1: Try textLayer elements (PDF.js)
    const textLayers = document.querySelectorAll('.textLayer');
    console.log('AddFlashcard PDF: Found', textLayers.length, 'text layers');
    
    if (textLayers.length > 0) {
      textLayers.forEach((layer, index) => {
        const pageText = layer.textContent.trim();
        if (pageText) {
          allText.push(`--- Page ${index + 1} ---\n${pageText}\n`);
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
          allText.push(`--- Page ${index + 1} ---\n${pageText}\n`);
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
    
    // Strategy 4: Try entire body (last resort for simple PDFs)
    if (allText.length === 0) {
      console.log('AddFlashcard PDF: Trying body text extraction');
      const bodyText = document.body.textContent.trim();
      if (bodyText && bodyText.length > 100) { // Make sure it's substantial
        allText.push(bodyText);
      }
    }

    if (allText.length === 0) {
      showPDFNotification('No text found in PDF (might be scanned image)', 'error');
      return;
    }

    const fullText = allText.join('\n\n');
    console.log('AddFlashcard PDF: Extracted', fullText.length, 'characters');
    
    // Open sidebar with extracted text
    const content = {
      type: 'sendToBack',
      dataText: fullText,
      dataHtml: `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; line-height: 1.6;">${escapeHtml(fullText)}</pre>`,
      pageUrl: window.location.href,
      pageTitle: document.title || 'PDF Document',
      sourceType: 'pdf-full'
    };

    // Send to content script
    chrome.runtime.sendMessage({
      action: "openSidebarWithContent",
      content: content
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('AddFlashcard PDF: Error sending message:', chrome.runtime.lastError);
        showPDFNotification('Error opening sidebar. Please try again.', 'error');
      } else {
        const pageCount = textLayers.length || 
                         document.querySelectorAll('.page').length || 
                         'all';
        showPDFNotification(`Extracted text from ${pageCount} page(s)`, 'success');
      }
    });
  }, 500);
}

// Enable context menu for PDF
function enablePDFContextMenu() {
  // The context menu is handled by background.js
  // This just ensures text is selectable
  document.addEventListener('contextmenu', (e) => {
    // Allow default context menu on text selection
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      // Text is selected, context menu will be available
      console.log('Text selected in PDF, context menu available');
    }
  });
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
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
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
`;
document.head.appendChild(style);

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPDFSupport);
} else {
  initPDFSupport();
}

console.log('AddFlashcard PDF support script loaded');
