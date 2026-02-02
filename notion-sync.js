// Notion Sync Script - Auto sync toggles to flashcards
// This script adds a "Sync cards" button next to the Share button on Notion pages

let syncButton = null;
let isSyncing = false;

// Initialize when DOM is ready
function initNotionSync() {
  // Wait for Notion to fully load
  setTimeout(() => {
    injectSyncButton();
    observePageChanges();
  }, 2000);
}

// Inject Sync button next to Share button
function injectSyncButton() {
  // Find the Share button in Notion's header
  const shareButton = document.querySelector('[aria-label="Share"]') || 
                     document.querySelector('div[role="button"]:has-text("Share")') ||
                     findShareButton();
  
  if (!shareButton || syncButton) {
    return; // Share button not found or sync button already exists
  }

  // Create sync button
  syncButton = document.createElement('div');
  syncButton.className = 'notion-sync-button';
  syncButton.setAttribute('role', 'button');
  syncButton.setAttribute('tabindex', '0');
  syncButton.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 32px; 
                border-radius: 6px; background: rgb(46, 170, 220); color: white; 
                font-size: 14px; font-weight: 500; cursor: pointer; 
                transition: background 0.2s ease;">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.5 2h-11C1.67 2 1 2.67 1 3.5v9c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5zm-11 1h11c.28 0 .5.22.5.5v2H2v-2c0-.28.22-.5.5-.5zm11 10h-11c-.28 0-.5-.22-.5-.5V7h12v5.5c0 .28-.22.5-.5.5z"/>
        <path d="M4 9h3v1H4zm0 2h5v1H4z"/>
      </svg>
      <span class="sync-button-text">Sync cards</span>
    </div>
  `;

  // Add hover effect
  const buttonInner = syncButton.querySelector('div');
  syncButton.addEventListener('mouseenter', () => {
    buttonInner.style.background = 'rgb(35, 131, 226)';
  });
  syncButton.addEventListener('mouseleave', () => {
    if (!isSyncing) {
      buttonInner.style.background = 'rgb(46, 170, 220)';
    }
  });

  // Add click handler
  syncButton.addEventListener('click', handleSyncClick);

  // Insert before Share button
  shareButton.parentElement.insertBefore(syncButton, shareButton);
}

// Find Share button with multiple strategies
function findShareButton() {
  // Strategy 1: Look for button with Share text
  const buttons = document.querySelectorAll('div[role="button"]');
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'Share') {
      return btn;
    }
  }

  // Strategy 2: Look in the page header area
  const header = document.querySelector('.notion-page-controls') || 
                document.querySelector('[data-block-id]')?.closest('.notion-frame')?.querySelector('.notion-topbar');
  if (header) {
    const headerButtons = header.querySelectorAll('div[role="button"]');
    for (const btn of headerButtons) {
      if (btn.textContent.includes('Share')) {
        return btn;
      }
    }
  }

  return null;
}

// Handle sync button click
async function handleSyncClick() {
  if (isSyncing) return;

  isSyncing = true;
  const buttonText = syncButton.querySelector('.sync-button-text');
  const buttonInner = syncButton.querySelector('div');
  
  // Update button state
  buttonText.textContent = 'Syncing...';
  buttonInner.style.background = 'rgb(120, 120, 120)';
  syncButton.style.cursor = 'wait';

  try {
    // Get page title
    const pageTitle = getPageTitle();
    
    // Get all toggles from the page
    const toggles = extractToggles();
    
    if (toggles.length === 0) {
      showNotification('No toggles found on this page', 'warning');
      return;
    }

    // Sync to storage
    await syncCardsToStorage(pageTitle, toggles);
    
    // Update button to "Synced"
    buttonText.textContent = 'Synced ✓';
    buttonInner.style.background = 'rgb(46, 170, 220)';
    
    showNotification(`Synced ${toggles.length} cards to deck "${pageTitle}"`, 'success');
    
    // Reset button after 3 seconds
    setTimeout(() => {
      buttonText.textContent = 'Sync cards';
      isSyncing = false;
    }, 3000);
    
  } catch (error) {
    console.error('Sync error:', error);
    buttonText.textContent = 'Sync failed';
    buttonInner.style.background = 'rgb(220, 46, 46)';
    showNotification('Failed to sync cards', 'error');
    
    setTimeout(() => {
      buttonText.textContent = 'Sync cards';
      buttonInner.style.background = 'rgb(46, 170, 220)';
      isSyncing = false;
    }, 3000);
  }
}

// Get page title
function getPageTitle() {
  // Try different selectors for page title
  const titleElement = document.querySelector('[data-content-editable-leaf="true"]') ||
                      document.querySelector('.notion-page-block [placeholder="Untitled"]') ||
                      document.querySelector('h1.notion-page-block') ||
                      document.querySelector('[data-block-id] h1');
  
  return titleElement ? titleElement.textContent.trim() || 'Untitled' : 'Untitled';
}

// Extract all toggles from the page
function extractToggles() {
  const toggles = [];
  
  // Find all toggle blocks (details elements in Notion)
  const toggleBlocks = document.querySelectorAll('details.notion-toggle-block');
  
  toggleBlocks.forEach((toggle, index) => {
    try {
      // Get toggle title (front of card)
      const summary = toggle.querySelector('summary');
      const titleElement = summary?.querySelector('[data-content-editable-leaf="true"]') || summary;
      const front = titleElement ? cleanHtml(titleElement.innerHTML) : '';
      
      if (!front.trim()) return; // Skip empty toggles
      
      // Get toggle content (back of card) - preserve formatting
      const contentDiv = toggle.querySelector(':scope > div:not(summary)');
      let back = '';
      
      if (contentDiv) {
        // Clone the content to process it
        const contentClone = contentDiv.cloneNode(true);
        
        // Process images - convert to absolute URLs
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('http')) {
            img.setAttribute('src', new URL(src, window.location.href).href);
          }
        });
        
        // Process links
        const links = contentClone.querySelectorAll('a');
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('#')) {
            link.setAttribute('href', new URL(href, window.location.href).href);
          }
        });
        
        // Process videos/audio
        const media = contentClone.querySelectorAll('video, audio');
        media.forEach(el => {
          const src = el.getAttribute('src');
          if (src && !src.startsWith('http')) {
            el.setAttribute('src', new URL(src, window.location.href).href);
          }
        });
        
        back = contentClone.innerHTML;
      }
      
      toggles.push({
        front: front,
        back: back || '<p><em>No content</em></p>',
        index: index
      });
    } catch (error) {
      console.error('Error extracting toggle:', error);
    }
  });
  
  return toggles;
}

// Clean HTML but preserve basic formatting
function cleanHtml(html) {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove Notion-specific classes but keep structure
  const elements = temp.querySelectorAll('*');
  elements.forEach(el => {
    // Remove Notion classes
    if (el.className && typeof el.className === 'string') {
      el.className = el.className.split(' ')
        .filter(c => !c.startsWith('notion-'))
        .join(' ');
    }
    
    // Remove contenteditable attributes
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-content-editable-leaf');
    el.removeAttribute('data-content-editable-void');
  });
  
  return temp.innerHTML;
}

// Sync cards to Chrome storage
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
        
        // Get existing cards in this deck
        const existingCards = cards.filter(c => c.deck === deckName);
        const existingFronts = new Map();
        existingCards.forEach(card => {
          existingFronts.set(normalizeText(card.front), card);
        });
        
        // Process each toggle
        toggles.forEach(toggle => {
          const normalizedFront = normalizeText(toggle.front);
          const existingCard = existingFronts.get(normalizedFront);
          
          if (existingCard) {
            // Update existing card (replace back content)
            existingCard.back = toggle.back;
            existingCard.lastModified = Date.now();
          } else {
            // Add new card
            const newCard = {
              id: Date.now() + Math.random(), // Unique ID
              deck: deckName,
              front: toggle.front,
              back: toggle.back,
              createdAt: Date.now(),
              lastModified: Date.now()
            };
            cards.push(newCard);
          }
        });
        
        // Save to storage
        chrome.storage.local.set({ cards, decks }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Normalize text for comparison (remove HTML tags and extra whitespace)
function normalizeText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'notion-sync-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

// Observe page changes (Notion is SPA)
function observePageChanges() {
  let lastUrl = location.href;
  
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      syncButton = null; // Reset button
      setTimeout(() => injectSyncButton(), 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
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

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotionSync);
} else {
  initNotionSync();
}

console.log('Notion Sync for AddFlashcard loaded');
