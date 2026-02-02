// Notion Sync Script - Auto sync toggles to flashcards
// This script adds a "Sync cards" button next to the Share button on Notion pages

let syncButton = null;
let isSyncing = false;
let retryCount = 0;
const MAX_RETRIES = 10;

// Initialize when DOM is ready
function initNotionSync() {
  console.log('AddFlashcard: Initializing Notion sync...');
  
  // Try multiple times with increasing delays
  attemptInject();
}

// Attempt to inject with retry logic
function attemptInject() {
  const delay = Math.min(1000 + (retryCount * 500), 5000); // 1s, 1.5s, 2s, ..., max 5s
  
  setTimeout(() => {
    const injected = injectSyncButton();
    
    if (!injected && retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`AddFlashcard: Retry ${retryCount}/${MAX_RETRIES}...`);
      attemptInject();
    } else if (injected) {
      console.log('AddFlashcard: Sync button injected successfully!');
      observePageChanges();
      retryCount = 0;
    } else {
      console.log('AddFlashcard: Failed to inject after max retries');
    }
  }, delay);
}

// Inject Sync button next to Share button
function injectSyncButton() {
  // Don't inject if already exists
  if (syncButton && document.body.contains(syncButton)) {
    return true;
  }
  
  // Reset syncButton reference if it was removed
  if (syncButton && !document.body.contains(syncButton)) {
    syncButton = null;
  }
  
  // Find the Share button with multiple strategies
  const shareButton = findShareButton();
  
  if (!shareButton) {
    console.log('AddFlashcard: Share button not found yet...');
    return false;
  }

  console.log('AddFlashcard: Share button found!', shareButton);

  // Create sync button
  syncButton = document.createElement('div');
  syncButton.className = 'addflashcard-notion-sync-button';
  syncButton.setAttribute('role', 'button');
  syncButton.setAttribute('tabindex', '0');
  syncButton.setAttribute('data-addflashcard', 'sync-button');
  
  syncButton.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 28px; 
                border-radius: 6px; background: rgb(46, 170, 220); color: white; 
                font-size: 13px; font-weight: 500; cursor: pointer; 
                transition: background 0.2s ease; margin-right: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.5 2h-11C1.67 2 1 2.67 1 3.5v9c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5zm-11 1h11c.28 0 .5.22.5.5v2H2v-2c0-.28.22-.5.5-.5zm11 10h-11c-.28 0-.5-.22-.5-.5V7h12v5.5c0 .28-.22.5-.5.5z"/>
        <path d="M4 9h3v1H4zm0 2h5v1H4z"/>
      </svg>
      <span class="sync-button-text">Sync cards</span>
    </div>
  `;

  // Add hover effect
  const buttonInner = syncButton.querySelector('div');
  syncButton.addEventListener('mouseenter', () => {
    if (!isSyncing) {
      buttonInner.style.background = 'rgb(35, 131, 226)';
    }
  });
  syncButton.addEventListener('mouseleave', () => {
    if (!isSyncing) {
      buttonInner.style.background = 'rgb(46, 170, 220)';
    }
  });

  // Add click handler
  syncButton.addEventListener('click', handleSyncClick);

  // Insert before Share button
  try {
    shareButton.parentElement.insertBefore(syncButton, shareButton);
    console.log('AddFlashcard: Sync button inserted successfully!');
    return true;
  } catch (error) {
    console.error('AddFlashcard: Error inserting button:', error);
    return false;
  }
}

// Find Share button with multiple strategies
function findShareButton() {
  // Strategy 1: Direct aria-label
  let shareButton = document.querySelector('[aria-label="Share"]');
  if (shareButton) {
    console.log('Strategy 1: Found via aria-label');
    return shareButton;
  }
  
  // Strategy 2: Look for specific Notion Share button structure
  const topbar = document.querySelector('.notion-topbar') || 
                 document.querySelector('[class*="topbar"]') ||
                 document.querySelector('div[style*="position"][style*="top"]');
  
  if (topbar) {
    console.log('Found topbar:', topbar);
    
    // Look for buttons in topbar
    const buttons = topbar.querySelectorAll('div[role="button"]');
    console.log('Found buttons in topbar:', buttons.length);
    
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      console.log('Button text:', text);
      
      if (text === 'Share' || text.includes('Share') || text === 'Chia sẻ') {
        console.log('Strategy 2: Found Share button via topbar');
        return btn;
      }
    }
  }
  
  // Strategy 3: Look for all buttons on page
  const allButtons = document.querySelectorAll('div[role="button"]');
  console.log('Total buttons on page:', allButtons.length);
  
  for (const btn of allButtons) {
    const text = btn.textContent.trim();
    if (text === 'Share' || text === 'Chia sẻ') {
      // Make sure it's in the top area (y position < 200px)
      const rect = btn.getBoundingClientRect();
      if (rect.top < 200) {
        console.log('Strategy 3: Found Share button via all buttons');
        return btn;
      }
    }
  }
  
  // Strategy 4: Look for button with specific class patterns
  const notionButtons = document.querySelectorAll('[class*="notion"][role="button"]');
  for (const btn of notionButtons) {
    if (btn.textContent.includes('Share') || btn.textContent.includes('Chia sẻ')) {
      console.log('Strategy 4: Found via class pattern');
      return btn;
    }
  }
  
  // Strategy 5: Look in the header/nav area
  const header = document.querySelector('header') || 
                document.querySelector('nav') ||
                document.querySelector('[role="banner"]');
  
  if (header) {
    const headerButtons = header.querySelectorAll('div[role="button"]');
    for (const btn of headerButtons) {
      if (btn.textContent.includes('Share') || btn.textContent.includes('Chia sẻ')) {
        console.log('Strategy 5: Found in header');
        return btn;
      }
    }
  }

  console.log('AddFlashcard: No Share button found with any strategy');
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
      console.log('AddFlashcard: Page changed, re-injecting button...');
      lastUrl = location.href;
      syncButton = null; // Reset button
      retryCount = 0; // Reset retry counter
      attemptInject(); // Use retry logic
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also observe for DOM changes that might add the Share button
  const headerObserver = new MutationObserver(() => {
    if (!syncButton || !document.body.contains(syncButton)) {
      const shareButton = findShareButton();
      if (shareButton && (!syncButton || !document.body.contains(syncButton))) {
        console.log('AddFlashcard: Share button appeared, injecting sync button...');
        syncButton = null;
        injectSyncButton();
      }
    }
  });
  
  // Observe the entire document for header changes
  headerObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
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
