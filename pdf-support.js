// PDF Support Script - Extract text and create flashcards from PDFs
// This script works with PDF.js viewer to enable text selection and flashcard creation

let pdfSyncButton = null;

// Initialize PDF support
function initPDFSupport() {
  // Check if we're on a PDF page
  if (!isPDFPage()) {
    return;
  }

  console.log('PDF page detected, initializing AddFlashcard PDF support');
  
  // Wait for PDF to load
  waitForPDFLoad();
}

// Check if current page is a PDF
function isPDFPage() {
  // Check for PDF.js viewer
  if (document.querySelector('#viewer') || document.querySelector('.pdfViewer')) {
    return true;
  }
  
  // Check for embedded PDF
  if (document.querySelector('embed[type="application/pdf"]') || 
      document.querySelector('object[type="application/pdf"]')) {
    return true;
  }
  
  // Check URL
  if (window.location.href.toLowerCase().includes('.pdf') ||
      window.location.href.includes('pdfjs.action=download')) {
    return true;
  }
  
  return false;
}

// Wait for PDF to fully load
function waitForPDFLoad() {
  const checkInterval = setInterval(() => {
    const textLayer = document.querySelector('.textLayer');
    const pdfViewer = document.querySelector('.pdfViewer');
    
    if (textLayer || pdfViewer) {
      clearInterval(checkInterval);
      setupPDFFeatures();
    }
  }, 500);
  
  // Stop checking after 30 seconds
  setTimeout(() => clearInterval(checkInterval), 30000);
}

// Setup PDF-specific features
function setupPDFFeatures() {
  // Inject floating toolbar for PDF
  injectPDFToolbar();
  
  // Enable text selection context menu
  enablePDFContextMenu();
  
  console.log('AddFlashcard PDF features enabled');
}

// Inject floating toolbar for PDF pages
function injectPDFToolbar() {
  // Check if toolbar already exists
  if (document.querySelector('#addflashcard-pdf-toolbar')) {
    return;
  }

  const toolbar = document.createElement('div');
  toolbar.id = 'addflashcard-pdf-toolbar';
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
    z-index: 10000;
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
  const extractBtn = createToolbarButton('Extract All Text', 'rgb(255, 152, 0)', () => {
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
    
    // Try different selectors for PDF text
    const textLayers = document.querySelectorAll('.textLayer');
    
    if (textLayers.length > 0) {
      textLayers.forEach((layer, index) => {
        const pageText = layer.textContent.trim();
        if (pageText) {
          allText.push(`--- Page ${index + 1} ---\n${pageText}\n`);
        }
      });
    } else {
      // Fallback: try to get any visible text
      const viewer = document.querySelector('#viewer') || document.querySelector('.pdfViewer');
      if (viewer) {
        allText.push(viewer.textContent.trim());
      }
    }

    if (allText.length === 0) {
      showPDFNotification('No text found in PDF', 'error');
      return;
    }

    const fullText = allText.join('\n\n');
    
    // Open sidebar with extracted text
    const content = {
      type: 'sendToBack',
      dataText: fullText,
      dataHtml: `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${escapeHtml(fullText)}</pre>`,
      pageUrl: window.location.href,
      pageTitle: document.title || 'PDF Document',
      sourceType: 'pdf-full'
    };

    chrome.runtime.sendMessage({
      action: "openSidebarWithContent",
      content: content
    });

    showPDFNotification(`Extracted text from ${textLayers.length} pages`, 'success');
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
