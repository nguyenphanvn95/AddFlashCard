// Image Hover Handler - Xử lý hover icon và Alt+Click cho Image Occlusion
(function() {
  'use strict';

  let settings = {
    enableHoverIcon: true,
    enableAltClick: true
  };

  let hoverIcon = null;
  let currentHoveredImage = null;

  // Load settings
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['afc_image_hover_icon', 'afc_image_alt_click']);
      settings.enableHoverIcon = result.afc_image_hover_icon !== false; // default true
      settings.enableAltClick = result.afc_image_alt_click !== false; // default true
    } catch (e) {
      console.error('Error loading image hover settings:', e);
    }
  }

  // Create hover icon element
  function createHoverIcon() {
    if (hoverIcon) return hoverIcon;

    hoverIcon = document.createElement('div');
    hoverIcon.id = 'afc-image-hover-icon';
    hoverIcon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2" fill="rgba(0,0,0,0.7)"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="2" fill="#5dade2"/>
      </svg>
    `;
    
    hoverIcon.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      background: rgba(93, 173, 226, 0.95);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2147483646;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.2s, opacity 0.2s;
      opacity: 0;
      pointer-events: none;
      backdrop-filter: blur(4px);
    `;

    hoverIcon.addEventListener('mouseenter', () => {
      hoverIcon.style.transform = 'scale(1.1)';
    });

    hoverIcon.addEventListener('mouseleave', () => {
      hoverIcon.style.transform = 'scale(1)';
    });

    hoverIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentHoveredImage) {
        handleImageCapture(currentHoveredImage);
      }
    });

    document.body.appendChild(hoverIcon);
    return hoverIcon;
  }

  // Show hover icon at image position
  function showHoverIcon(img) {
    if (!settings.enableHoverIcon) return;
    if (!hoverIcon) createHoverIcon();

    const rect = img.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Position at top-right corner of image
    hoverIcon.style.left = (rect.right + scrollX - 45) + 'px';
    hoverIcon.style.top = (rect.top + scrollY + 5) + 'px';
    hoverIcon.style.opacity = '1';
    hoverIcon.style.pointerEvents = 'auto';

    currentHoveredImage = img;
  }

  // Hide hover icon
  function hideHoverIcon() {
    if (hoverIcon) {
      hoverIcon.style.opacity = '0';
      hoverIcon.style.pointerEvents = 'none';
    }
    currentHoveredImage = null;
  }

  // Check if element is a valid image
  function isValidImage(element) {
    if (!element) return false;
    
    // Check if it's an img tag
    if (element.tagName === 'IMG') {
      const src = element.src || element.currentSrc;
      if (!src || src.startsWith('data:image/svg')) return false;
      
      // Check size - ignore tiny images (likely icons)
      const rect = element.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return false;
      
      return true;
    }
    
    // Check if it's a div with background-image
    if (element.tagName === 'DIV' || element.tagName === 'SECTION') {
      const bgImage = window.getComputedStyle(element).backgroundImage;
      if (bgImage && bgImage !== 'none' && !bgImage.includes('data:image/svg')) {
        const rect = element.getBoundingClientRect();
        if (rect.width >= 50 && rect.height >= 50) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Handle image capture and send to Image Occlusion
  async function handleImageCapture(element) {
    try {
      let imageUrl = null;
      let imageDataUrl = null;

      // Get image URL
      if (element.tagName === 'IMG') {
        imageUrl = element.src || element.currentSrc;
      } else {
        const bgImage = window.getComputedStyle(element).backgroundImage;
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch) {
          imageUrl = urlMatch[1];
        }
      }

      if (!imageUrl) {
        console.error('Could not get image URL');
        return;
      }

      // Convert to data URL if needed
      if (imageUrl.startsWith('http')) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          imageDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error('Error fetching image:', e);
          imageDataUrl = imageUrl;
        }
      } else {
        imageDataUrl = imageUrl;
      }

      // Send to Image Occlusion overlay editor
      chrome.runtime.sendMessage({
        action: 'createImageOcclusion',
        imageData: imageDataUrl,
        source: 'hover-icon'
      });

    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }

  // Handle mouse move events
  let lastHoveredElement = null;
  let hoverTimeout = null;

  function handleMouseMove(e) {
    if (!settings.enableHoverIcon) return;

    const element = e.target;
    
    // Clear timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Check if hovering over valid image
    if (isValidImage(element)) {
      if (element !== lastHoveredElement) {
        lastHoveredElement = element;
        
        // Add slight delay to avoid flickering
        hoverTimeout = setTimeout(() => {
          if (isValidImage(element) && element === lastHoveredElement) {
            showHoverIcon(element);
          }
        }, 150);
      }
    } else {
      // Check if mouse is over the hover icon itself
      if (hoverIcon && e.target === hoverIcon) {
        // Keep showing
        return;
      }
      
      lastHoveredElement = null;
      hideHoverIcon();
    }
  }

  // Handle Alt+Click on images
  function handleClick(e) {
    if (!settings.enableAltClick) return;
    if (!e.altKey) return;

    const element = e.target;
    if (isValidImage(element)) {
      e.preventDefault();
      e.stopPropagation();
      handleImageCapture(element);
    }
  }

  // Listen for settings changes
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateImageHoverSettings') {
      settings.enableHoverIcon = message.settings.enableHoverIcon !== false;
      settings.enableAltClick = message.settings.enableAltClick !== false;
      
      // Hide icon if disabled
      if (!settings.enableHoverIcon) {
        hideHoverIcon();
      }
    }
  });

  // Initialize
  async function init() {
    await loadSettings();
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    
    console.log('Image Hover Handler initialized', settings);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
