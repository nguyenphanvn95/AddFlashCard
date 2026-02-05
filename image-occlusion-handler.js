// Image Occlusion Handler - Xử lý ảnh trong Front/Back area
// Tích hợp với AddFlashcard sidebar

(function() {
  'use strict';

  // Biến global cho Image Occlusion
  let imageOcclusionData = {
    originalImage: null,
    occludedImage: null,
    isProcessing: false
  };

  // Hàm init khi sidebar được tạo
  function initImageOcclusionHandler() {
    console.log('Image Occlusion Handler initialized');
    
    // Theo dõi khi ảnh được paste hoặc thêm vào Front/Back area
    observeImageInEditor();
  }

  // Theo dõi ảnh trong editor
  function observeImageInEditor() {
    // Tìm Front và Back area
    const checkAreas = setInterval(() => {
      const frontArea = document.querySelector('#front-content, [contenteditable="true"]');
      const backArea = document.querySelector('#back-content, [contenteditable="true"]');
      
      if (frontArea && backArea) {
        clearInterval(checkAreas);
        
        // Setup observer cho cả 2 areas
        setupImageClickHandler(frontArea, 'Front');
        setupImageClickHandler(backArea, 'Back');
      }
    }, 500);
    
    // Clear sau 10s nếu không tìm thấy
    setTimeout(() => clearInterval(checkAreas), 10000);
  }

  // Setup click handler cho ảnh
  function setupImageClickHandler(area, areaName) {
    console.log(`Setting up Image Occlusion for ${areaName} area`);
    
    area.addEventListener('click', (e) => {
      const target = e.target;
      
      // Kiểm tra nếu click vào ảnh
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        
        // Hiển thị menu cho ảnh
        showImageMenu(target, areaName);
      }
    });
    
    // Cũng theo dõi khi paste ảnh
    area.addEventListener('paste', (e) => {
      setTimeout(() => {
        const images = area.querySelectorAll('img');
        images.forEach(img => {
          if (!img.dataset.occlusionSetup) {
            img.dataset.occlusionSetup = 'true';
            // Tự động hiển thị tooltip khi paste ảnh mới
            showImageTooltip(img, areaName);
          }
        });
      }, 100);
    });
  }

  // Hiển thị menu cho ảnh
  function showImageMenu(imgElement, areaName) {
    // Xóa menu cũ nếu có
    const oldMenu = document.getElementById('io-image-menu');
    if (oldMenu) oldMenu.remove();
    
    // Tạo menu mới
    const menu = document.createElement('div');
    menu.id = 'io-image-menu';
    menu.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid #5a67d8;
      border-radius: 12px;
      padding: 15px;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: white;
      min-width: 250px;
    `;
    
    // Tính toán vị trí
    const rect = imgElement.getBoundingClientRect();
    menu.style.left = `${rect.right + 10}px`;
    menu.style.top = `${rect.top}px`;
    
    menu.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 12px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
        <span>🖼️</span>
        <span>Image Occlusion</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="io-menu-btn" data-action="create-occlusion" style="padding: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 13px; transition: all 0.3s; text-align: left;">
          ✏️ Tạo Image Occlusion
        </button>
        <button class="io-menu-btn" data-action="view-image" style="padding: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 13px; transition: all 0.3s; text-align: left;">
          👁️ Xem ảnh gốc
        </button>
        <button class="io-menu-btn" data-action="remove" style="padding: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; cursor: pointer; font-size: 13px; transition: all 0.3s; text-align: left;">
          🗑️ Xóa ảnh
        </button>
      </div>
      <button class="io-close-menu" style="margin-top: 10px; width: 100%; padding: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; cursor: pointer; font-size: 12px;">
        Đóng
      </button>
    `;
    
    document.body.appendChild(menu);
    
    // Xử lý hover effect
    menu.querySelectorAll('.io-menu-btn').forEach(btn => {
      btn.addEventListener('mouseenter', (e) => {
        e.target.style.background = 'rgba(255,255,255,0.3)';
        e.target.style.transform = 'translateX(5px)';
      });
      btn.addEventListener('mouseleave', (e) => {
        e.target.style.background = 'rgba(255,255,255,0.2)';
        e.target.style.transform = 'translateX(0)';
      });
    });
    
    // Xử lý click actions
    menu.querySelector('[data-action="create-occlusion"]').addEventListener('click', () => {
      menu.remove();
      createImageOcclusion(imgElement, areaName);
    });
    
    menu.querySelector('[data-action="view-image"]').addEventListener('click', () => {
      menu.remove();
      viewFullImage(imgElement);
    });
    
    menu.querySelector('[data-action="remove"]').addEventListener('click', () => {
      menu.remove();
      if (confirm('Bạn có chắc muốn xóa ảnh này?')) {
        imgElement.remove();
      }
    });
    
    menu.querySelector('.io-close-menu').addEventListener('click', () => {
      menu.remove();
    });
    
    // Đóng menu khi click bên ngoài
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== imgElement) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  // Hiển thị tooltip cho ảnh mới
  function showImageTooltip(imgElement, areaName) {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: 2px solid #ff7eb3;
      border-radius: 8px;
      padding: 10px 15px;
      color: white;
      font-size: 12px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: fadeInOut 3s ease-in-out;
    `;
    
    const rect = imgElement.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
    
    tooltip.textContent = '💡 Click vào ảnh để tạo Image Occlusion';
    
    // Thêm animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(tooltip);
    
    // Tự động xóa sau 3s
    setTimeout(() => tooltip.remove(), 3000);
  }

  // Tạo Image Occlusion từ ảnh
  function createImageOcclusion(imgElement, areaName) {
    if (imageOcclusionData.isProcessing) {
      alert('Đang xử lý, vui lòng đợi...');
      return;
    }
    
    imageOcclusionData.isProcessing = true;
    
    // Lấy src của ảnh
    const imageSrc = imgElement.src;
    
    // Hiển thị loading
    const loading = showLoadingOverlay('Đang chuẩn bị Image Occlusion...');
    
    // Gửi message để mở overlay editor
    chrome.runtime.sendMessage({
      action: 'showOverlayWithImage',
      imageData: imageSrc,
      sourceArea: areaName
    }, (response) => {
      loading.remove();
      imageOcclusionData.isProcessing = false;
      
      if (response && response.success) {
        console.log('Image Occlusion overlay opened successfully');
      } else {
        alert('Không thể mở Image Occlusion editor');
      }
    });
  }

  // Xem ảnh full size
  function viewFullImage(imgElement) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imgElement.src;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    `;
    
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', () => overlay.remove());
  }

  // Hiển thị loading overlay
  function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10003;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    `;
    
    overlay.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px; animation: spin 1s linear infinite;">⚙️</div>
      <div style="font-size: 18px;">${message}</div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(overlay);
    return overlay;
  }

  // Lắng nghe message từ overlay editor
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'imageOcclusionCreated') {
      // Xử lý khi Image Occlusion được tạo xong
      handleImageOcclusionCreated(message.data);
      sendResponse({ success: true });
    }
  });

  // Xử lý khi Image Occlusion được tạo
  function handleImageOcclusionCreated(data) {
    console.log('Image Occlusion created:', data);
    
    // Hiển thị thông báo thành công
    showNotification('✅ Image Occlusion đã được tạo thành công!', 'success');
    
    // Có thể thêm ảnh occluded vào flashcard nếu cần
    if (data.occludedImage && data.sourceArea) {
      // TODO: Thêm logic để update flashcard với ảnh occluded
    }
  }

  // Hiển thị notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10004;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Tự động xóa sau 3s
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Export functions nếu cần
  window.ImageOcclusionHandler = {
    init: initImageOcclusionHandler,
    createOcclusion: createImageOcclusion
  };

  // Auto init khi script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageOcclusionHandler);
  } else {
    initImageOcclusionHandler();
  }
})();
