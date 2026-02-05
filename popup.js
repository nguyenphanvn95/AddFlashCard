// Popup.js - Fixed version with proper screenshot handling

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  setupEventListeners();
  setupSettingsModal();
  setupAboutModal();
  updateUI();
});

async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['cards']);
    const cards = result.cards || [];
    const today = new Date().toDateString();
    
    document.getElementById('total-cards').textContent = cards.length;
    
    const todayCards = cards.filter(card => {
      const cardDate = new Date(card.created || 0).toDateString();
      return cardDate === today;
    }).length;
    
    document.getElementById('today-cards').textContent = todayCards;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function setupEventListeners() {
  document.getElementById('manage-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html') });
    window.close();
  });
  
  document.getElementById('study-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('study.html') });
    window.close();
  });
  
  document.getElementById('pdf-viewer-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pdf-viewer.html') });
    window.close();
  });
  
  document.getElementById('image-occlusion-btn').addEventListener('click', async () => {
    const action = await showImageOcclusionMenu();
    if (action === 'capture-area') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
      }
      window.close();
    } else if (action === 'capture-page') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.runtime.sendMessage({ 
          action: 'captureFullPageForIframe',
          tabId: tab.id,
          pageTitle: tab.title
        });
      }
      window.close();
    } else if (action === 'open-editor') {
      chrome.tabs.create({ url: chrome.runtime.getURL('image-occlusion-editor.html') });
      window.close();
    }
  });
  
  document.getElementById('export-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#export') });
    window.close();
  });
  
  document.getElementById('anki-sync-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#anki-sync') });
    window.close();
  });
  
  document.getElementById('settings-btn').addEventListener('click', () => {
    openSettingsModal();
  });
  
  document.getElementById('help-btn').addEventListener('click', () => {
    openAboutModal();
  });
  
  document.getElementById('notion-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('manage.html#notion') });
    window.close();
  });
}
