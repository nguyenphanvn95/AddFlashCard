// Intro page logic extracted from inline script to satisfy extension CSP.
(function () {
  const setupModal = document.getElementById('setupModal');
  const setupContinueBtn = document.getElementById('setupContinueBtn');
  const folderStatus = document.getElementById('folderStatus');
  const folderPath = document.getElementById('folderPath');

  let selectedChoice = null;
  const setupUrlParams = new URLSearchParams(window.location.search);
  const forceSetupMode = setupUrlParams.get('forceSetup') === '1';

  async function checkFirstRun() {
    const result = await chrome.storage.local.get(['intro_completed', 'sync_folder_selected']);
    const hasDirectory = !!(window.storageManager && window.storageManager.storageDir);
    const shouldShowModal = forceSetupMode || !result.intro_completed || !result.sync_folder_selected || !hasDirectory;

    if (shouldShowModal) {
      if (!hasDirectory) {
        await chrome.storage.local.set({ sync_folder_selected: false });
      }
      setupModal.classList.add('active');
    }
  }

  function bindSetupOptions() {
    const options = document.querySelectorAll('.setup-option');
    options.forEach((option) => {
      option.addEventListener('click', async function () {
        options.forEach((opt) => opt.classList.remove('selected'));
        this.classList.add('selected');
        selectedChoice = this.dataset.choice;

        if (selectedChoice === 'select') {
          try {
            if ('showDirectoryPicker' in window) {
              const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
              });

              folderPath.textContent = dirHandle.name || 'Thu muc da chon';
              folderStatus.classList.add('active');
              setupContinueBtn.disabled = false;

              if (window.storageManager) {
                window.storageManager.storageDir = dirHandle;
                await window.storageManager.saveDirectoryHandle();
                await window.storageManager.syncBothWays();
              }

              await chrome.storage.local.set({ sync_folder_selected: true });
            } else {
              alert('Trinh duyet khong ho tro File System Access API.');
              setupContinueBtn.disabled = false;
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error('Error selecting folder:', error);
            }
            this.classList.remove('selected');
            selectedChoice = null;
          }
        } else if (selectedChoice === 'skip') {
          if (forceSetupMode) {
            this.classList.remove('selected');
            selectedChoice = null;
            setupContinueBtn.disabled = true;
            alert('Ban can chon thu muc luu du lieu truoc khi tiep tuc.');
            return;
          }
          folderStatus.classList.remove('active');
          setupContinueBtn.disabled = false;
        }
      });
    });
  }

  function bindContinueButton() {
    setupContinueBtn.addEventListener('click', async () => {
      if (forceSetupMode) {
        const hasDirectory = !!(window.storageManager && window.storageManager.storageDir);
        if (!hasDirectory) {
          alert('Ban can chon thu muc luu du lieu truoc khi tiep tuc.');
          return;
        }
      }

      await chrome.storage.local.set({ intro_completed: true });

      const modalContent = setupModal.querySelector('.setup-modal-content');
      if (modalContent) {
        modalContent.style.animation = 'modalSlideOut 0.3s ease-out';
      }

      setTimeout(() => {
        setupModal.classList.remove('active');
        if (setupUrlParams.get('returnTo') === 'manage') {
          window.location.href = chrome.runtime.getURL('manage.html');
        }
      }, 300);
    });
  }

  function addModalSlideOutKeyframes() {
    const style = document.createElement('style');
    style.textContent = [
      '@keyframes modalSlideOut {',
      '  from { opacity: 1; transform: translateY(0); }',
      '  to { opacity: 0; transform: translateY(-50px); }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  async function initializeIntroSetup() {
    try {
      if (!setupModal || !setupContinueBtn || !folderStatus || !folderPath) {
        console.error('Setup modal elements not found in intro.html');
        return;
      }

      bindSetupOptions();
      bindContinueButton();
      addModalSlideOutKeyframes();

      if (window.storageManager) {
        try {
          await window.storageManager.initialize();
        } catch (error) {
          console.error('Storage manager init failed on intro page:', error);
        }
      }

      await checkFirstRun();

      if (!window.storageManager || !window.storageManager.storageDir) {
        setupModal.classList.add('active');
      }
    } catch (error) {
      console.error('initializeIntroSetup failed:', error);
      if (setupModal) {
        setupModal.classList.add('active');
      }
    }
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  function setupFadeInObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
      observer.observe(el);
    });
  }

  function initializePage() {
    initializeIntroSetup();
    setupSmoothScroll();
    setupFadeInObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
  } else {
    initializePage();
  }
})();

