// AnkiConnect Module
// Syncs flashcards to Anki using AnkiConnect add-on

class AnkiConnectClient {
  constructor() {
    this.url = 'http://127.0.0.1:8765';
    this.version = 6;
  }

  // Send request to AnkiConnect
  async invoke(action, params = {}) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        version: this.version,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.result;
  }

  // Test connection
  async testConnection() {
    try {
      await this.invoke('version');
      return true;
    } catch (error) {
      console.error('AnkiConnect connection failed:', error);
      return false;
    }
  }

  // Get all deck names
  async getDeckNames() {
    return await this.invoke('deckNames');
  }

  // Create deck if it doesn't exist
  async createDeck(deckName) {
    return await this.invoke('createDeck', { deck: deckName });
  }

  // Get model (note type) names
  async getModelNames() {
    return await this.invoke('modelNames');
  }

  // Get model field names
  async getModelFieldNames(modelName) {
    return await this.invoke('modelFieldNames', { modelName });
  }

  // Create model (note type)
  async createModel(modelName, fields, cardTemplates) {
    return await this.invoke('createModel', {
      modelName,
      inOrderFields: fields,
      css: `.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}`,
      cardTemplates
    });
  }

  // Add note
  async addNote(deckName, modelName, fields, tags = []) {
    return await this.invoke('addNote', {
      note: {
        deckName,
        modelName,
        fields,
        tags,
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck'
        }
      }
    });
  }

  // Add multiple notes
  async addNotes(notes) {
    return await this.invoke('addNotes', { notes });
  }

  // Update note fields
  async updateNoteFields(noteId, fields) {
    return await this.invoke('updateNoteFields', {
      note: {
        id: noteId,
        fields
      }
    });
  }

  // Find notes
  async findNotes(query) {
    return await this.invoke('findNotes', { query });
  }

  // Get note info
  async notesInfo(noteIds) {
    return await this.invoke('notesInfo', { notes: noteIds });
  }

  // Sync Anki
  async sync() {
    return await this.invoke('sync');
  }

  // Store media file in Anki
  async storeMediaFile(filename, data) {
    // data is base64 string
    return await this.invoke('storeMediaFile', {
      filename,
      data
    });
  }

  // Extract media from HTML and upload to Anki
  async extractAndUploadMedia(html) {
    if (!html) return html;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let mediaIndex = 0;
    
    // Extract and upload images
    const images = doc.querySelectorAll('img');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.getAttribute('src');
      if (!src) continue;
      
      let ankiFilename = null;
      
      // Handle base64 images
      if (src.startsWith('data:')) {
        try {
          const ext = src.match(/data:image\/(\w+)/)?.[1] || 'png';
          ankiFilename = `addflashcard_img_${Date.now()}_${mediaIndex}.${ext}`;
          const base64Data = src.split(',')[1]; // Remove "data:image/png;base64," prefix
          
          await this.storeMediaFile(ankiFilename, base64Data);
          img.setAttribute('src', ankiFilename);
          mediaIndex++;
          console.log(`[AnkiConnect] Uploaded image: ${ankiFilename}`);
        } catch (err) {
          console.error(`[AnkiConnect] Failed to upload base64 image:`, err);
        }
      }
      // Handle HTTP URLs
      else if (src.startsWith('http')) {
        try {
          const response = await fetch(src, { mode: 'cors' });
          const blob = await response.blob();
          const ext = blob.type.split('/')[1] || 'png';
          ankiFilename = `addflashcard_img_${Date.now()}_${mediaIndex}.${ext}`;
          
          // Convert blob to base64
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          await this.storeMediaFile(ankiFilename, base64Data);
          img.setAttribute('src', ankiFilename);
          mediaIndex++;
          console.log(`[AnkiConnect] Uploaded image: ${ankiFilename}`);
        } catch (err) {
          console.error(`[AnkiConnect] Failed to fetch and upload image:`, err);
          // Keep original URL if upload fails
        }
      }
    }
    
    // Extract and upload audio
    const audios = doc.querySelectorAll('audio');
    for (let i = 0; i < audios.length; i++) {
      const audio = audios[i];
      const src = audio.getAttribute('src') || audio.querySelector('source')?.getAttribute('src');
      if (!src) continue;
      
      let ankiFilename = null;
      
      if (src.startsWith('data:')) {
        try {
          const ext = src.match(/data:audio\/(\w+)/)?.[1] || 'mp3';
          ankiFilename = `addflashcard_audio_${Date.now()}_${mediaIndex}.${ext}`;
          const base64Data = src.split(',')[1];
          
          await this.storeMediaFile(ankiFilename, base64Data);
          // Replace audio element with [sound:filename]
          const soundTag = document.createElement('span');
          soundTag.textContent = `[sound:${ankiFilename}]`;
          audio.replaceWith(soundTag);
          mediaIndex++;
          console.log(`[AnkiConnect] Uploaded audio: ${ankiFilename}`);
        } catch (err) {
          console.error(`[AnkiConnect] Failed to upload base64 audio:`, err);
        }
      }
      else if (src.startsWith('http')) {
        try {
          const response = await fetch(src, { mode: 'cors' });
          const blob = await response.blob();
          const ext = blob.type.split('/')[1] || 'mp3';
          ankiFilename = `addflashcard_audio_${Date.now()}_${mediaIndex}.${ext}`;
          
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          await this.storeMediaFile(ankiFilename, base64Data);
          const soundTag = document.createElement('span');
          soundTag.textContent = `[sound:${ankiFilename}]`;
          audio.replaceWith(soundTag);
          mediaIndex++;
          console.log(`[AnkiConnect] Uploaded audio: ${ankiFilename}`);
        } catch (err) {
          console.error(`[AnkiConnect] Failed to fetch and upload audio:`, err);
        }
      }
    }
    
    return doc.body.innerHTML;
  }

  // Export cards to Anki
  async exportCards(sourceDeck, targetDeck, cards, fieldMapping, options = {}) {
    const {
      modelName = 'AddFlashcard Basic',
      onProgress = null,
      createDeckIfNotExists = true,
      updateDuplicates = false
    } = options;

    // Test connection first
    const connected = await this.testConnection();
    if (!connected) {
      throw new Error('Cannot connect to AnkiConnect. Please ensure Anki is running and AnkiConnect add-on is installed.');
    }

    // Create target deck if needed
    if (createDeckIfNotExists) {
      await this.createDeck(targetDeck);
    }

    // Check if model exists, create if not
    const models = await this.getModelNames();
    if (!models.includes(modelName)) {
      // Create basic model with Front and Back fields
      await this.createModel(
        modelName,
        ['Front', 'Back'],
        [{
          Name: 'Card 1',
          Front: '{{Front}}',
          Back: '{{FrontSide}}<hr id=answer>{{Back}}'
        }]
      );
    }

    // Prepare notes
    const notes = cards.map(card => {
      const fields = {};
      
      // Map fields based on fieldMapping
      Object.keys(fieldMapping).forEach(targetField => {
        const sourceField = fieldMapping[targetField];
        fields[targetField] = this.cleanHtml(card[sourceField] || '');
      });

      return {
        deckName: targetDeck,
        modelName,
        fields,
        tags: [sourceDeck.replace(/\s+/g, '_')],
        options: {
          allowDuplicate: updateDuplicates,  // Allow duplicates if we're updating
          duplicateScope: 'deck'
        }
      };
    });

    // Extract and upload media for each note
    console.log('[AnkiConnect] Extracting and uploading media...');
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      // Upload media and update Back field
      if (note.fields['Back']) {
        note.fields['Back'] = await this.extractAndUploadMedia(note.fields['Back']);
      }
      // Also process Front if it has media
      if (note.fields['Front']) {
        note.fields['Front'] = await this.extractAndUploadMedia(note.fields['Front']);
      }
    }
    console.log('[AnkiConnect] Media upload complete');

    // Add notes in batches or update if duplicates
    const batchSize = 25;
    let addedNotes = [];
    let updatedNotes = [];
    let skippedNotes = [];
    
    if (updateDuplicates) {
      // Try to add all notes, handle duplicates by updating
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        
        for (const note of batch) {
          try {
            const noteId = await this.addNoteSafe(note);
            if (noteId) {
              addedNotes.push(noteId);
            } else {
              // Duplicate found - try to update instead
              const updatedId = await this.updateNoteBySimilarity(note, fieldMapping);
              if (updatedId) {
                updatedNotes.push(updatedId);
              } else {
                skippedNotes.push(note);
              }
            }
          } catch (err) {
            console.error('[AnkiConnect] Error processing note:', err);
            skippedNotes.push(note);
          }
        }

        if (onProgress) {
          onProgress(Math.min((i + batchSize) / notes.length, 1));
        }
      }
    } else {
      // Original behavior: just add notes, fail on duplicates
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        const results = await this.addNotes(batch);
        const successes = results.filter(id => id !== null);
        const failures = results.filter(id => id === null);
        
        addedNotes.push(...successes);
        skippedNotes.push(...failures);

        if (onProgress) {
          onProgress(Math.min((i + batchSize) / notes.length, 1));
        }
      }
    }

    return {
      total: cards.length,
      success: addedNotes.length,
      updated: updatedNotes.length,
      failed: skippedNotes.length,
      noteIds: addedNotes,
      updatedIds: updatedNotes
    };
  }

  // Add note safely (doesn't throw error on duplicate)
  async addNoteSafe(note) {
    try {
      const result = await this.invoke('addNote', { note });
      return result;
    } catch (err) {
      // Check if it's a duplicate error
      if (err.message && err.message.includes('duplicate')) {
        return null;  // Signal duplicate
      }
      throw err;
    }
  }

  // Update note by finding similar (same Front field)
  async updateNoteBySimilarity(note, fieldMapping) {
    try {
      // Find notes with similar Front field
      const frontField = note.fields['Front'];
      if (!frontField) return null;

      // Search for notes with this front
      const query = `"${frontField}"`;
      const foundNoteIds = await this.findNotes(query);
      
      if (foundNoteIds && foundNoteIds.length > 0) {
        // Found a matching note, update it
        const noteId = foundNoteIds[0];
        await this.updateNoteFields(noteId, note.fields);
        console.log(`[AnkiConnect] Updated note ${noteId} with new back content`);
        return noteId;
      }
      
      return null;
    } catch (err) {
      console.error('[AnkiConnect] Failed to update note by similarity:', err);
      return null;
    }
  }

  // Clean HTML - remove dangerous scripts but preserve formatting
  cleanHtml(html) {
    if (!html) return '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove script and style tags
    doc.querySelectorAll('script, style').forEach(el => el.remove());
    
    // Keep img tags but ensure proper src
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        // If it's a relative or data URL, keep it
        if (!src.startsWith('data:')) {
          // Try to make it absolute
          try {
            img.setAttribute('src', new URL(src, 'https://notion.so').href);
          } catch (e) {
            // Keep original if URL parsing fails
          }
        }
      }
    });
    
    // Get clean HTML preserving all formatting
    const result = doc.body.innerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .trim();
    
    return result;
  }
}

// Export singleton instance
window.ankiConnectClient = new AnkiConnectClient();
