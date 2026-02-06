// ============================================================================
// ANKI EXPORT UNIFIED LIBRARY - FIXED VERSION
// Tạo file .apkg chuẩn theo mẫu Image Occlusion với đúng các fields và masks
// ============================================================================

// ============================================================================
// PHẦN 1: EXPORT CHO EDITOR.HTML (Multiple Cards - Hide 1)
// ============================================================================

/**
 * Xuất Anki từ editor.html với nhiều thẻ (Hide 1: mỗi khối che = 1 thẻ)
 */
async function exportAnkiMultiCard() {
  if (occlusions.length === 0) {
    alert('Vui lòng vẽ ít nhất một khối che mờ!');
    return;
  }

  // ============================================================
  // HIDE MODE SWITCH
  // - Hide 1  : mỗi occlusion = 1 note
  // - Hide All: gộp tất cả occlusion -> 1 note
  // UI hiện tại dùng select id="hideModeSelect" (nếu có).
  // ============================================================
  const hideModeEl = document.getElementById('hideModeSelect');
  const hideMode = (hideModeEl && hideModeEl.value) ? String(hideModeEl.value).toLowerCase() : 'hide1';
  const isHideAll = (hideMode.includes('all') || hideMode === 'hideall' || hideMode === 'hide_all');

  const cardTitle = document.getElementById('cardTitle').value || 'Anki Card';
  updateStatus('Đang tạo file Anki...');

  try {
    // Ảnh gốc (Image field)
    // IMPORTANT: canvas trong editor thường đã bị vẽ các block occlusion/overlay lên.
    // Field Image của note Image Occlusion phải là ảnh gốc (chưa có block).
    // Vì vậy ta render lại từ ảnh nguồn (biến global `img` của editor) nếu có.
    const originalImageBlob = await createOriginalImageFromEditor(canvas);
    // Hide All -> gộp tất cả occlusion thành 1 thẻ
    if (isHideAll) {
      // Question Mask: tất cả các blocks
      const questionMaskBlob = await createOriginalMask();

      // Answer Mask: rỗng (show answer sẽ hiện tất cả)
      const answerMaskBlob = await createEmptyMask(canvas);

      // Original Mask: tất cả các blocks
      const originalMaskBlob = await createOriginalMask();

      await createApkgSingleCard(cardTitle, originalImageBlob, questionMaskBlob, answerMaskBlob, originalMaskBlob);
    } else {
      // Hide 1 -> mỗi occlusion = 1 thẻ
      const cardsData = [];
      for (let i = 0; i < occlusions.length; i++) {
        const questionMaskBlob = await createQuestionMask(i);
        const answerMaskBlob = await createAnswerMask(i);
        const originalMaskBlob = await createOriginalMask();

        cardsData.push({
          questionMask: questionMaskBlob,
          answerMask: answerMaskBlob,
          originalMask: originalMaskBlob
        });
      }

      await createApkgMultiCard(cardTitle, originalImageBlob, cardsData);
    }

    updateStatus('Đã xuất file .apkg thành công!');
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Lỗi khi xuất file: ' + (error && error.message ? error.message : error));
    updateStatus('Lỗi khi xuất file.');
  }
}

/**
 * Tạo ảnh gốc cho editor.html (KHÔNG có khối che)
 *
 * - Ưu tiên render lại từ ảnh nguồn `img` (global trong image-occlusion-editor.js)
 * - Fallback: nếu không truy cập được `img`, dùng chính canvas hiện tại
 */
async function createOriginalImageFromEditor(editorCanvas) {
  try {
    // `img` được khai báo global trong image-occlusion-editor.js
    if (typeof img !== 'undefined' && img && img.naturalWidth && img.naturalHeight) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = editorCanvas.width;
      tempCanvas.height = editorCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Vẽ ảnh gốc theo đúng kích thước canvas editor
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      return await canvasToBlob(tempCanvas);
    }
  } catch (e) {
    console.warn('createOriginalImageFromEditor fallback to editor canvas:', e);
  }

  // Fallback (có thể chứa occlusion nếu editorCanvas đã bị vẽ overlay)
  return await canvasToBlob(editorCanvas);
}

/**
 * Tạo Question Mask: chỉ có block tại index (block đang được hỏi)
 */
async function createQuestionMask(index) {
  const occ = occlusions[index];
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Canvas trong suốt
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Vẽ CHỈ 1 khối che tại vị trí này
  tempCtx.fillStyle = 'rgba(255, 200, 87, 1)'; // Màu vàng cam

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

/**
 * Tạo Answer Mask: các blocks còn lại (KHÔNG có block đang được hỏi)
 */
async function createAnswerMask(currentIndex) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Canvas trong suốt
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Vẽ TẤT CẢ các khối TRỪ khối hiện tại
  tempCtx.fillStyle = 'rgba(255, 200, 87, 1)'; // Màu vàng cam

  for (let i = 0; i < occlusions.length; i++) {
    if (i === currentIndex) continue; // Bỏ qua block hiện tại

    const occ = occlusions[i];
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
  }

  return await canvasToBlob(tempCanvas);
}

/**
 * Tạo Original Mask: TẤT CẢ các blocks
 */
async function createOriginalMask() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Canvas trong suốt
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Vẽ TẤT CẢ các khối
  tempCtx.fillStyle = 'rgba(255, 200, 87, 1)'; // Màu vàng cam

  occlusions.forEach(occ => {
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
// PHẦN 2: EXPORT CHO OVERLAY MODE (Single Card - Hide All)
// ============================================================================

/**
 * Xuất Anki từ overlay mode với 1 thẻ (Hide All: tất cả khối che trên cùng 1 thẻ)
 */
async function exportAnkiSingleCard(overlayCanvas, overlayImg, overlayOcclusions, cardTitle) {
  if (overlayOcclusions.length === 0) {
    throw new Error('Vui lòng vẽ ít nhất một khối che mờ!');
  }

  // Image: ảnh gốc (không có khối che)
  const originalBlob = await createOriginalImageFromOverlay(overlayCanvas, overlayImg);

  // Question Mask: tất cả các blocks (vì Hide All)
  const questionMaskBlob = await createAllMasksFromOverlay(
    overlayCanvas,
    overlayOcclusions
  );

  // Answer Mask: rỗng (vì khi toggle thì hiện tất cả)
  const answerMaskBlob = await createEmptyMask(overlayCanvas);

  // Original Mask: tất cả các blocks (giống Question Mask)
  const originalMaskBlob = await createAllMasksFromOverlay(
    overlayCanvas,
    overlayOcclusions
  );

  // Tạo file .apkg (1 thẻ)
  await createApkgSingleCard(cardTitle, originalBlob, questionMaskBlob, answerMaskBlob, originalMaskBlob);
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
 * Tạo mask với tất cả các blocks
 */
async function createAllMasksFromOverlay(overlayCanvas, overlayOcclusions) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = overlayCanvas.width;
  tempCanvas.height = overlayCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Canvas trong suốt
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Vẽ tất cả các khối
  tempCtx.fillStyle = 'rgba(255, 200, 87, 1)';

  overlayOcclusions.forEach(occ => {
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

/**
 * Tạo mask rỗng (trong suốt hoàn toàn)
 */
async function createEmptyMask(overlayCanvas) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = overlayCanvas.width;
  tempCanvas.height = overlayCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Canvas trong suốt, không vẽ gì
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  return await canvasToBlob(tempCanvas);
}

// ============================================================================
// PHẦN 3: TẠO FILE .APKG
// ============================================================================

/**
 * Tạo file .apkg với nhiều thẻ (editor.html mode - Hide 1)
 */
async function createApkgMultiCard(cardTitle, imageBlob, cardsData) {
  if (typeof JSZip === 'undefined') {
    alert('Vui lòng thêm thư viện JSZip vào extension!\nXem hướng dẫn trong file README.md');
    return;
  }

  if (!Array.isArray(cardsData) || cardsData.length === 0) {
    throw new Error('Không có dữ liệu thẻ để export.');
  }

  const zip = new JSZip();
  const ts = Date.now();

  // Tên file media
  const imageName = `image_${ts}.png`;
  
  // Tạo media manifest và thêm file vào ZIP
  const mediaManifest = {};
  let mediaIndex = 0;

  // Image gốc (chung cho tất cả thẻ)
  mediaManifest[String(mediaIndex)] = imageName;
  zip.file(String(mediaIndex), imageBlob);
  mediaIndex++;

  // Tạo tên file cho từng thẻ
  const cardsMediaInfo = [];
  for (let i = 0; i < cardsData.length; i++) {
    const questionMaskName = `qmask_${ts}_${i}.png`;
    const answerMaskName = `amask_${ts}_${i}.png`;
    const originalMaskName = `omask_${ts}_${i}.png`;

    // Thêm vào manifest và ZIP
    mediaManifest[String(mediaIndex)] = questionMaskName;
    zip.file(String(mediaIndex), cardsData[i].questionMask);
    mediaIndex++;

    mediaManifest[String(mediaIndex)] = answerMaskName;
    zip.file(String(mediaIndex), cardsData[i].answerMask);
    mediaIndex++;

    mediaManifest[String(mediaIndex)] = originalMaskName;
    zip.file(String(mediaIndex), cardsData[i].originalMask);
    mediaIndex++;

    cardsMediaInfo.push({
      image: imageName,
      questionMask: questionMaskName,
      answerMask: answerMaskName,
      originalMask: originalMaskName
    });
  }

  // Tạo collection database
  const collectionData = await createAnkiCollectionMultiCard({
    cardTitle,
    deckName: 'Anki Image Occlusion',
    modelName: 'Image Occlusion',
    cardsMediaInfo
  });

  zip.file('collection.anki2', collectionData);
  zip.file('media', JSON.stringify(mediaManifest));

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  downloadBlob(content, sanitizeFilename(cardTitle) + '.apkg');
}

/**
 * Tạo file .apkg với 1 thẻ (overlay mode - Hide All)
 */
async function createApkgSingleCard(cardTitle, imageBlob, questionMaskBlob, answerMaskBlob, originalMaskBlob) {
  if (typeof JSZip === 'undefined') {
    await loadJSZipDynamic();
  }

  const zip = new JSZip();
  const ts = Date.now();

  // Tên file media
  const imageName = `image_${ts}.png`;
  const questionMaskName = `qmask_${ts}.png`;
  const answerMaskName = `amask_${ts}.png`;
  const originalMaskName = `omask_${ts}.png`;

  // Tạo media manifest
  const mediaManifest = {
    '0': imageName,
    '1': questionMaskName,
    '2': answerMaskName,
    '3': originalMaskName
  };

  zip.file('0', imageBlob);
  zip.file('1', questionMaskBlob);
  zip.file('2', answerMaskBlob);
  zip.file('3', originalMaskBlob);

  // Tạo collection database
  const collectionData = await createAnkiCollectionSingleCard({
    cardTitle,
    deckName: 'Anki Image Occlusion',
    modelName: 'Image Occlusion',
    image: imageName,
    questionMask: questionMaskName,
    answerMask: answerMaskName,
    originalMask: originalMaskName
  });

  zip.file('collection.anki2', collectionData);
  zip.file('media', JSON.stringify(mediaManifest));

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

  // Tạo model với đúng fields theo mẫu
  const templates = await getImageOcclusionTemplates();
  const models = createImageOcclusionModel(modelId, deckId, timestamp, opts.modelName, templates);

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

  // Tạo notes và cards cho từng thẻ
  const cardsMediaInfo = opts.cardsMediaInfo || [];
  let nextNoteId = timestampMs + 10;
  let nextCardId = nextNoteId + 1;

  for (let i = 0; i < cardsMediaInfo.length; i++) {
    const noteId = nextNoteId;
    const info = cardsMediaInfo[i];

    // Tạo ID ngẫu nhiên theo ngày
    const cardId = generateCardId();

    // 9 fields: ID, Image, Question Mask, Answer Mask, Original Mask, Header, Footer, Remarks, Sources, Extra 1, Extra 2
    const fields = [
      cardId,                                    // ID
      `<img src="${info.image}">`,              // Image
      `<img src="${info.questionMask}">`,       // Question Mask
      `<img src="${info.answerMask}">`,         // Answer Mask
      `<img src="${info.originalMask}">`,       // Original Mask
      '',                                        // Header
      '',                                        // Footer
      '',                                        // Remarks
      '',                                        // Sources
      '',                                        // Extra 1
      ''                                         // Extra 2
    ].join('\x1f');

    // Sort field
    const sortField = `${opts.cardTitle || ''} - Card ${i + 1}`;

    db.run(
      `INSERT INTO notes VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '')`,
      [noteId, generateGuid(), modelId, timestamp, fields, sortField]
    );

    const cardIdNum = nextCardId;
    const due = i + 1;
    db.run(
      `INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
      [cardIdNum, noteId, deckId, timestamp, due]
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
  const templates = await getImageOcclusionTemplates();
  const models = createImageOcclusionModel(modelId, deckId, timestamp, opts.modelName, templates);

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
  const cardIdNum = noteId + 1;

  // Tạo ID ngẫu nhiên theo ngày
  const cardId = generateCardId();

  // 9 fields
  const fields = [
    cardId,                                    // ID
    `<img src="${opts.image}">`,              // Image
    `<img src="${opts.questionMask}">`,       // Question Mask
    `<img src="${opts.answerMask}">`,         // Answer Mask
    `<img src="${opts.originalMask}">`,       // Original Mask
    '',                                        // Header
    '',                                        // Footer
    '',                                        // Remarks
    '',                                        // Sources
    '',                                        // Extra 1
    ''                                         // Extra 2
  ].join('\x1f');

  // Sort field
  const sortField = opts.cardTitle || 'Image Occlusion';

  db.run(
    `INSERT INTO notes VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '')`,
    [noteId, generateGuid(), modelId, timestamp, fields, sortField]
  );

  db.run(
    `INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
    [cardIdNum, noteId, deckId, timestamp]
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
 * Tạo Image Occlusion model với đúng 11 fields và templates
 */
const ANKI_IO_TEMPLATE_STORAGE_KEY = 'ankiIoTemplateOverride';
const ANKI_IO_TEMPLATE_FILES = {
  front: 'anki-templates/image-occlusion-front.html',
  back: 'anki-templates/image-occlusion-back.html',
  css: 'anki-templates/image-occlusion-style.css'
};

function chromeStorageLocalGet(keys) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (result) => resolve(result || {}));
    } catch (_) {
      resolve({});
    }
  });
}

async function fetchTemplateText(relativePath) {
  const url = chrome.runtime.getURL(relativePath);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${relativePath}`);
  }
  return await response.text();
}

async function getImageOcclusionTemplates() {
  const [defaultFront, defaultBack, defaultCss] = await Promise.all([
    fetchTemplateText(ANKI_IO_TEMPLATE_FILES.front).catch(() => null),
    fetchTemplateText(ANKI_IO_TEMPLATE_FILES.back).catch(() => null),
    fetchTemplateText(ANKI_IO_TEMPLATE_FILES.css).catch(() => null)
  ]);

  const stored = await chromeStorageLocalGet([ANKI_IO_TEMPLATE_STORAGE_KEY]);
  const override = stored[ANKI_IO_TEMPLATE_STORAGE_KEY];

  return {
    front: (override && typeof override.front === 'string' && override.front.trim()) ? override.front : defaultFront,
    back: (override && typeof override.back === 'string' && override.back.trim()) ? override.back : defaultBack,
    css: (override && typeof override.css === 'string' && override.css.trim()) ? override.css : defaultCss
  };
}

function createImageOcclusionModel(modelId, deckId, timestamp, modelName, templates) {
  // Đọc templates từ files đính kèm
  const frontTemplate = `{{#Image}}
<div id="io-header">{{Header}}</div>
<div id="io-wrapper">
  <div id="io-overlay">{{Question Mask}}</div>
  <div id="io-original">{{Image}}</div>
</div>
<div id="io-footer">{{Footer}}</div>

<script>
// Prevent original image from loading before mask
aFade = 50, qFade = 0;
var mask = document.querySelector('#io-overlay>img');
function loaded() {
    var original = document.querySelector('#io-original');
    original.style.visibility = "visible";
}
if (mask === null || mask.complete) {
    loaded();
} else {
    mask.addEventListener('load', loaded);
}
</script>
{{/Image}}`;

  const backTemplate = `{{#Image}}
<div id="io-header">{{Header}}</div>
<div id="io-wrapper">
  <div id="io-overlay">{{Answer Mask}}</div>
  <div id="io-original">{{Image}}</div>
</div>
{{#Footer}}<div id="io-footer">{{Footer}}</div>{{/Footer}}
<button id="io-revl-btn" onclick="toggle();">Toggle Masks</button>
<div id="io-extra-wrapper">
  <div id="io-extra">
    {{#Remarks}}
      <div class="io-extra-entry">
        <div class="io-field-descr">Remarks</div>{{Remarks}}
      </div>
    {{/Remarks}}
    {{#Sources}}
      <div class="io-extra-entry">
        <div class="io-field-descr">Sources</div>{{Sources}}
      </div>
    {{/Sources}}
    {{#Extra 1}}
      <div class="io-extra-entry">
        <div class="io-field-descr">Extra 1</div>{{Extra 1}}
      </div>
    {{/Extra 1}}
    {{#Extra 2}}
      <div class="io-extra-entry">
        <div class="io-field-descr">Extra 2</div>{{Extra 2}}
      </div>
    {{/Extra 2}}
  </div>
</div>

<script>
// Toggle answer mask on clicking the image
var toggle = function() {
  var amask = document.getElementById('io-overlay');
  if (amask.style.display === 'block' || amask.style.display === '')
    amask.style.display = 'none';
  else
    amask.style.display = 'block'
}

// Prevent original image from loading before mask
aFade = 50, qFade = 0;
var mask = document.querySelector('#io-overlay>img');
function loaded() {
    var original = document.querySelector('#io-original');
    original.style.visibility = "visible";
}
if (mask === null || mask.complete) {
    loaded();
} else {
    mask.addEventListener('load', loaded);
}
</script>
{{/Image}}`;

  const cssStyle = `/* GENERAL CARD STYLE */
.card {
  font-family: "Helvetica LT Std", Helvetica, Arial, Sans;
  font-size: 150%;
  text-align: center;
  color: black;
  background-color: white;
}

/* OCCLUSION CSS START - don't edit this */
#io-overlay {
  position:absolute;
  top:0;
  width:100%;
  z-index:3
}

#io-original {
  position:relative;
  top:0;
  width:100%;
  z-index:2;
  visibility: hidden;
}

#io-wrapper {
  position:relative;
  width: 100%;
}
/* OCCLUSION CSS END */

/* OTHER STYLES */
#io-header{
  font-size: 1.1em;
  margin-bottom: 0.2em;
}

#io-footer{
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0.8em;
  font-style: italic;
}

#io-extra-wrapper{
  /* the wrapper is needed to center the
  left-aligned blocks below it */
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0.5em;
}

#io-extra{
  text-align:center;
  display: inline-block;
}

.io-extra-entry{
  margin-top: 0.8em;
  font-size: 0.9em;
  text-align:left;
}

.io-field-descr{
  margin-bottom: 0.2em;
  font-weight: bold;
  font-size: 1em;
}

#io-revl-btn {
  font-size: 0.5em;
}

/* ADJUSTMENTS FOR MOBILE DEVICES */

.mobile .card, .mobile #content {
  font-size: 120%;
  margin: 0;
}

.mobile #io-extra-wrapper {
  width: 95%;
}

.mobile #io-revl-btn {
  font-size: 0.8em;
}`;

  const finalFrontTemplate = (templates && templates.front) ? templates.front : frontTemplate;
  const finalBackTemplate = (templates && templates.back) ? templates.back : backTemplate;
  const finalCssStyle = (templates && templates.css) ? templates.css : cssStyle;

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
        { name: "ID", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Image", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Question Mask", ord: 2, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Answer Mask", ord: 3, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Original Mask", ord: 4, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Header", ord: 5, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Footer", ord: 6, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Remarks", ord: 7, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Sources", ord: 8, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Extra 1", ord: 9, sticky: true, rtl: false, font: "Arial", size: 16, media: [] },
        { name: "Extra 2", ord: 10, sticky: true, rtl: false, font: "Arial", size: 16, media: [] }
      ],
      tmpls: [{
        name: "Card 1",
        ord: 0,
        qfmt: finalFrontTemplate,
        afmt: finalBackTemplate,
        bqfmt: "",
        bafmt: "",
        did: null
      }],
      css: finalCssStyle,
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
 * Tạo ID ngẫu nhiên theo ngày
 */
function generateCardId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

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
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            return chrome.runtime.getURL('vendor/sql-wasm.wasm');
          }
          return 'vendor/sql-wasm.wasm';
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

// Export functions to global scope
if (typeof window !== 'undefined') {
  window.exportAnkiMultiCard = exportAnkiMultiCard;
  window.exportAnkiSingleCard = exportAnkiSingleCard;
  window.createApkgMultiCard = createApkgMultiCard;
  window.createApkgSingleCard = createApkgSingleCard;
  window.createAnkiCollectionMultiCard = createAnkiCollectionMultiCard;
  window.createAnkiCollectionSingleCard = createAnkiCollectionSingleCard;
  window.initializeSqlJs = initializeSqlJs;
  window.createQuestionMask = createQuestionMask;
  window.createAnswerMask = createAnswerMask;
  window.createOriginalMask = createOriginalMask;
  window.createOriginalImageFromOverlay = createOriginalImageFromOverlay;
  window.createAllMasksFromOverlay = createAllMasksFromOverlay;
  window.createEmptyMask = createEmptyMask;
  window.canvasToBlob = canvasToBlob;
}

// Mark unified export library ready
try { document.documentElement.setAttribute('data-afc-anki-export-ready','1'); } catch(e) {}
