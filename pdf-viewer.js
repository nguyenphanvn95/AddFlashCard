// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdfjs/pdf.worker.min.js');

// Debug marker so you can verify the patched viewer is actually loaded.
// Open DevTools Console on pdf-viewer.html and you should see this log.
console.log('[AddFlashcard] pdf-viewer patch v3 loaded');

// State
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.0;
let rendering = false;
let sidebarOpen = false;
let currentFileName = '';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePDFViewer);

function initializePDFViewer() {
  // Elements
  const fileInput = document.getElementById('file-input');
  const fileUploadArea = document.getElementById('file-upload-area');
  const openFileBtn = document.getElementById('open-file-btn');
  const loading = document.getElementById('loading');
  const canvasContainer = document.getElementById('pdf-canvas-container');
  const pageInput = document.getElementById('page-input');
  const pageCount = document.getElementById('page-count');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const zoomSelect = document.getElementById('zoom-select');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebarContainer = document.getElementById('sidebar-container');
  const pdfTitle = document.getElementById('pdf-title');
  const addToFrontBtn = document.getElementById('add-to-front-btn');
  const addToBackBtn = document.getElementById('add-to-back-btn');
  const fileUploadBtn = document.getElementById('file-upload-btn');

  // Visual marker to confirm this patched version is running
  if (pdfTitle && !pdfTitle.dataset.patched) {
    pdfTitle.dataset.patched = 'v3';
    pdfTitle.textContent = (pdfTitle.textContent || 'PDF Viewer') + ' (patch v3)';
  }

  // Event Listeners
  fileInput.addEventListener('change', handleFileSelect);
  fileUploadBtn.addEventListener('click', () => fileInput.click());
  openFileBtn.addEventListener('click', () => fileInput.click());
  prevPageBtn.addEventListener('click', () => changePage(-1));
  nextPageBtn.addEventListener('click', () => changePage(1));
  pageInput.addEventListener('change', () => goToPage(parseInt(pageInput.value)));
  zoomSelect.addEventListener('change', handleZoomChange);
  zoomInBtn.addEventListener('click', () => changeZoom(0.25));
  zoomOutBtn.addEventListener('click', () => changeZoom(-0.25));
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
  addToFrontBtn.addEventListener('click', () => handleSelection('front'));
  addToBackBtn.addEventListener('click', () => handleSelection('back'));

  // Drag & Drop
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      loadPDF(files[0]);
    }
  });

  // Text Selection Handler
  document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && pdfDoc) {
      addToFrontBtn.style.display = 'flex';
      addToBackBtn.style.display = 'flex';
    } else {
      addToFrontBtn.style.display = 'none';
      addToBackBtn.style.display = 'none';
    }
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    const key = (e.key || '').toLowerCase();
    if (e.altKey && key === 'a') {
      e.preventDefault();
      handleSelection('front');
    } else if (e.altKey && key === 'b') {
      e.preventDefault();
      handleSelection('back');
    } else if (e.key === 'ArrowLeft' && pdfDoc) {
      changePage(-1);
    } else if (e.key === 'ArrowRight' && pdfDoc) {
      changePage(1);
    }
  });

  // Check if opened with file parameter
  const urlParams = new URLSearchParams(window.location.search);
  const fileParam = urlParams.get('file');
  
  if (fileParam) {
    // If opened via context menu with file
    fetch(fileParam)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        loadPDF(file);
      })
      .catch(err => {
        console.error('Error loading file:', err);
      });
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
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
}

// Handle File Selection
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.type === 'application/pdf') {
    loadPDF(file);
  }
}

// Load PDF
async function loadPDF(file) {
  const loading = document.getElementById('loading');
  const fileUploadArea = document.getElementById('file-upload-area');
  const canvasContainer = document.getElementById('pdf-canvas-container');
  const pageCount = document.getElementById('page-count');
  const pageInput = document.getElementById('page-input');
  const pdfTitle = document.getElementById('pdf-title');

  try {
    loading.style.display = 'block';
    fileUploadArea.classList.add('hidden');
    canvasContainer.innerHTML = '';
    currentFileName = file.name;
    pdfTitle.textContent = currentFileName;

    const fileReader = new FileReader();
    fileReader.onload = async function(e) {
      const typedarray = new Uint8Array(e.target.result);
      
      pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
      totalPages = pdfDoc.numPages;
      
      pageCount.textContent = `/ ${totalPages}`;
      pageInput.max = totalPages;
      
      // Render all pages
      await renderAllPages();
      
      loading.style.display = 'none';
      updatePageControls();
    };
    
    fileReader.readAsArrayBuffer(file);
  } catch (error) {
    console.error('Error loading PDF:', error);
    alert('Lỗi khi tải PDF. Vui lòng thử lại.');
    loading.style.display = 'none';
  }
}

// Render All Pages
async function renderAllPages() {
  const canvasContainer = document.getElementById('pdf-canvas-container');
  canvasContainer.innerHTML = '';
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    await renderPage(pageNum);
  }
}

// Render Single Page
async function renderPage(pageNum) {
  const canvasContainer = document.getElementById('pdf-canvas-container');

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale });
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-wrapper';
    wrapper.dataset.pageNum = pageNum;
    wrapper.style.width = viewport.width + 'px';
    wrapper.style.height = viewport.height + 'px';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page-canvas';
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render PDF page on canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    await page.render(renderContext).promise;
    
    // Create text layer (must share the same coordinate space as the canvas)
    const textLayerDiv = document.createElement('div');
    // Add both custom class and pdf.js default class for better compatibility
    textLayerDiv.className = 'pdf-text-layer textLayer';

    // Use pdf.js helper to set dimensions. Also set --scale-factor because
    // PDF.js uses it to correctly position text spans (esp. when zoom changes).
    try {
      pdfjsLib.setLayerDimensions(textLayerDiv, viewport);
    } catch (err) {
      // Fallback to manual sizing when helper is unavailable
      textLayerDiv.style.width = viewport.width + 'px';
      textLayerDiv.style.height = viewport.height + 'px';
    }

    // Critical: keep CSS scale factor in sync with viewport.scale
    textLayerDiv.style.setProperty('--scale-factor', String(viewport.scale || scale || 1));

    // Render text layer
    const textContent = await page.getTextContent();
    // Await so the DOM is fully ready before user interacts (selection, etc.)
    await pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
      textDivs: [],
      enhanceTextSelection: true
    }).promise;
    
    wrapper.appendChild(canvas);
    wrapper.appendChild(textLayerDiv);
    canvasContainer.appendChild(wrapper);
  } catch (error) {
    console.error('Error rendering page:', error);
  }
}

// Change Page
function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    goToPage(newPage);
  }
}

// Go to Page
function goToPage(pageNum) {
  const pageInput = document.getElementById('page-input');

  if (pageNum < 1 || pageNum > totalPages) return;
  
  currentPage = pageNum;
  pageInput.value = currentPage;
  
  // Scroll to page
  const pageWrapper = document.querySelector(`[data-page-num="${currentPage}"]`);
  if (pageWrapper) {
    pageWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  updatePageControls();
}

// Update Page Controls
function updatePageControls() {
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// Handle Zoom Change
async function handleZoomChange() {
  const zoomSelect = document.getElementById('zoom-select');
  const value = zoomSelect.value;
  
  if (value === 'page-fit' || value === 'page-width') {
    // Calculate appropriate scale
    const containerWidth = document.getElementById('pdf-viewer-container').clientWidth;
    const firstPage = await pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });
    
    if (value === 'page-width') {
      scale = (containerWidth - 40) / viewport.width;
    } else {
      const containerHeight = document.getElementById('pdf-viewer-container').clientHeight;
      const scaleWidth = (containerWidth - 40) / viewport.width;
      const scaleHeight = (containerHeight - 40) / viewport.height;
      scale = Math.min(scaleWidth, scaleHeight);
    }
  } else {
    scale = parseFloat(value);
  }
  
  await renderAllPages();
}

// Change Zoom
function changeZoom(delta) {
  const zoomSelect = document.getElementById('zoom-select');

  scale = Math.max(0.25, Math.min(3, scale + delta));
  zoomSelect.value = scale;
  renderAllPages();
}

// Toggle Sidebar
function toggleSidebar() {
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebarContainer = document.getElementById('sidebar-container');

  sidebarOpen = !sidebarOpen;
  sidebarContainer.classList.toggle('active', sidebarOpen);
  toggleSidebarBtn.textContent = sidebarOpen ? '✖ Đóng Sidebar' : '📝 Sidebar';
}

// Handle Selection
function handleSelection(position) {
  const addToFrontBtn = document.getElementById('add-to-front-btn');
  const addToBackBtn = document.getElementById('add-to-back-btn');

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    alert('Vui lòng chọn văn bản trước!');
    return;
  }
  
  // Open sidebar if not open
  if (!sidebarOpen) {
    toggleSidebar();
  }
  
  // Send data to sidebar
  const sidebarIframe = document.getElementById('sidebar-iframe');
  const content = {
    type: position === 'front' ? 'sendToFront' : 'sendToBack',
    dataText: selectedText,
    dataHtml: `<p>${escapeHtml(selectedText)}</p>`,
    pageUrl: currentFileName,
    pageTitle: `${currentFileName} - Page ${currentPage}`,
    sourceType: 'pdf-viewer'
  };
  
  // Post message to sidebar iframe using the new-style actions the sidebar expects
  setTimeout(() => {
    const action = position === 'front' ? 'addToFront' : 'addToBack';
    // Send the HTML payload and mark it as HTML so sidebar inserts it correctly
    sidebarIframe.contentWindow.postMessage({
      action: action,
      content: content.dataHtml,
      isHtml: true,
      meta: {
        pageUrl: content.pageUrl,
        pageTitle: content.pageTitle,
        sourceType: content.sourceType
      }
    }, '*');
  }, 300);
  
  // Clear selection
  selection.removeAllRanges();
  
  // Hide FABs
  addToFrontBtn.style.display = 'none';
  addToBackBtn.style.display = 'none';
  
  // Show notification
  showNotification(`Đã thêm vào ${position === 'front' ? 'Front' : 'Back'}`, 'success');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : '#1a73e8'};
    color: white;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
