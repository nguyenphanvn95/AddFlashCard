// ============================================================================
// ANKI EXPORT UNIFIED LIBRARY
// Tạo file .apkg chuẩn cho cả overlay mode và editor.html mode
// Sửa lỗi: "note has 7 fields, expected 6"
// ============================================================================

// ============================================================================
// PHẦN 1: EXPORT CHO EDITOR.HTML (Multiple Cards)
// ============================================================================

/**
 * Xuất Anki từ editor.html với nhiều thẻ (mỗi khối che = 1 thẻ)
 */
async function exportAnkiMultiCard() {
  if (occlusions.length === 0) {
    alert('Vui lòng vẽ ít nhất một khối che mờ!');
    return;
  }

  const cardTitle = document.getElementById('cardTitle').value || 'Anki Card';
  updateStatus('Đang tạo file Anki...');

  try {
    // Ảnh gốc (answer) - tạo 1 lần
    const originalImageBlob = await canvasToBlob(canvas);

    // Tạo nhiều ảnh câu hỏi: mỗi block -> 1 thẻ
    const questionBlobs = [];
    for (let i = 0; i < occlusions.length; i++) {
      questionBlobs.push(await createOccludedImageForIndex(i));
    }

    // Tạo file .apkg (nhiều thẻ)
    await createApkgMultiCard(cardTitle, originalImageBlob, questionBlobs);

    updateStatus('Đã xuất file .apkg thành công!');
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Lỗi khi xuất file: ' + (error && error.message ? error.message : error));
    updateStatus('Lỗi khi xuất file.');
  }
}

/**
 * Tạo ảnh có khối che mờ cho 1 block (theo index)
 */
async function createOccludedImageForIndex(index) {
  const occ = occlusions[index];
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Vẽ ảnh gốc
  tempCtx.drawImage(img, 0, 0);

  // Chỉ vẽ 1 khối che cho thẻ này
  tempCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';

  if (occ.type === 'rect') {
    tempCtx.fillRect(occ.x, occ.y, occ.width, occ.height);
  } else if (occ.type === 'ellipse') {
    tempCtx.beginPath();
    tempCtx.ellipse(
      occ.x + occ.width / 2,
      occ.y + occ.height / 2,
      Math.abs(occ.width / 2),
      Math.abs(occ.height / 2),
      0, 0, 2 * Math.PI
    );
    tempCtx.fill();
  }

  return await canvasToBlob(tempCanvas);
}

// ============================================================================
// PHẦN 2: EXPORT CHO OVERLAY MODE (Single Card)
// ============================================================================

/**
 * Xuất Anki từ overlay mode với 1 thẻ (tất cả khối che trên cùng 1 thẻ)
 */
async function exportAnkiSingleCard(overlayCanvas, overlayImg, overlayOcclusions, cardTitle) {
  if (overlayOcclusions.length === 0) {
    throw new Error('Vui lòng vẽ ít nhất một khối che mờ!');
  }

  // Tạo ảnh gốc (không có khối che)
  const originalBlob = await createOriginalImageFromOverlay(overlayCanvas, overlayImg);

  // Tạo ảnh có tất cả khối che
  const occludedBlob = await createOccludedImageFromOverlay(
    overlayCanvas,
    overlayImg,
    overlayOcclusions
  );

  // Tạo file .apkg (1 thẻ)
  await createApkgSingleCard(cardTitle, originalBlob, occludedBlob);
}

/**
 * Tạo ảnh gốc từ overlay (không có khối che)
 */
async function createOriginalImageFromOverlay(overlayCanvas, overlayImg) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = overlayCanvas.width;
  tempCanvas.height = overlayCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.drawImage(overlayImg, 0, 0);
  
  return await canvasToBlob(tempCanvas);
}

/**
 * Tạo ảnh có tất cả khối che từ overlay
 */
async function createOccludedImageFromOverlay(overlayCanvas, overlayImg, overlayOcclusions) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = overlayCanvas.width;
  tempCanvas.height = overlayCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.drawImage(overlayImg, 0, 0);

  overlayOcclusions.forEach(occ => {
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';

    if (occ.type === 'rect') {
      tempCtx.fillRect(occ.x, occ.y, occ.width, occ.height);
    } else if (occ.type === 'ellipse') {
      tempCtx.beginPath();
      tempCtx.ellipse(
        occ.x + occ.width / 2,
        occ.y + occ.height / 2,
        Math.abs(occ.width / 2),
        Math.abs(occ.height / 2),
        0, 0, 2 * Math.PI
      );
      tempCtx.fill();
    }
  });

  return await canvasToBlob(tempCanvas);
}

// ============================================================================
// PHẦN 3: TẠO FILE .APKG
// ============================================================================

/**
 * Tạo file .apkg với nhiều thẻ (editor.html mode)
 */
async function createApkgMultiCard(cardTitle, answerImage, questionImages) {
  if (typeof JSZip === 'undefined') {
    alert('Vui lòng thêm thư viện JSZip vào extension!\nXem hướng dẫn trong file README.md');
    return;
  }

  if (!Array.isArray(questionImages) || questionImages.length === 0) {
    throw new Error('Không có ảnh câu hỏi để export.');
  }

  const zip = new JSZip();
  const ts = Date.now();

  // Tên file media
  const answerImageName = `anki_img_${ts}_answer.png`;
  const questionImageNames = questionImages.map((_, idx) => `anki_img_${ts}_q_${idx + 1}.png`);

  // Tạo collection database
  const collectionData = await createAnkiCollectionMultiCard({
    cardTitle,
    deckName: 'Anki Image Occlusion',
    modelName: 'Image Occlusion',
    questionImageNames,
    answerImageName,
  });

  zip.file('collection.anki2', collectionData);

  // Thêm media files
  const mediaFiles = {};
  let mediaIndex = 0;

  // Answer image (index 0)
  mediaFiles[String(mediaIndex)] = answerImageName;
  zip.file(answerImageName, answerImage);
  mediaIndex++;

  // Question images (index 1, 2, 3, ...)
  for (let i = 0; i < questionImages.length; i++) {
    const qName = questionImageNames[i];
    mediaFiles[String(mediaIndex)] = qName;
    zip.file(qName, questionImages[i]);
    mediaIndex++;
  }

  zip.file('media', JSON.stringify(mediaFiles));

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  downloadBlob(content, sanitizeFilename(cardTitle) + '.apkg');
}

/**
 * Tạo file .apkg với 1 thẻ (overlay mode)
 */
async function createApkgSingleCard(cardTitle, answerImage, questionImage) {
  if (typeof JSZip === 'undefined') {
    // Load JSZip dynamically cho overlay mode
    await loadJSZipDynamic();
  }

  const zip = new JSZip();
  const ts = Date.now();

  // Tên file media
  const answerImageName = `anki_img_${ts}_answer.png`;
  const questionImageName = `anki_img_${ts}_question.png`;

  // Tạo collection database
  const collectionData = await createAnkiCollectionSingleCard({
    cardTitle,
    deckName: 'Anki Image Occlusion',
    modelName: 'Image Occlusion',
    questionImageName,
    answerImageName,
  });

  zip.file('collection.anki2', collectionData);

  // Thêm media files
  const mediaFiles = {
    '0': answerImageName,
    '1': questionImageName
  };

  zip.file(answerImageName, answerImage);
  zip.file(questionImageName, questionImage);
  zip.file('media', JSON.stringify(mediaFiles));

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  downloadBlob(content, sanitizeFilename(cardTitle) + '.apkg');
}

// ============================================================================
// PHẦN 4: TẠO ANKI COLLECTION DATABASE (SQLite)
// ============================================================================

/**
 * Tạo Anki collection cho nhiều thẻ (editor.html)
 */
async function createAnkiCollectionMultiCard(opts) {
  const SQL = await initializeSqlJs();
  const db = new SQL.Database();
  const timestamp = Math.floor(Date.now() / 1000);
  const timestampMs = timestamp * 1000;

  const deckId = timestampMs;
  const modelId = timestampMs + 1;

  // Tạo các bảng cần thiết
  createAnkiTables(db);

  // Tạo model với 6 fields (FIX LỖI 7 FIELDS!)
  const models = createAnkiModel(modelId, deckId, timestamp, opts.modelName);

  // Tạo deck
  const decks = createAnkiDeck(deckId, timestamp, opts.deckName);

  // Tạo deck config
  const dconf = createAnkiDeckConfig(timestamp);

  // Tạo collection config
  const colConfig = createAnkiCollectionConfig(deckId, modelId, timestamp);

  // Insert vào bảng col
  db.run(
    `INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')`,
    [
      timestamp,
      timestamp,
      timestamp,
      JSON.stringify(colConfig),
      JSON.stringify(models),
      JSON.stringify(decks),
      JSON.stringify(dconf)
    ]
  );

  // Tạo notes và cards
  const questionImageNames = opts.questionImageNames || [];
  let nextNoteId = timestampMs + 10;
  let nextCardId = nextNoteId + 1;

  for (let i = 0; i < questionImageNames.length; i++) {
    const noteId = nextNoteId;

    // Media indices: 0 = answer, 1,2,3... = questions
    const answerMediaIndex = 0;
    const questionMediaIndex = i + 1;

    // Tạo 6 fields (FIX LỖI 7 FIELDS!)
    // Fields: Question, Answer, Header, Footer, Remarks, Extra
    const fQ = `<img src="${questionMediaIndex}">`;
    const fA = `<img src="${answerMediaIndex}">`;
    
    // 6 fields được ngăn cách bởi 5 dấu \x1f
    const fields = `${fQ}\x1f${fA}\x1f\x1f\x1f\x1f`;

    db.run(
      `INSERT INTO notes VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '')`,
      [noteId, generateGuid(), modelId, timestamp, fields, opts.cardTitle]
    );

    const cardId = nextCardId;
    const due = i + 1;
    db.run(
      `INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
      [cardId, noteId, deckId, timestamp, due]
    );

    nextNoteId += 2;
    nextCardId += 2;
  }

  const data = db.export();
  db.close();
  return new Blob([data], { type: 'application/x-sqlite3' });
}

/**
 * Tạo Anki collection cho 1 thẻ (overlay mode)
 */
async function createAnkiCollectionSingleCard(opts) {
  const SQL = await initializeSqlJs();
  const db = new SQL.Database();
  const timestamp = Math.floor(Date.now() / 1000);
  const timestampMs = timestamp * 1000;

  const deckId = timestampMs;
  const modelId = timestampMs + 1;

  // Tạo các bảng cần thiết
  createAnkiTables(db);

  // Tạo model
  const models = createAnkiModel(modelId, deckId, timestamp, opts.modelName);

  // Tạo deck
  const decks = createAnkiDeck(deckId, timestamp, opts.deckName);

  // Tạo deck config
  const dconf = createAnkiDeckConfig(timestamp);

  // Tạo collection config
  const colConfig = createAnkiCollectionConfig(deckId, modelId, timestamp);

  // Insert vào bảng col
  db.run(
    `INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')`,
    [
      timestamp,
      timestamp,
      timestamp,
      JSON.stringify(colConfig),
      JSON.stringify(models),
      JSON.stringify(decks),
      JSON.stringify(dconf)
    ]
  );

  // Tạo 1 note và 1 card
  const noteId = timestampMs + 10;
  const cardId = noteId + 1;

  // Media indices: 0 = answer, 1 = question
  const answerMediaIndex = 0;
  const questionMediaIndex = 1;

  // Tạo 6 fields
  const fQ = `<img src="${questionMediaIndex}">`;
  const fA = `<img src="${answerMediaIndex}">`;
  const fields = `${fQ}\x1f${fA}\x1f\x1f\x1f\x1f`;

  db.run(
    `INSERT INTO notes VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '')`,
    [noteId, generateGuid(), modelId, timestamp, fields, opts.cardTitle]
  );

  db.run(
    `INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
    [cardId, noteId, deckId, timestamp]
  );

  const data = db.export();
  db.close();
  return new Blob([data], { type: 'application/x-sqlite3' });
}

// ============================================================================
// PHẦN 5: HELPER FUNCTIONS CHO DATABASE
// ============================================================================

/**
 * Tạo các bảng Anki
 */
function createAnkiTables(db) {
  // Bảng col
  db.run(`CREATE TABLE col (
    id INTEGER PRIMARY KEY,
    crt INTEGER NOT NULL,
    mod INTEGER NOT NULL,
    scm INTEGER NOT NULL,
    ver INTEGER NOT NULL,
    dty INTEGER NOT NULL,
    usn INTEGER NOT NULL,
    ls INTEGER NOT NULL,
    conf TEXT NOT NULL,
    models TEXT NOT NULL,
    decks TEXT NOT NULL,
    dconf TEXT NOT NULL,
    tags TEXT NOT NULL
  )`);

  // Bảng notes
  db.run(`CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    guid TEXT NOT NULL,
    mid INTEGER NOT NULL,
    mod INTEGER NOT NULL,
    usn INTEGER NOT NULL,
    tags TEXT NOT NULL,
    flds TEXT NOT NULL,
    sfld TEXT NOT NULL,
    csum INTEGER NOT NULL,
    flags INTEGER NOT NULL,
    data TEXT NOT NULL
  )`);

  // Bảng cards
  db.run(`CREATE TABLE cards (
    id INTEGER PRIMARY KEY,
    nid INTEGER NOT NULL,
    did INTEGER NOT NULL,
    ord INTEGER NOT NULL,
    mod INTEGER NOT NULL,
    usn INTEGER NOT NULL,
    type INTEGER NOT NULL,
    queue INTEGER NOT NULL,
    due INTEGER NOT NULL,
    ivl INTEGER NOT NULL,
    factor INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    lapses INTEGER NOT NULL,
    left INTEGER NOT NULL,
    odue INTEGER NOT NULL,
    odid INTEGER NOT NULL,
    flags INTEGER NOT NULL,
    data TEXT NOT NULL
  )`);

  // Bảng revlog
  db.run(`CREATE TABLE revlog (
    id INTEGER PRIMARY KEY,
    cid INTEGER NOT NULL,
    usn INTEGER NOT NULL,
    ease INTEGER NOT NULL,
    ivl INTEGER NOT NULL,
    lastIvl INTEGER NOT NULL,
    factor INTEGER NOT NULL,
    time INTEGER NOT NULL,
    type INTEGER NOT NULL
  )`);

  // Bảng graves
  db.run(`CREATE TABLE graves (
    usn INTEGER NOT NULL,
    oid INTEGER NOT NULL,
    type INTEGER NOT NULL
  )`);
}

/**
 * Tạo Anki model với 6 fields
 */
function createAnkiModel(modelId, deckId, timestamp, modelName) {
  return {
    [modelId]: {
      id: modelId,
      name: modelName || "Image Occlusion",
      type: 0,
      mod: timestamp,
      usn: -1,
      sortf: 0,
      did: deckId,
      latexPre: "\\documentclass[12pt]{article}\\usepackage[utf-8]{inputenc}\\usepackage{amssymb}\\begin{document}",
      latexPost: "\\end{document}",
      latexsvg: false,
      flds: [
        { name: "Question", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Answer", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Header", ord: 2, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Footer", ord: 3, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Remarks", ord: 4, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Extra", ord: 5, sticky: true, rtl: false, font: "Arial", size: 16, media: [] }
      ],
      tmpls: [{
        name: "Card 1",
        ord: 0,
        qfmt: "{{Header}}<br>{{Question}}",
        afmt: "{{FrontSide}}<hr id=answer>{{Answer}}<br>{{Footer}}<br>{{Remarks}}",
        bqfmt: "",
        bafmt: "",
        did: null
      }],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; } img { max-width: 100%; height: auto; }",
      csum: 0,
      vers: []
    }
  };
}

/**
 * Tạo Anki deck
 */
function createAnkiDeck(deckId, timestamp, deckName) {
  return {
    [deckId]: {
      newToday: [0, 0],
      revToday: [0, 0],
      lrnToday: [0, 0],
      timeToday: [0, 0],
      conf: 1,
      usn: 0,
      desc: "",
      dyn: 0,
      collapsed: false,
      extendNew: 10,
      extendRev: 50,
      id: deckId,
      name: deckName || "Anki Image Occlusion"
    }
  };
}

/**
 * Tạo Anki deck config
 */
function createAnkiDeckConfig(timestamp) {
  return {
    1: {
      id: 1,
      mod: timestamp,
      name: "Default",
      usn: -1,
      maxTaken: 60,
      autoplay: true,
      timer: 0,
      replayq: true,
      new: {
        delays: [1.0, 10.0],
        ints: [1, 4, 7],
        initialFactor: 2500,
        separate: true,
        order: 1
      },
      lapse: {
        delays: [10.0],
        mult: 0.5,
        minInt: 1,
        leechFails: 8,
        leechAction: 0
      },
      rev: {
        perDay: 200,
        hardFactor: 1.2,
        ivlFct: 1.0,
        maxIvl: 36500,
        ease4: 1.3,
        bury: true
      },
      ease: 2.5,
      wasLeeched: false,
      resched: true
    }
  };
}

/**
 * Tạo Anki collection config
 */
function createAnkiCollectionConfig(deckId, modelId, timestamp) {
  return {
    activeDecks: [deckId],
    addToCur: true,
    ankiVersion: "2.1.54",
    browserMode: 0,
    curModel: modelId,
    curTab: 0,
    dayLearnFirst: false,
    disableAddons: false,
    dueCounts: true,
    estTimes: true,
    extendNew: 0,
    extendRev: 0,
    hideTags: false,
    lastSave: timestamp,
    lastUnburied: timestamp,
    learnAhead: 1200,
    nextPos: 1,
    preserveSignature: true,
    schedVer: 2,
    spellCheck: true,
    stripWhitespace: true,
    syncMode: 0,
    timezoneOffset: -1,
    curDeck: deckId
  };
}

// ============================================================================
// PHẦN 6: UTILITY FUNCTIONS
// ============================================================================

/**
 * Khởi tạo sql.js
 */
async function initializeSqlJs() {
  if (typeof initSqlJs === 'undefined') {
    console.error('sql.js library not loaded!');
    alert('Lỗi: Thư viện SQL.js chưa được load. Vui lòng reload trang.');
    throw new Error('sql.js not available');
  }

  try {
    const SQL = await initSqlJs({
      locateFile: file => {
        if (file.endsWith('.wasm')) {
          // Cho extension
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            return chrome.runtime.getURL('libs/sql-wasm.wasm');
          }
          // Cho standalone
          return 'libs/sql-wasm.wasm';
        }
        return file;
      }
    });
    return SQL;
  } catch (error) {
    console.error('Error initializing SQL.js:', error);
    throw error;
  }
}

/**
 * Load JSZip dynamically (cho overlay mode)
 */
function loadJSZipDynamic() {
  return new Promise((resolve, reject) => {
    if (typeof JSZip !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Canvas to Blob
 */
function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 0.95);
  });
}

/**
 * Download blob
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

/**
 * Generate GUID
 */
function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
