// Media Handler Module - Download and store media files locally
// This module handles downloading images, audio, and video files
// and storing them in Chrome storage with base64 encoding

const MediaHandler = {
  // Maximum size for media files (5MB per file, Chrome storage limit consideration)
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  /**
   * Download and convert media to base64
   * @param {string} url - URL of the media file
   * @param {string} type - Type of media (image/audio/video)
   * @returns {Promise<Object>} - Object with base64 data and metadata
   */
  async downloadMedia(url, type = 'image') {
    try {
      console.log(`Downloading ${type}:`, url);
      
      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      // Check file size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.MAX_FILE_SIZE) {
        console.warn('File too large, keeping original URL');
        return { useOriginalUrl: true, url, type };
      }
      
      // Get blob
      const blob = await response.blob();
      
      // Check actual size
      if (blob.size > this.MAX_FILE_SIZE) {
        console.warn('File too large after download, keeping original URL');
        return { useOriginalUrl: true, url, type };
      }
      
      // Convert to base64
      const base64 = await this.blobToBase64(blob);
      
      // Get MIME type
      const mimeType = blob.type || this.guessMimeType(url, type);
      
      return {
        base64: base64,
        mimeType: mimeType,
        size: blob.size,
        originalUrl: url,
        type: type,
        downloadedAt: Date.now()
      };
      
    } catch (error) {
      console.error('Error downloading media:', error);
      // Fallback to original URL
      return { useOriginalUrl: true, url, type, error: error.message };
    }
  },
  
  /**
   * Convert Blob to base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
  
  /**
   * Guess MIME type from URL and type
   */
  guessMimeType(url, type) {
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    
    const mimeTypes = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      
      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogv: 'video/ogg',
      mov: 'video/quicktime'
    };
    
    if (mimeTypes[ext]) {
      return mimeTypes[ext];
    }
    
    // Fallback based on type
    if (type === 'image') return 'image/jpeg';
    if (type === 'audio') return 'audio/mpeg';
    if (type === 'video') return 'video/mp4';
    
    return 'application/octet-stream';
  },
  
  /**
   * Process HTML content and download all media
   * @param {string} html - HTML content with media tags
   * @returns {Promise<string>} - HTML with media replaced by base64
   */
  async processHTMLContent(html) {
    if (!html) return html;
    
    const container = document.createElement('div');
    container.innerHTML = html;
    
    // Process images
    const images = container.querySelectorAll('img');
    for (const img of images) {
      const src = img.getAttribute('src');
      if (src && this.isRemoteUrl(src)) {
        const result = await this.downloadMedia(src, 'image');
        if (result.base64) {
          img.setAttribute('src', result.base64);
          img.setAttribute('data-original-url', result.originalUrl);
          img.setAttribute('data-downloaded-at', result.downloadedAt);
        }
      }
    }
    
    // Process audio
    const audios = container.querySelectorAll('audio');
    for (const audio of audios) {
      const src = audio.getAttribute('src');
      if (src && this.isRemoteUrl(src)) {
        const result = await this.downloadMedia(src, 'audio');
        if (result.base64) {
          audio.setAttribute('src', result.base64);
          audio.setAttribute('data-original-url', result.originalUrl);
        } else if (result.useOriginalUrl) {
          // Keep original URL if download failed or file too large
          audio.setAttribute('data-original-url', src);
        }
      }
      
      // Process source tags inside audio
      const sources = audio.querySelectorAll('source');
      for (const source of sources) {
        const src = source.getAttribute('src');
        if (src && this.isRemoteUrl(src)) {
          const result = await this.downloadMedia(src, 'audio');
          if (result.base64) {
            source.setAttribute('src', result.base64);
            source.setAttribute('data-original-url', result.originalUrl);
          }
        }
      }
    }
    
    // Process video
    const videos = container.querySelectorAll('video');
    for (const video of videos) {
      const src = video.getAttribute('src');
      if (src && this.isRemoteUrl(src)) {
        // Videos are usually large, so we keep original URLs
        // But we can try for small videos
        const result = await this.downloadMedia(src, 'video');
        if (result.base64 && result.size < 2 * 1024 * 1024) { // Only if < 2MB
          video.setAttribute('src', result.base64);
          video.setAttribute('data-original-url', result.originalUrl);
        } else {
          // Keep original URL for large videos
          video.setAttribute('data-original-url', src);
        }
      }
      
      // Process source tags inside video
      const sources = video.querySelectorAll('source');
      for (const source of sources) {
        const src = source.getAttribute('src');
        if (src && this.isRemoteUrl(src)) {
          const result = await this.downloadMedia(src, 'video');
          if (result.base64 && result.size < 2 * 1024 * 1024) {
            source.setAttribute('src', result.base64);
            source.setAttribute('data-original-url', result.originalUrl);
          } else {
            source.setAttribute('data-original-url', src);
          }
        }
      }
    }
    
    return container.innerHTML;
  },
  
  /**
   * Check if URL is remote (not base64 or blob)
   */
  isRemoteUrl(url) {
    if (!url) return false;
    if (url.startsWith('data:')) return false; // Already base64
    if (url.startsWith('blob:')) return false;
    if (url.startsWith('chrome-extension:')) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  },
  
  /**
   * Get storage usage info
   */
  async getStorageInfo() {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB default
        resolve({
          used: bytes,
          quota: quota,
          percentage: (bytes / quota * 100).toFixed(2),
          available: quota - bytes
        });
      });
    });
  },
  
  /**
   * Clean up old media (if storage is getting full)
   * This can be called periodically or when storage is > 80%
   */
  async cleanupOldMedia() {
    const info = await this.getStorageInfo();
    if (parseFloat(info.percentage) < 80) {
      return; // No need to cleanup
    }
    
    console.log('Storage usage high, considering cleanup...');
    // In future: implement cleanup strategy
    // For now, just log warning
    console.warn('Storage is', info.percentage, '% full. Consider exporting and cleaning old cards.');
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MediaHandler;
}
