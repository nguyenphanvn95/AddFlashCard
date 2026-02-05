// Editor.js - Updated to use unified library (v2.1)
// Compatible with existing HTML structure

let canvas, ctx;
let img = new Image();
let occlusions = [];
let selectedOcclusion = null;
let currentTool = 'rect';
let isDrawing = false;
let startX, startY;
let pageTitle = '';

// Khởi tạo editor
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  
  setupEventListeners();
  
  // Nhận dữ liệu ảnh từ background
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'loadImage') {
      loadImage(request.imageData, request.pageTitle);
      // If occlusions were passed from overlay, apply them
      if (request.occlusions && Array.isArray(request.occlusions) && request.occlusions.length > 0) {
        occlusions = request.occlusions.slice();
        redraw();
        updateStatus('Occlusions đã được nạp từ overlay.');
      }

      // If caller requested immediate export, attempt it (editor has the unified export lib)
      if (request.autoExport) {
        // Wait a bit for image to render
        setTimeout(() => {
          autoExportSingleCard().catch(err => {
            console.error('Auto export failed:', err);
            updateStatus('Tự động xuất thất bại: ' + (err && err.message ? err.message : err));
          });
        }, 300);
      }
    }
  });

// Auto-export helper for single-card case (overlay -> editor fallback)
async function autoExportSingleCard() {
  if (!occlusions || occlusions.length === 0) {
    throw new Error('Không có occlusion để xuất.');
  }

  const cardTitle = document.getElementById('cardTitle').value || pageTitle || 'Anki Card';

  // Create original and occluded blobs from current canvas/image
  const originalBlob = await (async () => {
    const t = document.createElement('canvas');
    t.width = canvas.width;
    t.height = canvas.height;
    const tctx = t.getContext('2d');
    tctx.drawImage(img, 0, 0);
    return await canvasToBlob(t);
  })();

  const occludedBlob = await (async () => {
    const t = document.createElement('canvas');
    t.width = canvas.width;
    t.height = canvas.height;
    const tctx = t.getContext('2d');
    tctx.drawImage(img, 0, 0);
    tctx.fillStyle = 'rgba(0,0,0,0.85)';
    occlusions.forEach(occ => {
      if (occ.type === 'rect') {
        tctx.fillRect(occ.x, occ.y, occ.width, occ.height);
      } else if (occ.type === 'ellipse') {
        tctx.beginPath();
        tctx.ellipse(
          occ.x + occ.width / 2,
          occ.y + occ.height / 2,
          Math.abs(occ.width / 2),
          Math.abs(occ.height / 2),
          0, 0, 2 * Math.PI
        );
        tctx.fill();
      }
    });
    return await canvasToBlob(t);
  })();

  updateStatus('Đang xuất .apkg ...');

  // Wait for createApkgSingleCard from the unified library
  const start = Date.now();
  while (Date.now() - start < 5000) {
    if (typeof createApkgSingleCard === 'function') break;
    await new Promise(r => setTimeout(r, 200));
  }

  if (typeof createApkgSingleCard !== 'function') {
    throw new Error('Hàm tạo .apkg chưa sẵn sàng trong trình chỉnh sửa.');
  }

  await createApkgSingleCard(cardTitle, originalBlob, occludedBlob);
  updateStatus('Đã xuất .apkg thành công.');
}
});

// Setup event listeners
function setupEventListeners() {
  // Tool buttons
  document.getElementById('drawRectBtn').addEventListener('click', () => selectTool('rect'));
  document.getElementById('drawEllipseBtn').addEventListener('click', () => selectTool('ellipse'));
  document.getElementById('deleteBtn').addEventListener('click', deleteSelected);
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  document.getElementById('exportBtn').addEventListener('click', () => {
    // Sử dụng hàm từ anki-export-unified.js
    exportAnkiMultiCard();
  });
  
  // Canvas events
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseup', onCanvasMouseUp);
  
  // Keyboard events
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelected();
    } else if (e.key === 'Escape') {
      selectedOcclusion = null;
      redraw();
    }
  });
}

// Load ảnh
function loadImage(dataUrl, title) {
  pageTitle = title || 'Anki Card';
  document.getElementById('cardTitle').value = pageTitle;
  
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    redraw();
    updateStatus('Ảnh đã được tải. Bắt đầu vẽ khối che mờ.');
  };
  
  img.src = dataUrl;
}

// Chọn công cụ
function selectTool(tool) {
  currentTool = tool;
  
  // Update UI
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (tool === 'rect') {
    document.getElementById('drawRectBtn').classList.add('active');
  } else if (tool === 'ellipse') {
    document.getElementById('drawEllipseBtn').classList.add('active');
  }
  
  updateStatus('Công cụ: ' + (tool === 'rect' ? 'Hình chữ nhật' : 'Ellipse'));
}

// Vẽ lại canvas
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (img) {
    ctx.drawImage(img, 0, 0);
  }
  
  occlusions.forEach((occ, index) => {
    occ._num = index + 1;
    drawOcclusion(occ, index === selectedOcclusion);
  });
  
  updateOcclusionCount();
}

// Vẽ một khối che
function drawOcclusion(occ, isSelected) {
  ctx.save();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  
  if (occ.type === 'rect') {
    ctx.fillRect(occ.x, occ.y, occ.width, occ.height);
  } else if (occ.type === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(
      occ.x + occ.width / 2,
      occ.y + occ.height / 2,
      Math.abs(occ.width / 2),
      Math.abs(occ.height / 2),
      0, 0, 2 * Math.PI
    );
    ctx.fill();
  }
  
  // Border
  if (isSelected) {
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
  }
  
  if (occ.type === 'rect') {
    ctx.strokeRect(occ.x, occ.y, occ.width, occ.height);
  } else if (occ.type === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(
      occ.x + occ.width / 2,
      occ.y + occ.height / 2,
      Math.abs(occ.width / 2),
      Math.abs(occ.height / 2),
      0, 0, 2 * Math.PI
    );
    ctx.stroke();
  }
  
  // Draw index label
  if (occ._num) {
    const label = String(occ._num);
    const px = occ.x + 6;
    const py = occ.y + 16;
    ctx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const tw = ctx.measureText(label).width;
    ctx.fillRect(px - 4, py - 14, tw + 8, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, px, py);
  }
  
  ctx.restore();
}

// Canvas mouse events
function onCanvasMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  const clickedIndex = findOcclusionAt(x, y);
  if (clickedIndex !== -1) {
    selectedOcclusion = clickedIndex;
    redraw();
    updateStatus('Đã chọn khối che. Nhấn Delete để xóa.');
    return;
  }
  
  selectedOcclusion = null;
  isDrawing = true;
  startX = x;
  startY = y;
}

function onCanvasMouseMove(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  redraw();
  
  const width = x - startX;
  const height = y - startY;
  
  drawOcclusion({
    type: currentTool,
    x: startX,
    y: startY,
    width: width,
    height: height
  }, false);
}

function onCanvasMouseUp(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  const width = x - startX;
  const height = y - startY;
  
  if (Math.abs(width) > 10 && Math.abs(height) > 10) {
    occlusions.push({
      type: currentTool,
      x: startX,
      y: startY,
      width: width,
      height: height
    });
    
    updateStatus('Đã thêm khối che mới.');
  }
  
  isDrawing = false;
  redraw();
}

// Tìm occlusion tại vị trí
function findOcclusionAt(x, y) {
  for (let i = occlusions.length - 1; i >= 0; i--) {
    const occ = occlusions[i];
    
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

// Xóa occlusion được chọn
function deleteSelected() {
  if (selectedOcclusion !== null) {
    occlusions.splice(selectedOcclusion, 1);
    selectedOcclusion = null;
    redraw();
    updateStatus('Đã xóa khối che.');
  }
}

// Xóa tất cả
function clearAll() {
  if (occlusions.length === 0) return;
  
  if (confirm('Bạn có chắc muốn xóa tất cả các khối che?')) {
    occlusions = [];
    selectedOcclusion = null;
    redraw();
    updateStatus('Đã xóa tất cả khối che.');
  }
}

// Update status
function updateStatus(text) {
  const statusEl = document.getElementById('statusText');
  if (statusEl) {
    statusEl.textContent = text;
  }
}

// Update occlusion count
function updateOcclusionCount() {
  const countEl = document.getElementById('occlusionCount');
  if (countEl) {
    countEl.textContent = `Số khối: ${occlusions.length}`;
  }
}
