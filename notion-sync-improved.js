// ========================================
// NOTION SYNC v3.0 - Inspired by Notion Exporter
// ========================================
// Key improvements:
// 1. Use .notion-topbar-action-buttons selector (more reliable)
// 2. Debounced MutationObserver (better performance)
// 3. Auto-disconnect observer after injection
// 4. Dark/light mode support
// 5. Clean button structure
// ========================================

// ========================================
// CONSTANTS
// ========================================
const CONSTANTS = {
  BUTTON_ID: 'addflashcard-sync-button',
  BUTTON_CLASS: 'addflashcard-notion-sync-button',
  TOPBAR_SELECTOR: '.notion-topbar-action-buttons',
  SHARE_BUTTON_SELECTOR: 'div[role="button"]',
  MAX_MUTATION_COUNT: 10000,
  DEBOUNCE_DELAY: 100,
  INJECTION_TIMEOUT: 15000,
};

// ========================================
// STATE
// ========================================
let state = {
  isSyncing: false,
  mutationCount: 0,
  injectionAttempts: 0,
  observer: null,
  button: null,
};

// ========================================
// UTILITY: DEBOUNCE
// ========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========================================
// UTILITY: CHECK IF ELEMENT IS VISIBLE
// ========================================
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// ========================================
// UTILITY: LOG WITH PREFIX
// ========================================
function log(message, ...args) {
  console.log(`[AddFlashcard] ${message}`, ...args);
}

// ========================================
// CORE: CREATE SYNC BUTTON
// ========================================
function createSyncButton() {
  const button = document.createElement('div');
  button.id = CONSTANTS.BUTTON_ID;
  button.className = CONSTANTS.BUTTON_CLASS;
  button.setAttribute('role', 'button');
  button.setAttribute('aria-label', 'Sync Notion toggles to flashcards');
  button.setAttribute('tabindex', '0');
  button.setAttribute('data-state', 'idle'); // idle, syncing, success, failed
  
  // Create icon element - Refresh emoji
  const iconEl = document.createElement('span');
  iconEl.textContent = '🔄';
  iconEl.className = 'addflashcard-button-icon';
  iconEl.style.fontSize = '14px';
  iconEl.style.lineHeight = '1';
  iconEl.style.display = 'flex';
  iconEl.style.alignItems = 'center';
  
  // Create text element
  const textEl = document.createElement('span');
  textEl.className = 'addflashcard-button-text';
  textEl.textContent = 'Sync cards';
  
  button.appendChild(iconEl);
  button.appendChild(textEl);
  
  // Event listeners
  button.addEventListener('click', handleSyncClick);
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSyncClick(e);
    }
  });
  
  return button;
}

// ========================================
// CORE: INJECT BUTTON INTO TOPBAR
// ========================================
function injectButton() {
  // Check if button already exists
  if (document.getElementById(CONSTANTS.BUTTON_ID)) {
    log('Button already exists');
    return true;
  }
  
  // Find Notion topbar action buttons container
  const topbar = document.querySelector(CONSTANTS.TOPBAR_SELECTOR);
  
  if (!topbar) {
    log('Topbar not found');
    return false;
  }
  
  log('Topbar found:', topbar);
  
  // Create and inject button
  state.button = createSyncButton();
  
  try {
    // Insert at the beginning of topbar (before Share button)
    topbar.insertBefore(state.button, topbar.firstChild);
    
    // Inject dark/light mode styles
    injectStyles();
    
    log('✅ Button injected successfully');
    return true;
  } catch (error) {
    log('❌ Injection failed:', error);
    return false;
  }
}

// ========================================
// CORE: INJECT STYLES
// ========================================
function injectStyles() {
  // Check if styles already injected
  if (document.getElementById('addflashcard-notion-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'addflashcard-notion-styles';
  style.textContent = `
    /* Button hover effect */
    .addflashcard-sync-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .addflashcard-icon {
        stroke: rgba(255, 255, 255, 0.9);
      }
      .addflashcard-sync-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }
    }
    
    /* Light mode */
    @media (prefers-color-scheme: light) {
      .addflashcard-icon {
        stroke: rgba(55, 53, 47, 0.65);
      }
    }
    
    /* Syncing state */
    .addflashcard-sync-btn[data-syncing="true"] {
      cursor: wait;
      opacity: 0.6;
    }
    
    .addflashcard-sync-btn[data-syncing="true"] .addflashcard-icon {
      animation: rotate 1s linear infinite;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Toast notifications */
    .addflashcard-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: rgb(46, 170, 220);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      animation: slideIn 0.3s ease;
    }
    
    .addflashcard-toast.success { background: rgb(46, 170, 220); }
    .addflashcard-toast.warning { background: rgb(255, 159, 64); }
    .addflashcard-toast.error { background: rgb(255, 99, 71); }
    
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
  `;
  
  document.head.appendChild(style);
}

// ========================================
// EVENT HANDLERS
// ========================================
function updateButtonState(newState) {
  if (!state.button) return;
  
  state.button.setAttribute('data-state', newState);
  const textEl = state.button.querySelector('.addflashcard-button-text');
  
  switch(newState) {
    case 'idle':
      textEl.textContent = 'Sync cards';
      break;
    case 'syncing':
      textEl.textContent = 'Syncing cards';
      break;
    case 'success':
      textEl.textContent = 'Synced cards.';
      // Reset to idle after 2 seconds
      setTimeout(() => {
        updateButtonState('idle');
      }, 2000);
      break;
    case 'failed':
      textEl.textContent = 'Failed';
      // Reset to idle after 3 seconds
      setTimeout(() => {
        updateButtonState('idle');
      }, 3000);
      break;
  }
}

function handleButtonHover() {
  // Hover effect handled by CSS
}

function handleButtonLeave() {
  // Leave effect handled by CSS
}

async function handleSyncClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (state.isSyncing) {
    log('Already syncing...');
    return;
  }
  
  log('🔄 Starting sync...');
  state.isSyncing = true;
  updateButtonState('syncing');
  
  try {
    // Get page title for deck name
    const pageTitle = getNotionPageTitle();
    const deckName = pageTitle || 'Notion Cards';
    
    log(`Deck name: ${deckName}`);
    
    // Extract toggles from page
    const toggles = await extractTogglesFromPage();
    
    log(`Total toggles found: ${toggles.length}`);
    
    if (toggles.length === 0) {
      showToast('⚠️ No toggles with content found on this page', 'warning');
      log('⚠️ Warning: Found toggle elements but none had valid content');
      updateButtonState('failed');
      return;
    }
    
    log(`✓ Successfully extracted ${toggles.length} toggles`);
    
    // Sync to storage
    await syncCardsToStorage(deckName, toggles);
    
    showToast(`✅ Synced ${toggles.length} cards to deck "${deckName}"`, 'success');
    updateButtonState('success');
    
  } catch (error) {
    log('❌ Sync error:', error);
    showToast('❌ Sync failed: ' + error.message, 'error');
    updateButtonState('failed');
  } finally {
    state.isSyncing = false;
  }
}

// ========================================
// NOTION DATA EXTRACTION
// ========================================
function getNotionPageTitle() {
  // Try multiple strategies to get page title
  const selectors = [
    'div[data-content-editable-leaf="true"]',
    '.notion-page-content h1',
    'h1',
    '[placeholder="Untitled"]',
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Fallback to document title
  return document.title.replace(' | Notion', '').trim() || 'Notion Cards';
}

async function extractTogglesFromPage() {
  const toggles = [];
  
  // Find all toggle blocks
  let toggleElements = document.querySelectorAll('details.notion-toggle-block, details[class*="toggle"], [class*="notion-toggle-block"]');
  
  if (toggleElements.length === 0) {
    toggleElements = document.querySelectorAll('[data-block-id][class*="toggle"]');
  }
  
  if (toggleElements.length === 0) {
    toggleElements = document.querySelectorAll('details');
  }
  
  log(`Found ${toggleElements.length} toggle elements`);
  
  for (let i = 0; i < toggleElements.length; i++) {
    const toggle = toggleElements[i];
    
    try {
      // Log toggle structure
      log(`Toggle ${i}: <${toggle.tagName.toLowerCase()}> with ${toggle.children.length} children`);
      
      const front = extractToggleFront(toggle);
      
      // Skip if front is empty
      if (!front || !front.trim()) {
        log(`  ⊘ Toggle ${i}: Empty front, skipping`);
        continue;
      }
      
      // Store original state (whether toggle was closed)
      const wasClosedOriginally = isToggleClosed(toggle);
      
      // Check if toggle is closed and open it if needed
      let shouldCloseAfter = false;
      if (wasClosedOriginally) {
        const opened = await openToggle(toggle);
        if (!opened) {
          log(`  ⚠️ Toggle ${i} is closed and could not be opened`);
          // Still try to extract, might get empty back
        } else {
          shouldCloseAfter = true;
        }
      }
      
      const back = extractToggleBack(toggle);
      
      // Restore original state if it was closed
      if (shouldCloseAfter) {
        closeToggle(toggle);
      }
      
      // Debug: log front and back comparison
      if (front === back) {
        log(`  ⚠️ WARNING: Front and Back are IDENTICAL!`);
      }
      
      toggles.push({
        front: front,
        back: back || '<p><em>No content or toggle closed</em></p>',
        index: i,
        url: window.location.href,
        timestamp: Date.now(),
      });
      
      log(`  ✓ Toggle ${i}: Front="${front.substring(0, 30)}..." | Back="${(back || '').substring(0, 30)}..."`);
      
    } catch (error) {
      log(`  ✗ Toggle ${i} extraction failed:`, error);
    }
  }
  
  return toggles;
}

function extractToggleFront(toggle) {
  // Find the editable element that contains the title
  const editableElement = toggle.querySelector('[data-content-editable-leaf="true"]');
  
  if (!editableElement) {
    log('  ⚠️ No editable element found');
    return '';
  }
  
  // Get only the text content of this element (not children)
  const text = editableElement.textContent.trim();
  
  log(`  Front text: "${text.substring(0, 60)}..."`);
  
  return text;
}

function extractToggleFront(toggle) {
  // Find the editable element that contains the title
  const editableElement = toggle.querySelector('[data-content-editable-leaf="true"]');
  
  if (!editableElement) {
    log('  ⚠️ No editable element found');
    return '';
  }
  
  // Get only the text content of this element (not children)
  const text = editableElement.textContent.trim();
  
  log(`  Front text: "${text.substring(0, 60)}..."`);
  
  return text;
}

function isToggleClosed(toggle) {
  const button = toggle.querySelector('[aria-expanded]');
  if (!button) return false;
  return button.getAttribute('aria-expanded') === 'false';
}

async function openToggle(toggle) {
  const button = toggle.querySelector('[role="button"][aria-expanded]');
  if (!button) return false;
  
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  if (isExpanded) return true; // Already open
  
  log('  ⏳ Toggle is closed, opening it...');
  
  // Click the button to expand
  button.click();
  
  // Wait for content to load
  return new Promise((resolve) => {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      const contentDiv = toggle.querySelector('[id][style*="display: flex"]:not(:scope > div:first-of-type)');
      const newExpanded = button.getAttribute('aria-expanded') === 'true';
      
      if (newExpanded && contentDiv) {
        clearInterval(checkInterval);
        log('  ✓ Toggle opened');
        resolve(true);
      } else if (++attempts > 30) { // 3 seconds timeout
        clearInterval(checkInterval);
        log('  ✗ Toggle open timeout');
        resolve(false);
      }
    }, 100);
  });
}

function closeToggle(toggle) {
  const button = toggle.querySelector('[role="button"][aria-expanded]');
  if (!button) return;
  
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  if (!isExpanded) return; // Already closed
  
  log('  ⏳ Closing toggle to restore original state...');
  button.click();
}

function extractToggleBack(toggle) {
  // Find the editable element (title)
  const editableElement = toggle.querySelector('[data-content-editable-leaf="true"]');
  
  if (!editableElement) {
    log('  ⚠️ No editable element found for back');
    return '';
  }
  
  // Find the parent flex container with the title
  let titleFlexContainer = editableElement.closest('div[style*="display: flex"]');
  
  if (!titleFlexContainer) {
    log('  ⚠️ No title flex container found');
    return '';
  }
  
  // The content is in a sibling div of the title flex container
  // Look for div with id that's not empty
  let contentDiv = titleFlexContainer.nextElementSibling;
  
  // Verify it's the content container (should have display: flex)
  if (contentDiv) {
    const style = contentDiv.getAttribute('style') || '';
    const hasId = contentDiv.getAttribute('id');
    
    // If not the right one, search for it
    if (!style.includes('display: flex') || !hasId) {
      contentDiv = null;
    }
  }
  
  // Fallback: search parent's children
  if (!contentDiv) {
    const parent = titleFlexContainer.parentElement;
    if (parent) {
      const children = Array.from(parent.children);
      const titleIndex = children.indexOf(titleFlexContainer);
      
      for (let i = titleIndex + 1; i < children.length; i++) {
        const sibling = children[i];
        const siblingStyle = sibling.getAttribute('style') || '';
        const siblingId = sibling.getAttribute('id');
        
        if (siblingStyle.includes('display: flex') && siblingId) {
          // Check if it contains blocks
          if (sibling.querySelector('[data-block-id]')) {
            contentDiv = sibling;
            break;
          }
        }
      }
    }
  }
  
  // If still not found, toggle might be closed
  if (!contentDiv) {
    log('  ℹ No content div found (toggle may be closed)');
    return '';
  }
  
  log(`  Content container found`);
  
  // Clone the content
  const clone = contentDiv.cloneNode(true);
  
  // Remove the title if it's in the content
  const titleInContent = clone.querySelector('[data-content-editable-leaf="true"]');
  if (titleInContent) {
    const titleContainer = titleInContent.closest('div[style*="display: flex"]');
    if (titleContainer) {
      titleContainer.remove();
    }
  }
  
  // Convert relative URLs to absolute
  processMediaElements(clone);
  
  const backHtml = clone.innerHTML.trim();
  
  log(`  Back HTML length: ${backHtml.length} chars`);
  
  return backHtml;
}

function processMediaElements(container) {
  // Process images - preserve all attributes and styling
  container.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http')) {
      img.setAttribute('src', new URL(src, window.location.href).href);
    }
    // Ensure images have proper styling attributes
    if (!img.getAttribute('style')) {
      img.setAttribute('style', 'max-width: 100%; height: auto;');
    }
  });
  
  // Process embedded images (background-image, etc)
  container.querySelectorAll('[style*="background-image"]').forEach(el => {
    const style = el.getAttribute('style');
    const updated = style.replace(
      /url\(['""]?(?!http)([^)]+)['"""]?\)/g,
      (match, url) => `url('${new URL(url, window.location.href).href}')`
    );
    el.setAttribute('style', updated);
  });
  
  // Process videos and audio
  container.querySelectorAll('video, audio').forEach(media => {
    const src = media.getAttribute('src');
    if (src && !src.startsWith('http')) {
      media.setAttribute('src', new URL(src, window.location.href).href);
    }
    // Preserve source elements in video/audio
    media.querySelectorAll('source').forEach(source => {
      const srcAttr = source.getAttribute('src');
      if (srcAttr && !srcAttr.startsWith('http')) {
        source.setAttribute('src', new URL(srcAttr, window.location.href).href);
      }
    });
  });
  
  // Process links
  container.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      link.setAttribute('href', new URL(href, window.location.href).href);
    }
  });
  
  // Preserve text formatting - keep all style attributes intact
  container.querySelectorAll('[style]').forEach(el => {
    const style = el.getAttribute('style');
    // Don't modify existing styles - preserve font colors, weights, text-decoration, etc
    if (style && !style.includes('background-image')) {
      // Already being handled above, just preserve as-is
    }
  });
  
  // Preserve heading, bold, italic, underline, and other text formatting
  // These are typically done with HTML tags (strong, em, u, h1, h2, etc) which are preserved automatically
}

// ========================================
// STORAGE
// ========================================
async function syncCardsToStorage(deckName, toggles) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['cards', 'decks'], async (result) => {
      try {
        let cards = result.cards || [];
        let decks = result.decks || ['Default'];
        
        // Ensure deck exists
        if (!decks.includes(deckName)) {
          decks.push(deckName);
        }
        
        // Get existing cards in this deck
        const existingCards = cards.filter(c => c.deck === deckName);
        
        // Add or update cards
        const now = Date.now();
        let addedCount = 0;
        let updatedCount = 0;
        
        for (const toggle of toggles) {
          // Check if card with same front already exists in this deck
          const duplicate = existingCards.find(card => card.front === toggle.front);
          
          if (duplicate) {
            // Update existing card's back
            const cardIndex = cards.findIndex(c => c.id === duplicate.id);
            if (cardIndex !== -1) {
              cards[cardIndex].back = toggle.back;
              cards[cardIndex].lastReviewed = now;
              log(`  🔄 Updated card: "${toggle.front.substring(0, 40)}..."`);
              updatedCount++;
            }
          } else {
            // Create new card
            cards.push({
              id: `notion-${now}-${toggle.index}`,
              front: toggle.front,
              back: toggle.back,
              deck: deckName,
              created: now,
              lastReviewed: 0,
              nextReview: now,
              interval: 1,
              easeFactor: 2.5,
              repetitions: 0,
              source: 'notion',
              sourceUrl: toggle.url,
            });
            log(`  ✨ Created card: "${toggle.front.substring(0, 40)}..."`);
            addedCount++;
          }
        }
        
        // Save to storage
        chrome.storage.local.set({ cards, decks }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            log(`✅ Sync complete: +${addedCount} new, ~${updatedCount} updated`);
            resolve();
          }
        });
        
      } catch (error) {
        reject(error);
      }
    });
  });
}

// ========================================
// UI: TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `addflashcard-toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(400px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// MUTATION OBSERVER
// ========================================
const debouncedInjection = debounce((mutations, observer) => {
  // Check if button already exists
  if (document.getElementById(CONSTANTS.BUTTON_ID)) {
    log('Button found, disconnecting observer');
    observer.disconnect();
    return;
  }
  
  try {
    if (injectButton()) {
      log('Injection successful, disconnecting observer');
      observer.disconnect(); // Stop observing once injected successfully
    }
  } catch (error) {
    log('Injection error:', error);
  }
  
  // Safety limit
  state.mutationCount++;
  if (state.mutationCount > CONSTANTS.MAX_MUTATION_COUNT) {
    log('⚠️ Max mutation count reached, stopping observer');
    observer.disconnect();
  }
}, CONSTANTS.DEBOUNCE_DELAY);

// ========================================
// INITIALIZATION
// ========================================
function initialize() {
  log('🚀 Initializing Notion Sync v3.0...');
  
  // Create MutationObserver to watch for Notion topbar
  state.observer = new MutationObserver((mutations, observer) => {
    debouncedInjection(mutations, observer);
  });
  
  // Start observing
  state.observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    log('Received message:', message);
    
    if (message.action === 'triggerSync') {
      handleSyncClick(new Event('click'));
    }
    
    if (message.action === 'getStatus') {
      sendResponse({
        injected: !!document.getElementById(CONSTANTS.BUTTON_ID),
        syncing: state.isSyncing,
      });
    }
  });
  
  // Keyboard shortcut (Optional: Cmd/Ctrl + Shift + S)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      handleSyncClick(e);
    }
  });
  
  log('✅ Initialization complete');
}

// ========================================
// START
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

log('Notion Sync v3.0 loaded');
