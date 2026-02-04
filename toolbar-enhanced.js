/**
 * Enhanced Toolbar Functionality
 * Xử lý các tính năng định dạng văn bản nâng cao
 */

class EnhancedToolbar {
  constructor() {
    this.initToolbarHandlers();
    this.initColorPickers();
    this.initTextStyleHandlers();
    this.initMediaHandlers();
    this.initKeyboardShortcuts();
  }

  /**
   * Khởi tạo các handler cho toolbar buttons
   */
  initToolbarHandlers() {
    // Xử lý tất cả các nút toolbar với data-command
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.getAttribute('data-command');
        const target = btn.getAttribute('data-target');
        this.executeCommand(command, target);
      });
    });
  }

  /**
   * Thực thi lệnh định dạng
   */
  executeCommand(command, target = null) {
    // Lấy editor target nếu có
    let editor = null;
    if (target === 'front') {
      editor = document.getElementById('frontEditor') || 
               document.getElementById('sidebarFrontEditor');
    } else if (target === 'back') {
      editor = document.getElementById('backEditor') || 
               document.getElementById('sidebarBackEditor');
    }

    // Focus vào editor nếu cần
    if (editor && document.activeElement !== editor) {
      editor.focus();
    }

    // Thực thi lệnh
    try {
      document.execCommand(command, false, null);
      
      // Update active state
      this.updateToolbarState();
    } catch (error) {
      console.error('Error executing command:', command, error);
    }
  }

  /**
   * Khởi tạo color pickers
   */
  initColorPickers() {
    // Text color pickers
    this.setupColorPicker('textColorPickerFront', 'textColorBtnFront', 'front', 'foreColor');
    this.setupColorPicker('textColorPickerBack', 'textColorBtnBack', 'back', 'foreColor');
    this.setupColorPicker('textColorPickerFrontSidebar', 'textColorBtnFrontSidebar', 'front', 'foreColor');
    this.setupColorPicker('textColorPickerBackSidebar', 'textColorBtnBackSidebar', 'back', 'foreColor');

    // Background color pickers
    this.setupColorPicker('bgColorPickerFront', 'bgColorBtnFront', 'front', 'hiliteColor');
    this.setupColorPicker('bgColorPickerBack', 'bgColorBtnBack', 'back', 'hiliteColor');
    this.setupColorPicker('bgColorPickerFrontSidebar', 'bgColorBtnFrontSidebar', 'front', 'hiliteColor');
    this.setupColorPicker('bgColorPickerBackSidebar', 'bgColorBtnBackSidebar', 'back', 'hiliteColor');
  }

  /**
   * Setup color picker
   */
  setupColorPicker(pickerId, btnId, target, command) {
    const picker = document.getElementById(pickerId);
    const btn = document.getElementById(btnId);

    if (!picker || !btn) return;

    // Click button to open color picker
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      picker.click();
    });

    // Apply color when selected
    picker.addEventListener('input', (e) => {
      const color = e.target.value;
      this.applyColor(color, target, command);
      
      // Update button visual
      this.updateColorButtonVisual(btn, color, command);
    });

    picker.addEventListener('change', (e) => {
      const color = e.target.value;
      this.applyColor(color, target, command);
      this.updateColorButtonVisual(btn, color, command);
    });
  }

  /**
   * Apply color to selection
   */
  applyColor(color, target, command) {
    // Focus vào editor
    let editor = null;
    if (target === 'front') {
      editor = document.getElementById('frontEditor') || 
               document.getElementById('sidebarFrontEditor');
    } else if (target === 'back') {
      editor = document.getElementById('backEditor') || 
               document.getElementById('sidebarBackEditor');
    }

    if (editor) {
      editor.focus();
    }

    // Apply color
    try {
      document.execCommand(command, false, color);
    } catch (error) {
      console.error('Error applying color:', error);
    }
  }

  /**
   * Update color button visual
   */
  updateColorButtonVisual(btn, color, command) {
    const span = btn.querySelector('span');
    if (!span) return;

    if (command === 'foreColor') {
      span.style.borderBottomColor = color;
    } else if (command === 'hiliteColor') {
      span.style.background = color;
    }
  }

  /**
   * Khởi tạo text style handlers (H1, H2, H3, Normal)
   */
  initTextStyleHandlers() {
    // Text style selects
    this.setupTextStyleSelect('textStyleFront', 'front');
    this.setupTextStyleSelect('textStyleBack', 'back');
    this.setupTextStyleSelect('textStyleFrontSidebar', 'front');
    this.setupTextStyleSelect('textStyleBackSidebar', 'back');
  }

  /**
   * Setup text style select
   */
  setupTextStyleSelect(selectId, target) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.addEventListener('change', (e) => {
      const tag = e.target.value;
      this.applyTextStyle(tag, target);
    });
  }

  /**
   * Apply text style (heading or paragraph)
   */
  applyTextStyle(tag, target) {
    // Focus vào editor
    let editor = null;
    if (target === 'front') {
      editor = document.getElementById('frontEditor') || 
               document.getElementById('sidebarFrontEditor');
    } else if (target === 'back') {
      editor = document.getElementById('backEditor') || 
               document.getElementById('sidebarBackEditor');
    }

    if (editor) {
      editor.focus();
    }

    // Apply formatting
    try {
      document.execCommand('formatBlock', false, tag);
    } catch (error) {
      console.error('Error applying text style:', error);
    }
  }

  /**
   * Khởi tạo media handlers
   */
  initMediaHandlers() {
    // Link buttons
    this.setupLinkButton('linkBtnFront', 'front');
    this.setupLinkButton('linkBtnBack', 'back');
    this.setupLinkButton('linkBtnFrontSidebar', 'front');
    this.setupLinkButton('linkBtnBackSidebar', 'back');

    // Image buttons
    this.setupImageButton('imageBtnFront', 'imageInputFront', 'front');
    this.setupImageButton('imageBtnBack', 'imageInputBack', 'back');
    this.setupImageButton('imageBtnFrontSidebar', 'imageInputFrontSidebar', 'front');
    this.setupImageButton('imageBtnBackSidebar', 'imageInputBackSidebar', 'back');

    // Audio buttons
    this.setupAudioButton('audioBtnFront', 'audioInputFront', 'front');
    this.setupAudioButton('audioBtnBack', 'audioInputBack', 'back');
    this.setupAudioButton('audioBtnFrontSidebar', 'audioInputFrontSidebar', 'front');
    this.setupAudioButton('audioBtnBackSidebar', 'audioInputBackSidebar', 'back');
  }

  /**
   * Setup link button
   */
  setupLinkButton(btnId, target) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.insertLink(target);
    });
  }

  /**
   * Insert link
   */
  insertLink(target) {
    const url = prompt('Enter URL:');
    if (!url) return;

    // Focus vào editor
    let editor = null;
    if (target === 'front') {
      editor = document.getElementById('frontEditor') || 
               document.getElementById('sidebarFrontEditor');
    } else if (target === 'back') {
      editor = document.getElementById('backEditor') || 
               document.getElementById('sidebarBackEditor');
    }

    if (editor) {
      editor.focus();
    }

    // Insert link
    try {
      document.execCommand('createLink', false, url);
    } catch (error) {
      console.error('Error inserting link:', error);
    }
  }

  /**
   * Setup image button
   */
  setupImageButton(btnId, inputId, target) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    
    if (!btn || !input) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      input.click();
    });

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.insertImage(file, target);
        input.value = ''; // Reset input
      }
    });
  }

  /**
   * Insert image
   */
  insertImage(file, target) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageData = e.target.result;
      
      // Get editor
      let editor = null;
      if (target === 'front') {
        editor = document.getElementById('frontEditor') || 
                 document.getElementById('sidebarFrontEditor');
      } else if (target === 'back') {
        editor = document.getElementById('backEditor') || 
                 document.getElementById('sidebarBackEditor');
      }

      if (!editor) return;

      // Create image element
      const img = document.createElement('img');
      img.src = imageData;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '4px';
      img.style.margin = '8px 0';

      // Create wrapper with remove button
      const wrapper = document.createElement('div');
      wrapper.className = 'media-wrapper';
      wrapper.contentEditable = false;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'media-remove';
      removeBtn.innerHTML = '✕';
      removeBtn.title = 'Remove image';
      removeBtn.onclick = () => wrapper.remove();
      
      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);

      // Insert at cursor position
      editor.focus();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(wrapper);
      
      // Move cursor after image
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Setup audio button
   */
  setupAudioButton(btnId, inputId, target) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    
    if (!btn || !input) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      input.click();
    });

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.insertAudio(file, target);
        input.value = ''; // Reset input
      }
    });
  }

  /**
   * Insert audio
   */
  insertAudio(file, target) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const audioData = e.target.result;
      
      // Get editor
      let editor = null;
      if (target === 'front') {
        editor = document.getElementById('frontEditor') || 
                 document.getElementById('sidebarFrontEditor');
      } else if (target === 'back') {
        editor = document.getElementById('backEditor') || 
                 document.getElementById('sidebarBackEditor');
      }

      if (!editor) return;

      // Create audio element
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = audioData;
      audio.style.width = '100%';
      audio.style.margin = '8px 0';

      // Create wrapper with remove button
      const wrapper = document.createElement('div');
      wrapper.className = 'media-wrapper audio-player';
      wrapper.contentEditable = false;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'media-remove';
      removeBtn.innerHTML = '✕';
      removeBtn.title = 'Remove audio';
      removeBtn.onclick = () => wrapper.remove();
      
      wrapper.appendChild(audio);
      wrapper.appendChild(removeBtn);

      // Insert at cursor position
      editor.focus();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(wrapper);
      
      // Move cursor after audio
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Khởi tạo keyboard shortcuts
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + B = Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold');
      }
      
      // Ctrl/Cmd + I = Italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic');
      }
      
      // Ctrl/Cmd + U = Underline
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.execCommand('underline');
      }
      
      // Ctrl/Cmd + K = Insert Link
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const target = this.getActiveEditorTarget();
        if (target) {
          this.insertLink(target);
        }
      }
    });
  }

  /**
   * Get active editor target
   */
  getActiveEditorTarget() {
    const activeElement = document.activeElement;
    
    if (activeElement.id === 'frontEditor' || 
        activeElement.id === 'sidebarFrontEditor') {
      return 'front';
    } else if (activeElement.id === 'backEditor' || 
               activeElement.id === 'sidebarBackEditor') {
      return 'back';
    }
    
    return null;
  }

  /**
   * Update toolbar state based on selection
   */
  updateToolbarState() {
    // Get all toolbar buttons
    const buttons = document.querySelectorAll('.toolbar-btn[data-command]');
    
    buttons.forEach(btn => {
      const command = btn.getAttribute('data-command');
      
      try {
        // Check if command is active
        const isActive = document.queryCommandState(command);
        
        if (isActive) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      } catch (error) {
        // Some commands don't support queryCommandState
      }
    });
  }
}

// Initialize enhanced toolbar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new EnhancedToolbar();
  });
} else {
  new EnhancedToolbar();
}

// Update toolbar state on selection change
document.addEventListener('selectionchange', () => {
  // Debounce để tránh gọi quá nhiều
  if (window.toolbarUpdateTimeout) {
    clearTimeout(window.toolbarUpdateTimeout);
  }
  
  window.toolbarUpdateTimeout = setTimeout(() => {
    const toolbar = new EnhancedToolbar();
    toolbar.updateToolbarState();
  }, 100);
});
