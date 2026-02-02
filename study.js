// Study Mode Logic
let studyCards = [];
let currentIndex = 0;
let isFlipped = false;
let studyProgress = {
  studied: 0,
  hard: 0,
  good: 0,
  easy: 0
};
let startTime = Date.now();
let timerInterval;
let autoFlipTimeout;

// DOM Elements
const flashcard = document.getElementById('flashcard');
const cardInner = document.getElementById('cardInner');
const frontContent = document.getElementById('frontContent');
const backContent = document.getElementById('backContent');
const cardTagsFront = document.getElementById('cardTagsFront');
const cardTagsBack = document.getElementById('cardTagsBack');
const currentCardNumber = document.getElementById('currentCardNumber');
const totalCards = document.getElementById('totalCards');
const studiedCount = document.getElementById('studiedCount');
const remainingCount = document.getElementById('remainingCount');
const sessionTime = document.getElementById('sessionTime');
const progressBar = document.getElementById('progressBar');
const flipBtn = document.getElementById('flipBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const difficultyControls = document.getElementById('difficultyControls');
const exitStudyBtn = document.getElementById('exitStudyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const resetProgressBtn = document.getElementById('resetProgressBtn');
const completionModal = document.getElementById('completionModal');
const exitFromCompletionBtn = document.getElementById('exitFromCompletionBtn');
const restartStudyBtn = document.getElementById('restartStudyBtn');
const studyDeckName = document.getElementById('studyDeckName');

// Settings elements
const randomizeCheck = document.getElementById('randomizeCheck');
const autoFlipCheck = document.getElementById('autoFlipCheck');
const autoFlipDelay = document.getElementById('autoFlipDelay');
const deckFilterSelect = document.getElementById('deckFilterSelect');
const tagsFilterInput = document.getElementById('tagsFilterInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStudySession();
  setupEventListeners();
  startTimer();
});

// Load study session
function loadStudySession() {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const deck = params.get('deck');
  const tags = params.get('tags');
  const cardId = params.get('cardId');
  
  chrome.storage.local.get(['cards', 'decks', 'studySettings'], (result) => {
    let allCards = result.cards || [];
    const allDecks = result.decks || ['Default'];
    const settings = result.studySettings || {
      randomize: false,
      autoFlip: false,
      autoFlipDelay: 5,
      selectedDeck: '',
      selectedTags: ''
    };
    
    // Populate deck filter
    populateDeckFilter(allDecks);
    
    // Apply saved settings
    randomizeCheck.checked = settings.randomize;
    autoFlipCheck.checked = settings.autoFlip;
    autoFlipDelay.value = settings.autoFlipDelay || 5;
    deckFilterSelect.value = deck || settings.selectedDeck || '';
    tagsFilterInput.value = tags || settings.selectedTags || '';
    
    // If a single card is requested, study ONLY that card (ignore deck/tags filters)
    if (cardId) {
      allCards = allCards.filter(card => String(card.id) === String(cardId));
      studyDeckName.textContent = 'Studying: 1 selected card';
    }

    // Filter cards by deck (only when not studying a single card)
    if (!cardId && deck) {
      allCards = allCards.filter(card => card.deck === deck);
      studyDeckName.textContent = `Studying: ${deck}`;
    } else if (!cardId) {
      studyDeckName.textContent = 'Study Mode - All Cards';
    }
    
    // Filter cards by tags
    if (tags && !cardId) {
      const tagsList = tags.split(',').map(t => t.trim().toLowerCase());
      allCards = allCards.filter(card => {
        if (!card.tags || card.tags.length === 0) return false;
        return card.tags.some(tag => tagsList.includes(tag.toLowerCase()));
      });
    }
    
    studyCards = allCards;
    
    // Randomize if enabled
    if (settings.randomize) {
      shuffleArray(studyCards);
    }
    
    if (studyCards.length === 0) {
      showNoCardsMessage();
      return;
    }
    
    totalCards.textContent = studyCards.length;
    remainingCount.textContent = studyCards.length;
    
    displayCard();
    updateProgress();
  });
}

// Populate deck filter
function populateDeckFilter(decks) {
  deckFilterSelect.innerHTML = '<option value="">All Decks</option>';
  decks.forEach(deck => {
    const option = document.createElement('option');
    option.value = deck;
    option.textContent = deck;
    deckFilterSelect.appendChild(option);
  });
}

// Display current card
function displayCard() {
  if (currentIndex >= studyCards.length) {
    showCompletionModal();
    return;
  }
  
  const card = studyCards[currentIndex];
  
  // Reset flip state
  isFlipped = false;
  flashcard.classList.remove('flipped');
  difficultyControls.style.display = 'none';
  
  // Display content
  frontContent.innerHTML = card.front;
  backContent.innerHTML = card.back;
  
  // Display tags
  displayTags(card.tags, cardTagsFront);
  displayTags(card.tags, cardTagsBack);
  
  // Update navigation
  currentCardNumber.textContent = currentIndex + 1;
  prevBtn.disabled = currentIndex === 0;
  
  // Clear any existing auto-flip timeout
  clearTimeout(autoFlipTimeout);
  
  // Auto-flip if enabled
  if (autoFlipCheck.checked) {
    const delay = parseInt(autoFlipDelay.value) * 1000;
    autoFlipTimeout = setTimeout(() => {
      if (!isFlipped) flipCard();
    }, delay);
  }
}

// Display tags
function displayTags(tags, container) {
  container.innerHTML = '';
  if (!tags || tags.length === 0) return;
  
  tags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'card-tag';
    tagEl.textContent = tag;
    container.appendChild(tagEl);
  });
}

// Flip card
function flipCard() {
  isFlipped = !isFlipped;
  flashcard.classList.toggle('flipped');
  
  // Show difficulty buttons after flip to back
  if (isFlipped) {
    difficultyControls.style.display = 'flex';
  } else {
    difficultyControls.style.display = 'none';
  }
  
  // Clear auto-flip timeout
  clearTimeout(autoFlipTimeout);
}

// Navigate to previous card
function goToPrevious() {
  if (currentIndex > 0) {
    currentIndex--;
    displayCard();
    updateProgress();
  }
}

// Navigate to next card
function goToNext() {
  if (currentIndex < studyCards.length - 1) {
    currentIndex++;
    studyProgress.studied = Math.max(studyProgress.studied, currentIndex);
    displayCard();
    updateProgress();
  } else {
    showCompletionModal();
  }
}

// Handle difficulty rating
function rateDifficulty(difficulty) {
  studyProgress[difficulty]++;
  studyProgress.studied = Math.max(studyProgress.studied, currentIndex + 1);
  
  // Move to next card
  if (currentIndex < studyCards.length - 1) {
    currentIndex++;
    displayCard();
    updateProgress();
  } else {
    showCompletionModal();
  }
}

// Update progress
function updateProgress() {
  studiedCount.textContent = studyProgress.studied;
  remainingCount.textContent = studyCards.length - studyProgress.studied;
  
  const progressPercent = (studyProgress.studied / studyCards.length) * 100;
  progressBar.style.width = progressPercent + '%';
}

// Start timer
function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// Show completion modal
function showCompletionModal() {
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  
  document.getElementById('completionCardsStudied').textContent = studyProgress.studied;
  document.getElementById('completionTimeSpent').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Calculate confidence (easy and good answers)
  const goodAnswers = studyProgress.easy + studyProgress.good;
  const confidence = studyCards.length > 0 
    ? Math.round((goodAnswers / studyCards.length) * 100)
    : 0;
  document.getElementById('completionAccuracy').textContent = confidence + '%';
  
  completionModal.classList.add('active');
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Show no cards message
function showNoCardsMessage() {
  frontContent.innerHTML = '<div style="text-align: center;"><h2>No cards to study</h2><p>Add some cards or adjust your filters</p></div>';
  backContent.innerHTML = '';
  totalCards.textContent = '0';
  remainingCount.textContent = '0';
  flipBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

// Save and apply settings
function applySettings() {
  const settings = {
    randomize: randomizeCheck.checked,
    autoFlip: autoFlipCheck.checked,
    autoFlipDelay: parseInt(autoFlipDelay.value),
    selectedDeck: deckFilterSelect.value,
    selectedTags: tagsFilterInput.value
  };
  
  chrome.storage.local.set({ studySettings: settings }, () => {
    // Restart study session with new settings
    const params = new URLSearchParams();
    if (settings.selectedDeck) params.set('deck', settings.selectedDeck);
    if (settings.selectedTags) params.set('tags', settings.selectedTags);
    
    window.location.href = 'study.html' + (params.toString() ? '?' + params.toString() : '');
  });
}

// Reset progress
function resetProgress() {
  if (confirm('Are you sure you want to reset your study progress?')) {
    currentIndex = 0;
    studyProgress = {
      studied: 0,
      hard: 0,
      good: 0,
      easy: 0
    };
    startTime = Date.now();
    
    if (randomizeCheck.checked) {
      shuffleArray(studyCards);
    }
    
    displayCard();
    updateProgress();
    closeModal(settingsModal);
  }
}

// Exit study mode
function exitStudy() {
  if (confirm('Exit study mode? Your progress will be lost.')) {
    clearInterval(timerInterval);
    clearTimeout(autoFlipTimeout);
    window.close();
    
    // If can't close (not opened by script), navigate to manage page
    setTimeout(() => {
      window.location.href = 'manage.html';
    }, 100);
  }
}

// Modal controls
function closeModal(modal) {
  modal.classList.remove('active');
}

function openModal(modal) {
  modal.classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
  // Card navigation
  flipBtn.addEventListener('click', flipCard);
  prevBtn.addEventListener('click', goToPrevious);
  nextBtn.addEventListener('click', goToNext);
  
  // Flashcard click to flip
  flashcard.addEventListener('click', (e) => {
    if (!e.target.closest('.card-tag')) {
      flipCard();
    }
  });
  
  // Difficulty buttons
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const difficulty = btn.dataset.difficulty;
      rateDifficulty(difficulty);
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (settingsModal.classList.contains('active') || 
        completionModal.classList.contains('active')) return;
    
    switch(e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        flipCard();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case '1':
        if (isFlipped) rateDifficulty('hard');
        break;
      case '2':
        if (isFlipped) rateDifficulty('good');
        break;
      case '3':
        if (isFlipped) rateDifficulty('easy');
        break;
      case 'Escape':
        exitStudy();
        break;
    }
  });
  
  // Exit button
  exitStudyBtn.addEventListener('click', exitStudy);
  
  // Settings modal
  settingsBtn.addEventListener('click', () => openModal(settingsModal));
  closeSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
  applySettingsBtn.addEventListener('click', applySettings);
  resetProgressBtn.addEventListener('click', resetProgress);
  
  // Completion modal
  exitFromCompletionBtn.addEventListener('click', exitStudy);
  restartStudyBtn.addEventListener('click', () => {
    completionModal.classList.remove('active');
    currentIndex = 0;
    studyProgress = {
      studied: 0,
      hard: 0,
      good: 0,
      easy: 0
    };
    startTime = Date.now();
    
    if (randomizeCheck.checked) {
      shuffleArray(studyCards);
    }
    
    displayCard();
    updateProgress();
  });
  
  // Close modals on backdrop click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal(settingsModal);
  });
  
  completionModal.addEventListener('click', (e) => {
    if (e.target === completionModal) closeModal(completionModal);
  });
}
