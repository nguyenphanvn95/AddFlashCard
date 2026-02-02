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

  // Export cards to Anki
  async exportCards(sourceDeck, targetDeck, cards, fieldMapping, options = {}) {
    const {
      modelName = 'AddFlashcard Basic',
      onProgress = null,
      createDeckIfNotExists = true
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
          allowDuplicate: false,
          duplicateScope: 'deck'
        }
      };
    });

    // Add notes in batches
    const batchSize = 25;
    const results = [];
    
    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      const batchResults = await this.addNotes(batch);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(Math.min((i + batchSize) / notes.length, 1));
      }
    }

    // Count successes and failures
    const successes = results.filter(id => id !== null).length;
    const failures = results.filter(id => id === null).length;

    return {
      total: cards.length,
      success: successes,
      failed: failures,
      noteIds: results
    };
  }

  // Clean HTML
  cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();
  }
}

// Export singleton instance
window.ankiConnectClient = new AnkiConnectClient();
