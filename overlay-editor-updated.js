// Overlay Editor - Updated to use unified library
// File này thay thế overlay-editor.js cũ

if (!window.__afc_overlay_loaded) {
  window.__afc_overlay_loaded = true;

  let overlayCanvas, overlayCtx;
  let overlayImg = new Image();
  let overlayOcclusions = [];
  let selectedOverlayOcclusion = null;
  let currentOverlayTool = 'rect';
  let isOverlayDrawing = false;
  let overlayStartX, overlayStartY;
  let occlusionHideMode = 'none'; // 'none', 'all', or '1', '2', '3'... for specific occlusion index

// Khởi tạo canvas trong overlay
function initializeCanvas(imageData) {
  overlayCanvas = document.getElementById('anki-overlay-canvas');
  if (!overlayCanvas) return;
  
  overlayCtx = overlayCanvas.getContext('2d');
  
  overlayImg.onload = () => {
    overlayCanvas.width = overlayImg.width;
    overlayCanvas.height = overlayImg.height;
    
    redrawOverlay();
    setupOverlayCanvasEvents();
  };
  
  overlayImg.src = imageData;
  
  // Set default title
  const titleInput = document.getElementById('anki-card-title');
  if (titleInput) {
    titleInput.value = document.title || 'Anki Card';
  }
}

// Setup canvas events
function setupOverlayCanvasEvents() {
  overlayCanvas.addEventListener('mousedown', onOverlayCanvasMouseDown);
  overlayCanvas.addEventListener('mousemove', onOverlayCanvasMouseMove);
  overlayCanvas.addEventListener('mouseup', onOverlayCanvasMouseUp);
  
  document.addEventListener('keydown', onOverlayKeyDown);
}

// Vẽ lại canvas
function redrawOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  overlayCtx.drawImage(overlayImg, 0, 0);
  
  overlayOcclusions.forEach((occ, index) => {
    occ._num = index + 1;
    drawOverlayOcclusion(occ, index === selectedOverlayOcclusion);
  });
  
  updateOverlayOcclusionCount();
  
  // Notify content script to update hide selector options
  try {
    if (typeof window._updateHideSelectorOptions === 'function') {
      window._updateHideSelectorOptions();
    }
  } catch (e) {}
}

// Vẽ một khối che
function drawOverlayOcclusion(occ, isSelected) {
  overlayCtx.save();
  
  overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  
  if (occ.type === 'rect') {
    overlayCtx.fillRect(occ.x, occ.y, occ.width, occ.height);
  } else if (occ.type === 'ellipse') {
    overlayCtx.beginPath();
    overlayCtx.ellipse(
      occ.x + occ.width / 2,
      occ.y + occ.height / 2,
      Math.abs(occ.width / 2),
      Math.abs(occ.height / 2),
      0, 0, 2 * Math.PI
    );
    overlayCtx.fill();
  }
  
  // Border
  if (isSelected) {
    overlayCtx.strokeStyle = '#ff6b6b';
    overlayCtx.lineWidth = 3;
  } else {
    overlayCtx.strokeStyle = '#007bff';
    overlayCtx.lineWidth = 2;
  }
  
  if (occ.type === 'rect') {
    overlayCtx.strokeRect(occ.x, occ.y, occ.width, occ.height);
  } else if (occ.type === 'ellipse') {
    overlayCtx.beginPath();
    overlayCtx.ellipse(
      occ.x + occ.width / 2,
      occ.y + occ.height / 2,
      Math.abs(occ.width / 2),
      Math.abs(occ.height / 2),
      0, 0, 2 * Math.PI
    );
    overlayCtx.stroke();
  }
  
  // Draw index label
  if (occ._num) {
    const label = String(occ._num);
    // Center the number inside the occlusion block (even when width/height are negative)
    const cx = occ.x + occ.width / 2;
    const cy = occ.y + occ.height / 2;

    overlayCtx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    overlayCtx.textAlign = 'center';
    overlayCtx.textBaseline = 'middle';

    const metrics = overlayCtx.measureText(label);
    const tw = metrics.width;
    const th = 14; // approx font px
    const padX = 8;
    const padY = 6;

    // Backdrop
    overlayCtx.fillStyle = 'rgba(0,0,0,0.6)';
    overlayCtx.fillRect(cx - (tw / 2) - padX, cy - (th / 2) - padY, tw + padX * 2, th + padY * 2);

    // Text
    overlayCtx.fillStyle = '#fff';
    overlayCtx.fillText(label, cx, cy);
  }
  
  overlayCtx.restore();
}

// Canvas mouse events
function onOverlayCanvasMouseDown(e) {
  const rect = overlayCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (overlayCanvas.width / rect.width);
  const y = (e.clientY - rect.top) * (overlayCanvas.height / rect.height);
  
  const clickedIndex = findOverlayOcclusionAt(x, y);
  if (clickedIndex !== -1) {
    selectedOverlayOcclusion = clickedIndex;
    redrawOverlay();
    return;
  }
  
  selectedOverlayOcclusion = null;
  isOverlayDrawing = true;
  overlayStartX = x;
  overlayStartY = y;
}

function onOverlayCanvasMouseMove(e) {
  if (!isOverlayDrawing) return;
  
  const rect = overlayCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (overlayCanvas.width / rect.width);
  const y = (e.clientY - rect.top) * (overlayCanvas.height / rect.height);
  
  redrawOverlay();
  
  const width = x - overlayStartX;
  const height = y - overlayStartY;
  
  drawOverlayOcclusion({
    type: currentOverlayTool,
    x: overlayStartX,
    y: overlayStartY,
    width: width,
    height: height
  }, false);
}

function onOverlayCanvasMouseUp(e) {
  if (!isOverlayDrawing) return;
  
  const rect = overlayCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (overlayCanvas.width / rect.width);
  const y = (e.clientY - rect.top) * (overlayCanvas.height / rect.height);
  
  const width = x - overlayStartX;
  const height = y - overlayStartY;
  
  if (Math.abs(width) > 10 && Math.abs(height) > 10) {
    overlayOcclusions.push({
      type: currentOverlayTool,
      x: overlayStartX,
      y: overlayStartY,
      width: width,
      height: height
    });
  }
  
  isOverlayDrawing = false;
  redrawOverlay();
}

function onOverlayKeyDown(e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelectedOcclusion();
  }
}

// Tìm khối che tại vị trí
function findOverlayOcclusionAt(x, y) {
  for (let i = overlayOcclusions.length - 1; i >= 0; i--) {
    const occ = overlayOcclusions[i];
    
    if (occ.type === 'rect') {
      const minX = Math.min(occ.x, occ.x + occ.width);
      const maxX = Math.max(occ.x, occ.x + occ.width);
      const minY = Math.min(occ.y, occ.y + occ.height);
      const maxY = Math.max(occ.y, occ.y + occ.height);
      
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return i;
      }
    } else if (occ.type === 'ellipse') {
      const cx = occ.x + occ.width / 2;
      const cy = occ.y + occ.height / 2;
      const rx = Math.abs(occ.width / 2);
      const ry = Math.abs(occ.height / 2);
      
      const normalized = Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2);
      if (normalized <= 1) {
        return i;
      }
    }
  }
  
  return -1;
}

// Chọn công cụ
function selectOverlayTool(tool, button) {
  currentOverlayTool = tool;
  
  // Update UI
  document.querySelectorAll('.anki-tool-btn').forEach(btn => {
    btn.style.background = 'white';
    btn.style.color = '#555';
    btn.style.borderColor = '#ddd';
  });
  
  if (button) {
    button.style.background = '#667eea';
    button.style.color = 'white';
    button.style.borderColor = '#667eea';
  }
}

// Xóa khối được chọn
function deleteSelectedOcclusion() {
  if (selectedOverlayOcclusion !== null) {
    overlayOcclusions.splice(selectedOverlayOcclusion, 1);
    selectedOverlayOcclusion = null;
    redrawOverlay();
  }
}

// Xóa tất cả
function clearAllOcclusions() {
  if (overlayOcclusions.length === 0) return;
  
  if (confirm('Bạn có chắc muốn xóa tất cả các khối che?')) {
    overlayOcclusions = [];
    selectedOverlayOcclusion = null;
    redrawOverlay();
  }
}

// Update số lượng khối
function updateOverlayOcclusionCount() {
  const countEl = document.getElementById('anki-occlusion-count');
  if (countEl) {
    let text = `Khối: ${overlayOcclusions.length}`;
    if (occlusionHideMode !== 'none') {
      text += ` (Ẩn: ${occlusionHideMode === 'all' ? 'Tất cả' : 'Khối ' + occlusionHideMode})`;
    }
    countEl.textContent = text;
  }
}

// Get occlusions to draw during export (apply hide mode)
function getVisibleOcclusions() {
    return overlayOcclusions.slice();
  }


// Set hide mode
function setOcclusionHideMode() { /* deprecated */ }

// ============================================================================
// XUẤT ANKI OVERLAY - SỬ DỤNG THƯ VIỆN THỐNG NHẤT
// ============================================================================

async function exportOverlayAnki() {
  if (!overlayOcclusions || overlayOcclusions.length === 0) {
    alert('Vui lòng vẽ ít nhất một khối che mờ!');
    return;
  }

  const titleInput = document.getElementById('anki-card-title');
  const cardTitle = titleInput ? (titleInput.value || 'Anki Card') : 'Anki Card';

  const exportBtn = document.getElementById('exportBtn');
  const origText = exportBtn ? exportBtn.textContent : null;
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Đang xuất...';
  }

  try {
    // Wait for unified export helpers (up to 10s)
    const start = Date.now();
    while (Date.now() - start < 10000) {
      if (typeof createApkgMultiCard === 'function' && typeof createOccludedImageFromOverlay === 'function' && typeof createOriginalImageFromOverlay === 'function') break;
      await new Promise(r => setTimeout(r, 250));
    }
    if (typeof createApkgMultiCard !== 'function') {
      throw new Error('Hàm xuất không sẵn sàng (createApkgMultiCard).');
    }

    // Answer image (original)
    const originalBlob = await createOriginalImageFromOverlay(overlayCanvas, overlayImg);

    // Question images: mỗi block = 1 thẻ (Hide 1)
    const questionBlobs = [];
    for (let i = 0; i < overlayOcclusions.length; i++) {
      const qBlob = await createOccludedImageFromOverlay(overlayCanvas, overlayImg, [overlayOcclusions[i]]);
      questionBlobs.push(qBlob);
    }

    await createApkgMultiCard(cardTitle, originalBlob, questionBlobs);

    showSuccessNotification();

    // Auto close
    setTimeout(() => {
      const overlay = document.getElementById('ankiOverlayEditor');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 800);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Lỗi khi xuất file: ' + (err && err.message ? err.message : String(err)));
    throw err;
  } finally {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = origText || 'Xuất .apkg';
    }
  }
}

function showSuccessNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    padding: 30px 50px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 600;
    z-index: 2147483648;
    box-shadow: 0 10px 40px rgba(40, 167, 69, 0.4);
    animation: successPulse 0.5s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 32px;">✅</span>
      <span>Đã xuất file .apkg thành công!</span>
    </div>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes successPulse {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      50% { transform: translate(-50%, -50%) scale(1.05); }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }, 1500);
}

// Export functions to global scope cho content.js
  window.initializeCanvas = initializeCanvas;
  window.selectOverlayTool = selectOverlayTool;
  window.deleteSelectedOcclusion = deleteSelectedOcclusion;
  window.clearAllOcclusions = clearAllOcclusions;
  window.exportOverlayAnki = exportOverlayAnki;
  window.setOcclusionHideMode = setOcclusionHideMode;
  window.getVisibleOcclusions = getVisibleOcclusions;
  
  // Export data for content script to read
  Object.defineProperty(window, 'overlayOcclusions', {
    get() { return overlayOcclusions; }
  });
}

// ===== AFC bridge for content script (isolated world) =====
(function(){
  function _afcDispatchResult(detail) {
    try { window.dispatchEvent(new CustomEvent('AFC_OVERLAY_RESULT', { detail })); } catch(e) {}
  }

  window.addEventListener('AFC_OVERLAY_CMD', async (ev) => {
    const d = (ev && ev.detail) ? ev.detail : {};
    const reqId = d.reqId || null;
    try {
      switch (d.cmd) {
        case 'selectTool':
          selectOverlayTool(d.tool || 'rect');
          _afcDispatchResult({ ok: true, reqId });
          break;
        case 'deleteSelected':
          deleteSelectedOcclusion();
          _afcDispatchResult({ ok: true, reqId });
          break;
        case 'clearAll':
          clearAllOcclusions();
          _afcDispatchResult({ ok: true, reqId });
          break;
        case 'exportApkg':
          await exportOverlayAnki();
          _afcDispatchResult({ ok: true, reqId });
          break;
        default:
          _afcDispatchResult({ ok: false, reqId, message: 'Unknown command' });
      }
    } catch (e) {
      _afcDispatchResult({ ok: false, reqId, message: e && e.message ? e.message : String(e) });
    }
  });

  try { document.documentElement.setAttribute('data-afc-overlay-ready', '1'); } catch(e) {}
})();
