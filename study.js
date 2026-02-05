// Spaced Repetition Study Mode with SM-2 Algorithm
// Based on SuperMemo SM-2 algorithm

// ==================== SM-2 ALGORITHM ====================
class SM2Card {
  constructor(card) {
    this.id = card.id;
    this.front = card.front;
    this.back = card.back;
    this.deck = card.deck;
    this.tags = card.tags || [];
    
    // SM-2 parameters
    this.easiness = card.easiness || 2.5; // E-Factor (1.3 to 2.5+)
    this.interval = card.interval || 0; // Days until next review
    this.repetitions = card.repetitions || 0; // Consecutive correct answers
    this.dueDate = card.dueDate || Date.now(); // When to review next
    this.lastReview = card.lastReview || null; // Last review timestamp
    
    // Study statistics
    this.reviews = card.reviews || 0; // Total review count
    this.lapses = card.lapses || 0; // Times failed
    this.status = card.status || 'new'; // new, learning, review, relearning
  }

  // Calculate next interval based on quality (1-4)
  calculateInterval(quality) {
    // Quality: 1=Again, 2=Hard, 3=Good, 4=Easy
    
    if (quality < 3) {
      // Failed - restart
      this.repetitions = 0;
      this.interval = 1 / 1440; // 1 minute in days
      this.status = this.reviews === 0 ? 'learning' : 'relearning';
      this.lapses++;
    } else {
      // Passed - calculate next interval
      if (this.repetitions === 0) {
        this.interval = 1; // 1 day
      } else if (this.repetitions === 1) {
        this.interval = 6; // 6 days
      } else {
        this.interval = Math.round(this.interval * this.easiness);
      }
      
      this.repetitions++;
      
      // Update easiness factor
      this.easiness = Math.max(
        1.3,
        this.easiness + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02))
      );
      
      // Adjust interval based on quality
      if (quality === 2) {
        // Hard - multiply by 1.2
        this.interval = Math.round(this.interval * 1.2);
      } else if (quality === 4) {
        // Easy - multiply by 1.3
        this.interval = Math.round(this.interval * 1.3);
      }
      
      // Update status
      if (this.repetitions >= 2 && this.interval >= 21) {
        this.status = 'review';
      } else {
        this.status = 'learning';
      }
    }
    
    // Calculate next due date
    this.dueDate = Date.now() + (this.interval * 24 * 60 * 60 * 1000);
    this.lastReview = Date.now();
    this.reviews++;
    
    return this.interval;
  }

  // Get the scheduled intervals for each quality rating
  getScheduledIntervals() {
    const intervals = {};
    
    // Simulate each quality
    for (let quality = 1; quality <= 4; quality++) {
      const tempCard = new SM2Card({
        ...this,
        easiness: this.easiness,
        interval: this.interval,
        repetitions: this.repetitions
      });
      
      tempCard.calculateInterval(quality);
      intervals[quality] = tempCard.interval;
    }
    
    return intervals;
  }

  // Check if card is due for review
  isDue() {
    return Date.now() >= this.dueDate;
  }

  // Get card data for storage
  toJSON() {
    return {
      id: this.id,
      front: this.front,
      back: this.back,
      deck: this.deck,
      tags: this.tags,
      easiness: this.easiness,
      interval: this.interval,
      repetitions: this.repetitions,
      dueDate: this.dueDate,
      lastReview: this.lastReview,
      reviews: this.reviews,
      lapses: this.lapses,
      status: this.status
    };
  }
}

// ==================== STUDY SESSION ====================
class StudySession {
  constructor() {
    this.cards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    
    // Session statistics
    this.sessionStats = {
      studied: 0,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
      startTime: Date.now()
    };
    
    // Settings
    this.settings = {
      newCardsLimit: 20,
      reviewCardsLimit: 100,
      randomize: false,
      selectedDeck: '',
      selectedTags: ''
    };
    
    // Queue management
    this.newQueue = [];
    this.learningQueue = [];
    this.reviewQueue = [];
  }

  // Load cards from storage
  async loadCards(filters = {}) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cards', 'studySettings'], (result) => {
        let allCards = result.cards || [];
        // Normalize stored cards format (array/object/json-string) for compatibility
        if (typeof allCards === 'string') {
          try { allCards = JSON.parse(allCards); } catch (e) { allCards = []; }
        }
        if (allCards && !Array.isArray(allCards) && typeof allCards === 'object') {
          // If stored as an id->card map, convert to array
          allCards = Object.values(allCards);
        }
        if (!Array.isArray(allCards)) allCards = [];

        // Ensure each card has scheduling fields expected by study mode
        allCards = allCards.map((c) => {
          if (!c || typeof c !== 'object') return c;
          // Support alternative field names
          if (c.deckName && !c.deck) c.deck = c.deckName;
          // Derive status if missing
          if (!c.status) {
            const reps = Number(c.repetitions ?? 0);
            const interval = Number(c.interval ?? 0);
            if (reps <= 0) c.status = 'new';
            else if (interval <= 1) c.status = 'learning';
            else c.status = 'review';
          }
          // dueDate should be a number timestamp
          if (c.dueDate == null) c.dueDate = Date.now();
          if (typeof c.dueDate === 'string') {
            const d = Date.parse(c.dueDate);
            c.dueDate = Number.isFinite(d) ? d : Date.now();
          }
          return c;
        });
        this.settings = { ...this.settings, ...(result.studySettings || {}) };
        
        // Apply filters
        if (filters.deck) {
          allCards = allCards.filter(c => c.deck === filters.deck);
        }
        
        if (filters.tags) {
          const tagsList = filters.tags.split(',').map(t => t.trim().toLowerCase());
          allCards = allCards.filter(c => 
            c.tags && c.tags.some(tag => tagsList.includes(tag.toLowerCase()))
          );
        }
        
        // Convert to SM2Card objects
        this.cards = allCards.map(c => new SM2Card(c));
        
        // Organize into queues
        this.organizeQueues();
        
        resolve(this.cards);
      });
    });
  }

  // Organize cards into queues
  organizeQueues() {
    let newCards = [];
    let learningCards = [];
    let reviewCards = [];
    
    const now = Date.now();
    
    this.cards.forEach(card => {
      if (card.status === 'new') {
        newCards.push(card);
      } else if (card.isDue()) {
        if (card.status === 'learning' || card.status === 'relearning') {
          learningCards.push(card);
        } else {
          reviewCards.push(card);
        }
      }
    });
    
    // Store total counts (before applying limits)
    this.totalCounts = {
      new: newCards.length,
      learning: learningCards.length,
      review: reviewCards.length
    };
    
    // Apply limits for session
    this.newQueue = newCards.slice(0, this.settings.newCardsLimit);
    this.learningQueue = learningCards;
    this.reviewQueue = reviewCards.slice(0, this.settings.reviewCardsLimit);
    
    // Randomize if enabled
    if (this.settings.randomize) {
      this.shuffle(this.newQueue);
      this.shuffle(this.learningQueue);
      this.shuffle(this.reviewQueue);
    } else {
      // Sort by due date
      this.learningQueue.sort((a, b) => a.dueDate - b.dueDate);
      this.reviewQueue.sort((a, b) => a.dueDate - b.dueDate);
    }
  }

  // Get next card to study
  getNextCard() {
    // Priority: learning > review > new
    if (this.learningQueue.length > 0) {
      return this.learningQueue.shift();
    }
    if (this.reviewQueue.length > 0) {
      return this.reviewQueue.shift();
    }
    if (this.newQueue.length > 0) {
      return this.newQueue.shift();
    }
    return null;
  }

  // Answer card with quality rating
  answerCard(card, quality) {
    card.calculateInterval(quality);
    
    // Update session stats
    this.sessionStats.studied++;
    if (quality === 1) this.sessionStats.again++;
    else if (quality === 2) this.sessionStats.hard++;
    else if (quality === 3) this.sessionStats.good++;
    else if (quality === 4) this.sessionStats.easy++;
    
    // If failed or hard, add back to learning queue
    if (quality < 3) {
      this.learningQueue.push(card);
      // Sort learning queue
      this.learningQueue.sort((a, b) => a.dueDate - b.dueDate);
    }
    
    // Save progress
    this.saveProgress();
    
    // Update queue counts immediately after answering
    if (typeof updateQueueCounts === 'function') {
      updateQueueCounts();
    }
  }

  // Save progress to storage
  async saveProgress() {
    const cardsData = this.cards.map(c => c.toJSON());
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ cards: cardsData }, resolve);
    });
  }

  // Get queue counts
  getQueueCounts() {
    // Return total available counts, not just loaded in session
    return {
      new: this.totalCounts?.new || this.newQueue.length,
      learning: this.totalCounts?.learning || this.learningQueue.length,
      review: this.totalCounts?.review || this.reviewQueue.length,
      total: (this.totalCounts?.new || 0) + (this.totalCounts?.learning || 0) + (this.totalCounts?.review || 0)
    };
  }

  // Get session statistics
  getSessionStats() {
    const elapsed = Date.now() - this.sessionStats.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    return {
      ...this.sessionStats,
      timeSpent: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      successRate: this.sessionStats.studied > 0
        ? Math.round(((this.sessionStats.good + this.sessionStats.easy) / this.sessionStats.studied) * 100)
        : 0
    };
  }

  // Shuffle array
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

// ==================== UI CONTROLLER ====================
const session = new StudySession();
let currentCard = null;
let timerInterval = null;

// DOM Elements
const studyContainer = document.querySelector('.study-container');
const studyStatus = document.getElementById('studyStatus');
const cardDisplay = document.getElementById('cardDisplay');
const flashcard = document.getElementById('flashcard');
const frontContent = document.getElementById('frontContent');
const backContent = document.getElementById('backContent');
const cardTagsFront = document.getElementById('cardTagsFront');
const cardTagsBack = document.getElementById('cardTagsBack');
const cardStudyInfo = document.getElementById('cardStudyInfo');
const showAnswerContainer = document.getElementById('showAnswerContainer');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const ratingControls = document.getElementById('ratingControls');
const cardStatusBadge = document.getElementById('cardStatusBadge');
const currentCardNumber = document.getElementById('currentCardNumber');
const totalCards = document.getElementById('totalCards');
const progressBar = document.getElementById('progressBar');
const cardProgressFill = document.getElementById('cardProgressFill');
const cardProgressPercent = document.getElementById('cardProgressPercent');

// Header elements
const studyDeckName = document.getElementById('studyDeckName');
const newCount = document.getElementById('newCount');
const learningCount = document.getElementById('learningCount');
const reviewCount = document.getElementById('reviewCount');
const sessionCards = document.getElementById('sessionCards');
const sessionTime = document.getElementById('sessionTime');

// Settings modal
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const resetProgressBtn = document.getElementById('resetProgressBtn');
const newCardsLimitInput = document.getElementById('newCardsLimit');
const reviewCardsLimitInput = document.getElementById('reviewCardsLimit');
const randomizeCheck = document.getElementById('randomizeCheck');
const deckFilterSelect = document.getElementById('deckFilterSelect');
const tagsFilterInput = document.getElementById('tagsFilterInput');

// Buttons
const exitStudyBtn = document.getElementById('exitStudyBtn');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  await initializeStudy();
  setupEventListeners();
  startTimer();
});

async function initializeStudy() {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const filters = {
    deck: params.get('deck') || '',
    tags: params.get('tags') || ''
  };
  
  // Load cards
  await session.loadCards(filters);
  
  // Update UI
  if (filters.deck) {
    studyDeckName.textContent = `Studying: ${filters.deck}`;
  }
  
  // Populate settings
  await populateSettings();
  
  // Show first card or completion message
  updateQueueCounts();
  showNextCard();
}

async function populateSettings() {
  // Load decks
  const result = await chrome.storage.local.get(['decks', 'studySettings']);
  let decks = result.decks || {};
  const settings = result.studySettings || {};
  
  // Convert object format to array if needed
  let decksList = [];
  if (Array.isArray(decks)) {
    decksList = decks;
  } else if (typeof decks === 'object') {
    decksList = Object.values(decks).map(d => d.name || d);
  }
  
  // Populate deck filter
  deckFilterSelect.innerHTML = '<option value="">All Decks</option>';
  decksList.forEach(deck => {
    const option = document.createElement('option');
    option.value = deck;
    option.textContent = deck;
    deckFilterSelect.appendChild(option);
  });
  
  // Apply settings
  newCardsLimitInput.value = settings.newCardsLimit || 20;
  reviewCardsLimitInput.value = settings.reviewCardsLimit || 100;
  randomizeCheck.checked = settings.randomize || false;
  deckFilterSelect.value = settings.selectedDeck || '';
  tagsFilterInput.value = settings.selectedTags || '';
}

// ==================== CARD DISPLAY ====================
function showNextCard() {
  currentCard = session.getNextCard();
  
  if (!currentCard) {
    showCompletionStatus();
    return;
  }
  
  // Hide status, show card
  studyStatus.style.display = 'none';
  cardDisplay.style.display = 'block';
  
  // Reset flip state
  session.isFlipped = false;
  flashcard.classList.remove('flipped');
  
  // Display content
  frontContent.innerHTML = currentCard.front;
  backContent.innerHTML = currentCard.back;
  
  // Display tags
  displayTags(currentCard.tags, cardTagsFront);
  displayTags(currentCard.tags, cardTagsBack);
  
  // Display study info
  displayStudyInfo(currentCard);
  
  // Update card status badge
  updateCardStatusBadge(currentCard);
  
  // Show answer button, hide rating
  showAnswerContainer.style.display = 'flex';
  ratingControls.style.display = 'none';
  
  // Update counts
  updateQueueCounts();
  updateProgress();
}

function displayTags(tags, container) {
  container.innerHTML = '';
  if (!tags || tags.length === 0) return;
  
  tags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.textContent = tag;
    container.appendChild(tagEl);
  });
}

function displayStudyInfo(card) {
  const info = [];
  
  if (card.reviews > 0) {
    info.push(`Reviews: ${card.reviews}`);
  }
  
  if (card.lapses > 0) {
    info.push(`Lapses: ${card.lapses}`);
  }
  
  if (card.interval > 0) {
    const days = Math.round(card.interval);
    info.push(`Interval: ${days}d`);
  }
  
  if (card.easiness) {
    info.push(`Ease: ${Math.round(card.easiness * 100)}%`);
  }
  
  cardStudyInfo.innerHTML = info.length > 0
    ? `<div class="study-info-text">${info.join(' \u2022 ')}</div>`
    : '';
}

function updateCardStatusBadge(card) {
  const statusMap = {
    'new': { text: 'New Card', class: 'badge-new' },
    'learning': { text: 'Learning', class: 'badge-learning' },
    'review': { text: 'Review', class: 'badge-review' },
    'relearning': { text: 'Relearning', class: 'badge-relearning' }
  };
  
  const status = statusMap[card.status] || statusMap['new'];
  cardStatusBadge.textContent = status.text;
  cardStatusBadge.className = 'card-status-badge ' + status.class;
}

function updateQueueCounts() {
  const counts = session.getQueueCounts();
  
  newCount.textContent = `${counts.new} New`;
  learningCount.textContent = `${counts.learning} Learning`;
  reviewCount.textContent = `${counts.review} Review`;
  
  totalCards.textContent = counts.total;
  currentCardNumber.textContent = session.sessionStats.studied + 1;
  sessionCards.textContent = session.sessionStats.studied;
}

function updateProgress() {
  const stats = session.getSessionStats();
  const initialTotal = session.cards.length;
  const remaining = session.getQueueCounts().total;
  const studied = initialTotal - remaining;
  
  if (initialTotal > 0) {
    const progressPercent = (studied / initialTotal) * 100;
    const rounded = Math.round(progressPercent);
    progressBar.style.width = progressPercent + '%';
    if (cardProgressFill) cardProgressFill.style.width = progressPercent + '%';
    if (cardProgressPercent) cardProgressPercent.textContent = `${rounded}%`;
  } else {
    if (cardProgressFill) cardProgressFill.style.width = '0%';
    if (cardProgressPercent) cardProgressPercent.textContent = '0%';
  }
}

// ==================== CARD INTERACTION ====================
function flipCard() {
  if (!currentCard) return;
  
  session.isFlipped = !session.isFlipped;
  flashcard.classList.toggle('flipped');
  
  if (session.isFlipped) {
    // Show rating buttons with intervals
    showRatingButtons();
    showAnswerContainer.style.display = 'none';
    ratingControls.style.display = 'flex';
  } else {
    showAnswerContainer.style.display = 'flex';
    ratingControls.style.display = 'none';
  }
}

function showRatingButtons() {
  if (!currentCard) return;
  
  const intervals = currentCard.getScheduledIntervals();
  
  // Update button labels with intervals
  document.getElementById('againTime').textContent = formatInterval(intervals[1]);
  document.getElementById('hardTime').textContent = formatInterval(intervals[2]);
  document.getElementById('goodTime').textContent = formatInterval(intervals[3]);
  document.getElementById('easyTime').textContent = formatInterval(intervals[4]);
}

function formatInterval(days) {
  if (days < 1 / 1440) return '< 1m';
  if (days < 1 / 24) return `< ${Math.round(days * 1440)}m`;
  if (days < 1) return `< ${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

function rateCard(quality) {
  if (!currentCard || !session.isFlipped) return;
  
  session.answerCard(currentCard, quality);
  
  // Show next card
  setTimeout(() => {
    showNextCard();
  }, 200);
}

// ==================== COMPLETION ====================
function showCompletionStatus() {
  cardDisplay.style.display = 'none';
  studyStatus.style.display = 'flex';
  
  const stats = session.getSessionStats();
  
  if (stats.studied === 0) {
    document.getElementById('statusTitle').textContent = 'No Cards to Study';
    document.getElementById('statusMessage').textContent = 'All cards are up to date! Come back later or adjust your settings.';
    document.getElementById('statusActionBtn').textContent = 'Change Settings';
  } else {
    document.getElementById('statusTitle').textContent = 'Great Job!';
    document.getElementById('statusMessage').textContent = `You studied ${stats.studied} cards in ${stats.timeSpent}. Success rate: ${stats.successRate}%`;
    document.getElementById('statusActionBtn').textContent = 'Study More';
  }
}

// ==================== TIMER ====================
function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - session.sessionStats.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    sessionTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// ==================== SETTINGS ====================
function openSettings() {
  settingsModal.classList.add('active');
}

function closeSettings() {
  settingsModal.classList.remove('active');
}

async function applySettings() {
  const settings = {
    newCardsLimit: parseInt(newCardsLimitInput.value),
    reviewCardsLimit: parseInt(reviewCardsLimitInput.value),
    randomize: randomizeCheck.checked,
    selectedDeck: deckFilterSelect.value,
    selectedTags: tagsFilterInput.value
  };
  
  await chrome.storage.local.set({ studySettings: settings });
  
  // Restart session with new settings
  const params = new URLSearchParams();
  if (settings.selectedDeck) params.set('deck', settings.selectedDeck);
  if (settings.selectedTags) params.set('tags', settings.selectedTags);
  
  window.location.href = 'study-new.html' + (params.toString() ? '?' + params.toString() : '');
}

async function resetProgress() {
  if (!confirm('This will reset ALL study progress for all cards. Are you sure?')) {
    return;
  }
  
  const result = await chrome.storage.local.get(['cards']);
  const cards = result.cards || [];
  
  // Reset all cards
  const resetCards = cards.map(card => ({
    ...card,
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(),
    lastReview: null,
    reviews: 0,
    lapses: 0,
    status: 'new'
  }));
  
  await chrome.storage.local.set({ cards: resetCards });
  
  alert('Progress reset successfully!');
  window.location.reload();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Show answer
  showAnswerBtn.addEventListener('click', flipCard);
  
  // Rating buttons
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.dataset.rating);
      rateCard(rating);
    });
  });
  
  // Settings
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  applySettingsBtn.addEventListener('click', applySettings);
  resetProgressBtn.addEventListener('click', resetProgress);
  
  // Exit
  exitStudyBtn.addEventListener('click', () => {
    if (confirm('Exit study mode? Progress has been saved.')) {
      clearInterval(timerInterval);
      window.location.href = 'manage.html';
    }
  });
  
  // Status buttons
  document.getElementById('statusActionBtn').addEventListener('click', () => {
    if (session.sessionStats.studied === 0) {
      openSettings();
    } else {
      window.location.reload();
    }
  });
  
  document.getElementById('exitFromStatusBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    window.location.href = 'manage.html';
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (settingsModal.classList.contains('active')) return;
    
    switch(e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (!session.isFlipped) {
          flipCard();
        }
        break;
      case '1':
        if (session.isFlipped) rateCard(1);
        break;
      case '2':
        if (session.isFlipped) rateCard(2);
        break;
      case '3':
        if (session.isFlipped) rateCard(3);
        break;
      case '4':
        if (session.isFlipped) rateCard(4);
        break;
    }
  });
  
  // Close modal on backdrop click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });
}

// ==================== THEME MANAGEMENT ====================
function initTheme() {
  const themeSystemBtn = document.getElementById('themeSystemBtn');
  const themeLightBtn = document.getElementById('themeLightBtn');
  const themeDarkBtn = document.getElementById('themeDarkBtn');
  
  if (!themeSystemBtn || !themeLightBtn || !themeDarkBtn) return;
  
  // Load saved theme
  chrome.storage.local.get(['afc_theme'], (res) => {
    const theme = res.afc_theme || 'light';
    applyTheme(theme);
  });
  
  // Theme button event listeners
  themeSystemBtn.addEventListener('click', () => setTheme('system'));
  themeLightBtn.addEventListener('click', () => setTheme('light'));
  themeDarkBtn.addEventListener('click', () => setTheme('dark'));
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeQuery.addEventListener('change', () => {
      chrome.storage.local.get(['afc_theme'], (res) => {
        if (res.afc_theme === 'system') {
          applyTheme('system');
        }
      });
    });
  }
}

function setTheme(theme) {
  applyTheme(theme);
  chrome.storage.local.set({ afc_theme: theme });
}

function applyTheme(theme) {
  let effectiveTheme = theme;
  
  // Handle 'system' theme
  if (theme === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = prefersDark ? 'dark' : 'light';
  } else {
    effectiveTheme = (theme === 'light') ? 'light' : 'dark';
  }
  
  // Apply theme classes
  document.documentElement.classList.toggle('theme-light', effectiveTheme === 'light');
  document.documentElement.classList.toggle('theme-dark', effectiveTheme === 'dark');
  document.body.classList.toggle('theme-light', effectiveTheme === 'light');
  document.body.classList.toggle('theme-dark', effectiveTheme === 'dark');
  
  // Update button states
  const themeSystemBtn = document.getElementById('themeSystemBtn');
  const themeLightBtn = document.getElementById('themeLightBtn');
  const themeDarkBtn = document.getElementById('themeDarkBtn');
  
  if (themeSystemBtn && themeLightBtn && themeDarkBtn) {
    themeSystemBtn.classList.toggle('active', theme === 'system');
    themeLightBtn.classList.toggle('active', theme === 'light');
    themeDarkBtn.classList.toggle('active', theme === 'dark');
  }
}

// Initialize theme on load
initTheme();
