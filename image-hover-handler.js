// Image Hover Handler - Xử lý hover icon và Alt+Click cho Image Occlusion
(function() {
  'use strict';

  let settings = {
    enableHoverIcon: false,
    enableAltClick: true
  };

  let hoverIcon = null;
  let currentHoveredImage = null;

  // Load settings
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['afc_image_alt_click']);
      settings.enableHoverIcon = false; // hover icon feature removed
      settings.enableAltClick = result.afc_image_alt_click !== false; // default true
      console.log('Image Hover Handler loaded settings:', result, settings);
    } catch (e) {
      console.error('Error loading image hover settings:', e);
    }
  }

  // Create hover icon element (removed) - kept as noop for compatibility
  function createHoverIcon() {
    return null;
  }

  // Show hover icon at image position (disabled)
  function showHoverIcon(img) {
    return;
  }

  // Hide hover icon
  function hideHoverIcon() {
    if (hoverIcon) {
      // noop
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

      // Send to Image Occlusion overlay editor — robustly handle failures
      try {
        chrome.runtime.sendMessage({
          action: 'createImageOcclusion',
          imageData: imageDataUrl,
          source: 'hover-icon'
        }, (response) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.warn('Image Hover Handler: sendMessage failed:', chrome.runtime.lastError);
            // Fallback: ask background to open editor tab with the image
            try {
              chrome.runtime.sendMessage({
                action: 'openImageOcclusionEditor',
                imageData: imageDataUrl,
                pageTitle: document.title
              });
            } catch (e) {
              console.error('Image Hover Handler fallback failed:', e);
            }
          }
        });
      } catch (e) {
        console.error('Image Hover Handler: error sending runtime message:', e);
        // Last resort: no extension messaging available
      }

    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }

  // Handle mouse move events
  let lastHoveredElement = null;
  let hoverTimeout = null;

  // Try to find an image element starting from target and climbing up the tree
  function findImageFromTarget(target) {
    let el = target;
    while (el && el !== document.documentElement) {
      if (isValidImage(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function handleMouseMove(e) {
    if (!settings.enableHoverIcon) return;

    const element = findImageFromTarget(e.target);

    // Clear timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Check if hovering over valid image
    if (element) {
      console.log('Image Hover Handler hover candidate', element);
      if (element !== lastHoveredElement) {
        lastHoveredElement = element;
        
        // Add slight delay to avoid flickering
        console.log('Image Hover Handler: scheduling hover show in 150ms for', element);
        hoverTimeout = setTimeout(() => {
          console.log('Image Hover Handler: hover timeout fired for', element, 'lastHoveredElement=', lastHoveredElement);
          try {
            if (isValidImage(element) && element === lastHoveredElement) {
              showHoverIcon(element);
            } else {
              console.log('Image Hover Handler: conditions failed, not showing icon', isValidImage(element), element === lastHoveredElement);
            }
          } catch (e) {
            console.error('Image Hover Handler: error in hover timeout', e);
          }
        }, 150);
      }
    } else {
      // Check if mouse is over the hover icon itself
      if (hoverIcon && (e.target === hoverIcon || hoverIcon.contains(e.target))) {
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
        console.log('Image Hover Handler received settings update:', message.settings);
      settings.enableAltClick = message.settings.enableAltClick !== false;
    }
  });

  // Initialize
  async function init() {
    await loadSettings();
    // Ensure hover icon element exists so it's easier to debug in-page
    try {
      createHoverIcon();
      hideHoverIcon();
      console.log('Image Hover Handler: ensured hoverIcon exists');
    } catch (e) {
      console.warn('Image Hover Handler: failed to create hoverIcon during init', e);
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    
    console.log('Image Hover Handler initialized', settings);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init().catch(e => console.error('Failed to initialize image hover handler:', e));
  }

})();
