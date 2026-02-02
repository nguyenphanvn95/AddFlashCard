// APKG Exporter Module v2 - With Media Support
// Exports flashcards to Anki .apkg format with images, audio, video

class APKGExporterV2 {
  constructor() {
    this.sqlReady = false;
    this.SQL_INSTANCE = null;
  }

  // Load required libraries
  async loadLibraries() {
    // MV3 extensions cannot load scripts from remote CDNs (CSP blocks them).
    // JSZip is bundled locally.
    if (!window.JSZip) {
      await this.loadScript(chrome.runtime.getURL('vendor/jszip.min.js'));
    }

    // NOTE: sql.js (sqlite in wasm) is required to build a valid .apkg.
    // If you want browser-side APKG export, you must bundle sql.js + sql-wasm.wasm locally.
    // This build disables CDN loading and provides a clear error.
    if (!window.initSqlJs) {
      throw new Error(
        'APKG export needs sql.js (SQLite WASM) bundled locally. ' +
        'Remote CDN loading is blocked by MV3 CSP. ' +
        'Please bundle sql-wasm.js + sql-wasm.wasm in /vendor and update apkg-exporter.js locateFile.'
      );
    }

    await this.ensureSqlReady();
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async ensureSqlReady() {
    if (this.sqlReady && this.SQL_INSTANCE) return;
    
    if (typeof initSqlJs === 'undefined') {
      throw new Error('sql.js not loaded');
    }
    
    this.SQL_INSTANCE = await initSqlJs({
      locateFile: file => chrome.runtime.getURL(`vendor/${file}`)
    });
    this.sqlReady = true;
  }

  sha1ish(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .trim();
  }

  // Extract and process media from HTML
  extractMedia(html) {
    if (!html) return { media: [], html: '' };
    
    const media = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const timestamp = Date.now();
    
    // Extract images
    const images = doc.querySelectorAll('img');
    images.forEach((img, idx) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:')) {
        const matches = src.match(/^data:(.+?);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const ext = mimeType.split('/')[1].split('+')[0] || 'png';
          const filename = `img_${timestamp}_${idx}.${ext}`;
          
          media.push({
            filename,
            data: this.base64ToBlob(base64Data, mimeType),
            type: 'image'
          });
          
          img.setAttribute('src', filename);
        }
      }
    });
    
    // Extract audio
    const audios = doc.querySelectorAll('audio');
    audios.forEach((audio, idx) => {
      const src = audio.getAttribute('src') || audio.querySelector('source')?.getAttribute('src');
      if (src && src.startsWith('data:')) {
        const matches = src.match(/^data:(.+?);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const ext = mimeType.split('/')[1] || 'mp3';
          const filename = `audio_${timestamp}_${idx}.${ext}`;
          
          media.push({
            filename,
            data: this.base64ToBlob(base64Data, mimeType),
            type: 'audio'
          });
          
          // Replace with [sound:filename] tag for Anki
          const soundTag = document.createElement('span');
          soundTag.textContent = `[sound:${filename}]`;
          audio.replaceWith(soundTag);
        }
      }
    });
    
    // Extract video
    const videos = doc.querySelectorAll('video');
    videos.forEach((video, idx) => {
      const src = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src');
      if (src && src.startsWith('data:')) {
        const matches = src.match(/^data:(.+?);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const ext = mimeType.split('/')[1] || 'mp4';
          const filename = `video_${timestamp}_${idx}.${ext}`;
          
          media.push({
            filename,
            data: this.base64ToBlob(base64Data, mimeType),
            type: 'video'
          });
          
          // Keep video tag but update src
          video.setAttribute('src', filename);
          video.setAttribute('controls', 'controls');
        }
      }
    });
    
    return {
      media,
      html: doc.body.innerHTML
    };
  }

  base64ToBlob(base64, mimeType) {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('Failed to convert base64 to blob:', error);
      return null;
    }
  }

  buildFieldObjects(fieldNames) {
    return fieldNames.map((name, idx) => ({
      name,
      ord: idx,
      sticky: false,
      rtl: false,
      font: "Arial",
      size: 20
    }));
  }

  // Export single deck with media support
  async exportDeckWithMedia(deckName, cards, options = {}) {
    const {
      parentDeckName = 'AddFlashcard Export',
      noteTypeName = 'AddFlashcard Basic',
      onProgress = null
    } = options;

    await this.loadLibraries();

    if (cards.length === 0) {
      throw new Error('No cards to export');
    }

    const allMedia = [];
    const mediaManifest = {};
    let mediaIndex = 0;

    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);
    const modelId = nowMs;
    const deckId = nowMs + 1;

    const SQL = this.SQL_INSTANCE;
    const db = new SQL.Database();

    // Create tables
    db.run(`CREATE TABLE col (id INTEGER PRIMARY KEY, crt INTEGER NOT NULL, mod INTEGER NOT NULL, scm INTEGER NOT NULL, ver INTEGER NOT NULL, dty INTEGER NOT NULL, usn INTEGER NOT NULL, ls INTEGER NOT NULL, conf TEXT NOT NULL, models TEXT NOT NULL, decks TEXT NOT NULL, dconf TEXT NOT NULL, tags TEXT NOT NULL);`);
    db.run(`CREATE TABLE notes (id INTEGER PRIMARY KEY, guid TEXT NOT NULL, mid INTEGER NOT NULL, mod INTEGER NOT NULL, usn INTEGER NOT NULL, tags TEXT NOT NULL, flds TEXT NOT NULL, sfld TEXT NOT NULL, csum INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL);`);
    db.run(`CREATE TABLE cards (id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL, ord INTEGER NOT NULL, mod INTEGER NOT NULL, usn INTEGER NOT NULL, type INTEGER NOT NULL, queue INTEGER NOT NULL, due INTEGER NOT NULL, ivl INTEGER NOT NULL, factor INTEGER NOT NULL, reps INTEGER NOT NULL, lapses INTEGER NOT NULL, left INTEGER NOT NULL, odue INTEGER NOT NULL, odid INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL);`);
    db.run(`CREATE TABLE revlog (id INTEGER PRIMARY KEY, cid INTEGER NOT NULL, usn INTEGER NOT NULL, ease INTEGER NOT NULL, ivl INTEGER NOT NULL, lastIvl INTEGER NOT NULL, factor INTEGER NOT NULL, time INTEGER NOT NULL, type INTEGER NOT NULL);`);
    db.run(`CREATE TABLE graves (usn INTEGER NOT NULL, oid INTEGER NOT NULL, type INTEGER NOT NULL);`);

    // Define model
    const fieldNames = ["Front", "Back"];
    const tmpls = [{
      name: "Card 1",
      ord: 0,
      qfmt: "{{Front}}",
      afmt: "{{FrontSide}}<hr id=answer>{{Back}}",
      bqfmt: "",
      bafmt: "",
      did: null,
      bfont: "",
      bsize: 0,
      id: 0
    }];

    const models = {};
    models[modelId] = {
      id: modelId,
      name: noteTypeName,
      type: 0,
      mod: nowSec,
      usn: -1,
      sortf: 0,
      did: deckId,
      tmpls,
      flds: this.buildFieldObjects(fieldNames),
      css: `.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}
img { max-width: 100%; height: auto; }
video { max-width: 100%; height: auto; }`,
      latexPre: "",
      latexPost: "",
      latexsvg: false,
      req: [[0, "all", [0]]]
    };

    // Create deck
    const fullDeckName = `${parentDeckName}::${deckName}`;
    const decks = {
      "1": {
        id: 1,
        mod: 0,
        name: "Default",
        usn: 0,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: true,
        browserCollapsed: true,
        desc: "",
        dyn: 0,
        conf: 1,
        extendNew: 0,
        extendRev: 0
      }
    };
    decks[String(deckId)] = {
      id: deckId,
      mod: nowSec,
      name: fullDeckName,
      usn: -1,
      lrnToday: [0, 0],
      revToday: [0, 0],
      newToday: [0, 0],
      timeToday: [0, 0],
      collapsed: false,
      browserCollapsed: false,
      desc: "",
      dyn: 0,
      conf: 1,
      extendNew: 0,
      extendRev: 0
    };

    const conf = {
      schedVer: 2,
      sched2021: true,
      addToCur: true,
      sortBackwards: false,
      dueCounts: true,
      collapseTime: 1200,
      estTimes: true,
      nextPos: 1,
      sortType: "noteFld",
      activeDecks: [deckId],
      newSpread: 0,
      timeLim: 0,
      curDeck: deckId,
      curModel: modelId,
      dayLearnFirst: false,
      creationOffset: -420
    };

    const dconf = {
      1: {
        id: 1,
        mod: 0,
        name: "Default",
        usn: 0,
        maxTaken: 60,
        autoplay: true,
        timer: 0,
        replayq: true,
        new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 0], order: 1, perDay: 20 },
        rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
        lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 }
      }
    };

    db.run(`INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      1, nowSec, nowSec, nowSec, 11, 0, 0, 0,
      JSON.stringify(conf),
      JSON.stringify(models),
      JSON.stringify(decks),
      JSON.stringify(dconf),
      "{}"
    ]);

    // Process cards and extract media
    const tmplCount = tmpls.length;
    
    for (let idx = 0; idx < cards.length; idx++) {
      const card = cards[idx];
      
      if (onProgress) {
        onProgress((idx + 1) / cards.length);
      }

      // Extract media from both sides
      let frontHtml = this.cleanHtml(card.front);
      let backHtml = this.cleanHtml(card.back);
      
      const frontResult = this.extractMedia(frontHtml);
      const backResult = this.extractMedia(backHtml);
      
      // Collect all media
      [...frontResult.media, ...backResult.media].forEach(media => {
        if (media.data) {
          mediaManifest[mediaIndex] = media.filename;
          allMedia.push(media);
          mediaIndex++;
        }
      });
      
      const noteId = nowMs + 1000 + idx;
      const fields = [frontResult.html, backResult.html];
      const sfld = frontResult.html || '';
      const csum = this.sha1ish(sfld);
      const guid = 'g' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

      // Add tags if present
      const tags = card.tags ? card.tags.join(' ') : '';

      db.run(`INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
        noteId, guid, modelId, nowSec, -1, tags,
        fields.join('\u001f'), sfld, csum, 0, "{}"
      ]);

      for (let ord = 0; ord < tmplCount; ord++) {
        const cardId = nowMs + 500000 + (idx * tmplCount) + ord;
        const due = (idx * tmplCount) + ord + 1;
        db.run(`INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
          cardId, noteId, deckId, ord, nowSec, -1,
          0, 0, due,
          0, 0, 0, 0, 0, 0, 0, "{}"
        ]);
      }
    }

    // Create ZIP with database and media
    const data = db.export();
    const zip = new JSZip();
    zip.file("collection.anki2", data);
    
    // Add all media files
    allMedia.forEach(media => {
      if (media.data) {
        zip.file(media.filename, media.data);
      }
    });
    
    zip.file("media", JSON.stringify(mediaManifest));

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    return blob;
  }

  // Export multiple decks with media
  async exportMultipleDecksWithMedia(decksData, parentDeckName = 'AddFlashcard Export', onProgress = null) {
    // Similar to exportDeckWithMedia but handles multiple decks
    // Implementation follows same pattern as exportMultipleDecks in original
    // but with media extraction added
    
    await this.loadLibraries();

    const totalCards = decksData.reduce((sum, deck) => sum + deck.cards.length, 0);
    if (totalCards === 0) {
      throw new Error('No cards to export');
    }

    const allMedia = [];
    const mediaManifest = {};
    let mediaIndex = 0;
    let processedCards = 0;

    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);
    const modelId = nowMs;

    const SQL = this.SQL_INSTANCE;
    const db = new SQL.Database();

    // [Table creation code - same as single deck]
    db.run(`CREATE TABLE col (id INTEGER PRIMARY KEY, crt INTEGER NOT NULL, mod INTEGER NOT NULL, scm INTEGER NOT NULL, ver INTEGER NOT NULL, dty INTEGER NOT NULL, usn INTEGER NOT NULL, ls INTEGER NOT NULL, conf TEXT NOT NULL, models TEXT NOT NULL, decks TEXT NOT NULL, dconf TEXT NOT NULL, tags TEXT NOT NULL);`);
    db.run(`CREATE TABLE notes (id INTEGER PRIMARY KEY, guid TEXT NOT NULL, mid INTEGER NOT NULL, mod INTEGER NOT NULL, usn INTEGER NOT NULL, tags TEXT NOT NULL, flds TEXT NOT NULL, sfld TEXT NOT NULL, csum INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL);`);
    db.run(`CREATE TABLE cards (id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL, ord INTEGER NOT NULL, mod INTEGER NOT NULL, usn INTEGER NOT NULL, type INTEGER NOT NULL, queue INTEGER NOT NULL, due INTEGER NOT NULL, ivl INTEGER NOT NULL, factor INTEGER NOT NULL, reps INTEGER NOT NULL, lapses INTEGER NOT NULL, left INTEGER NOT NULL, odue INTEGER NOT NULL, odid INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL);`);
    db.run(`CREATE TABLE revlog (id INTEGER PRIMARY KEY, cid INTEGER NOT NULL, usn INTEGER NOT NULL, ease INTEGER NOT NULL, ivl INTEGER NOT NULL, lastIvl INTEGER NOT NULL, factor INTEGER NOT NULL, time INTEGER NOT NULL, type INTEGER NOT NULL);`);
    db.run(`CREATE TABLE graves (usn INTEGER NOT NULL, oid INTEGER NOT NULL, type INTEGER NOT NULL);`);

    // Define model
    const fieldNames = ["Front", "Back"];
    const tmpls = [{
      name: "Card 1",
      ord: 0,
      qfmt: "{{Front}}",
      afmt: "{{FrontSide}}<hr id=answer>{{Back}}",
      bqfmt: "",
      bafmt: "",
      did: null,
      bfont: "",
      bsize: 0,
      id: 0
    }];

    const models = {};
    models[modelId] = {
      id: modelId,
      name: "AddFlashcard Basic",
      type: 0,
      mod: nowSec,
      usn: -1,
      sortf: 0,
      did: null,
      tmpls,
      flds: this.buildFieldObjects(fieldNames),
      css: `.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}
img { max-width: 100%; height: auto; }
video { max-width: 100%; height: auto; }`,
      latexPre: "",
      latexPost: "",
      latexsvg: false,
      req: [[0, "all", [0]]]
    };

    // Create decks
    const decks = {
      "1": {
        id: 1,
        mod: 0,
        name: "Default",
        usn: 0,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: true,
        browserCollapsed: true,
        desc: "",
        dyn: 0,
        conf: 1,
        extendNew: 0,
        extendRev: 0
      }
    };

    const deckIds = {};
    decksData.forEach((deckData, idx) => {
      const deckId = nowMs + 100 + idx;
      deckIds[deckData.name] = deckId;
      const fullDeckName = `${parentDeckName}::${deckData.name}`;
      
      decks[String(deckId)] = {
        id: deckId,
        mod: nowSec,
        name: fullDeckName,
        usn: -1,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: false,
        browserCollapsed: false,
        desc: "",
        dyn: 0,
        conf: 1,
        extendNew: 0,
        extendRev: 0
      };
    });

    const conf = {
      schedVer: 2,
      sched2021: true,
      addToCur: true,
      sortBackwards: false,
      dueCounts: true,
      collapseTime: 1200,
      estTimes: true,
      nextPos: 1,
      sortType: "noteFld",
      activeDecks: Object.values(deckIds),
      newSpread: 0,
      timeLim: 0,
      curDeck: Object.values(deckIds)[0] || 1,
      curModel: modelId,
      dayLearnFirst: false,
      creationOffset: -420
    };

    const dconf = {
      1: {
        id: 1,
        mod: 0,
        name: "Default",
        usn: 0,
        maxTaken: 60,
        autoplay: true,
        timer: 0,
        replayq: true,
        new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 0], order: 1, perDay: 20 },
        rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
        lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 }
      }
    };

    db.run(`INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      1, nowSec, nowSec, nowSec, 11, 0, 0, 0,
      JSON.stringify(conf),
      JSON.stringify(models),
      JSON.stringify(decks),
      JSON.stringify(dconf),
      "{}"
    ]);

    // Process all decks
    const tmplCount = tmpls.length;
    let globalCardIndex = 0;

    for (const deckData of decksData) {
      const deckId = deckIds[deckData.name];
      
      for (const card of deckData.cards) {
        processedCards++;
        if (onProgress) {
          onProgress(processedCards / totalCards);
        }

        // Extract media
        let frontHtml = this.cleanHtml(card.front);
        let backHtml = this.cleanHtml(card.back);
        
        const frontResult = this.extractMedia(frontHtml);
        const backResult = this.extractMedia(backHtml);
        
        // Collect media
        [...frontResult.media, ...backResult.media].forEach(media => {
          if (media.data) {
            mediaManifest[mediaIndex] = media.filename;
            allMedia.push(media);
            mediaIndex++;
          }
        });

        const noteId = nowMs + 1000 + globalCardIndex;
        const fields = [frontResult.html, backResult.html];
        const sfld = frontResult.html || '';
        const csum = this.sha1ish(sfld);
        const guid = 'g' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

        const tags = card.tags ? card.tags.join(' ') : '';

        db.run(`INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
          noteId, guid, modelId, nowSec, -1, tags,
          fields.join('\u001f'), sfld, csum, 0, "{}"
        ]);

        for (let ord = 0; ord < tmplCount; ord++) {
          const cardId = nowMs + 500000 + (globalCardIndex * tmplCount) + ord;
          const due = (globalCardIndex * tmplCount) + ord + 1;
          db.run(`INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            cardId, noteId, deckId, ord, nowSec, -1,
            0, 0, due,
            0, 0, 0, 0, 0, 0, 0, "{}"
          ]);
        }

        globalCardIndex++;
      }
    }

    // Create ZIP
    const data = db.export();
    const zip = new JSZip();
    zip.file("collection.anki2", data);
    
    // Add media
    allMedia.forEach(media => {
      if (media.data) {
        zip.file(media.filename, media.data);
      }
    });
    
    zip.file("media", JSON.stringify(mediaManifest));

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    return blob;
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton
window.apkgExporterV2 = new APKGExporterV2();

// Backward-compatible alias used by manage.js
// (Older code expects window.apkgExporter with exportMultipleDecks / downloadBlob)
window.apkgExporter = window.apkgExporterV2;

// Backward-compatible API expected by manage.js
// manage.js calls exportMultipleDecks(decksData, parentDeckName, onProgress)
// In v2 we prefer exportMultipleDecksWithMedia.
if (typeof window.apkgExporterV2.exportMultipleDecks !== 'function') {
  window.apkgExporterV2.exportMultipleDecks = async function (decksData, parentDeckName, onProgress) {
    return await this.exportMultipleDecksWithMedia(decksData, parentDeckName, onProgress);
  };
}
