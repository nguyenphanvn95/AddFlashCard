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
  BUTTON_CLASS: 'addflashcard-sync-btn',
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
  
  // Upload/Sync icon (similar to Notion Exporter but with cards icon)
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
         stroke-linejoin="round" class="addflashcard-icon">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" x2="12" y1="3" y2="15"/>
      <rect x="3" y="17" width="18" height="4" rx="1"/>
    </svg>
  `;
  
  // Apply inline styles (matching Notion Exporter's approach)
  Object.assign(button.style, {
    padding: '4px 8px',
    margin: '0px 2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.15s ease',
    position: 'relative',
    userSelect: 'none',
  });
  
  // Event listeners
  button.addEventListener('click', handleSyncClick);
  button.addEventListener('mouseenter', handleButtonHover);
  button.addEventListener('mouseleave', handleButtonLeave);
  
  // Keyboard accessibility
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
function handleButtonHover() {
  if (!state.isSyncing && state.button) {
    // Hover effect handled by CSS
  }
}

function handleButtonLeave() {
  if (!state.isSyncing && state.button) {
    // Leave effect handled by CSS
  }
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
  
  // Update button state
  if (state.button) {
    state.button.setAttribute('data-syncing', 'true');
  }
  
  try {
    // Get page title for deck name
    const pageTitle = getNotionPageTitle();
    const deckName = pageTitle || 'Notion Cards';
    
    log(`Deck name: ${deckName}`);
    
    // Extract toggles from page
    const toggles = await extractTogglesFromPage();
    
    if (toggles.length === 0) {
      showToast('No toggles found on this page', 'warning');
      return;
    }
    
    log(`Found ${toggles.length} toggles`);
    
    // Sync to storage
    await syncCardsToStorage(deckName, toggles);
    
    showToast(`✅ Synced ${toggles.length} cards to deck "${deckName}"`, 'success');
    
  } catch (error) {
    log('❌ Sync error:', error);
    showToast('❌ Sync failed: ' + error.message, 'error');
  } finally {
    state.isSyncing = false;
    
    // Reset button state
    if (state.button) {
      state.button.setAttribute('data-syncing', 'false');
    }
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
  const toggleElements = document.querySelectorAll('details');
  
  log(`Found ${toggleElements.length} toggle elements`);
  
  for (let i = 0; i < toggleElements.length; i++) {
    const toggle = toggleElements[i];
    
    try {
      const front = extractToggleFront(toggle);
      if (!front.trim()) continue;
      
      const back = extractToggleBack(toggle);
      
      toggles.push({
        front: front,
        back: back || '<p><em>No content</em></p>',
        index: i,
        url: window.location.href,
        timestamp: Date.now(),
      });
      
      log(`  ✓ Toggle ${i}: "${front.substring(0, 50)}..."`);
      
    } catch (error) {
      log(`  ✗ Toggle ${i} extraction failed:`, error);
    }
  }
  
  return toggles;
}

function extractToggleFront(toggle) {
  const summary = toggle.querySelector('summary');
  if (!summary) return '';
  
  const clone = summary.cloneNode(true);
  
  // Remove icons, buttons, and other non-text elements
  clone.querySelectorAll('svg, button, [class*="icon"]').forEach(el => el.remove());
  
  return clone.textContent.trim();
}

function extractToggleBack(toggle) {
  // Get all children except summary
  const contentDiv = Array.from(toggle.children).find(
    child => child.tagName !== 'SUMMARY'
  );
  
  if (!contentDiv) return '';
  
  const clone = contentDiv.cloneNode(true);
  
  // Convert relative URLs to absolute
  processMediaElements(clone);
  
  return clone.innerHTML;
}

function processMediaElements(container) {
  // Process images
  container.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http')) {
      img.setAttribute('src', new URL(src, window.location.href).href);
    }
  });
  
  // Process videos
  container.querySelectorAll('video, audio').forEach(media => {
    const src = media.getAttribute('src');
    if (src && !src.startsWith('http')) {
      media.setAttribute('src', new URL(src, window.location.href).href);
    }
  });
  
  // Process links
  container.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      link.setAttribute('href', new URL(href, window.location.href).href);
    }
  });
}

// ========================================
// STORAGE
// ========================================
async function syncCardsToStorage(deckName, toggles) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['cards', 'decks'], (result) => {
      try {
        let cards = result.cards || [];
        let decks = result.decks || ['Default'];
        
        // Ensure deck exists
        if (!decks.includes(deckName)) {
          decks.push(deckName);
        }
        
        // Add new cards
        const now = Date.now();
        toggles.forEach(toggle => {
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
        });
        
        // Save to storage
        chrome.storage.local.set({ cards, decks }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            log(`✅ Saved ${toggles.length} cards to storage`);
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
