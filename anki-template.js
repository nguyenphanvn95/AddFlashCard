const TEMPLATE_KEY = 'ankiIoTemplateOverride';
const TEMPLATE_FILES = {
  front: 'anki-templates/image-occlusion-front.html',
  back: 'anki-templates/image-occlusion-back.html',
  css: 'anki-templates/image-occlusion-style.css'
};

const statusText = document.getElementById('statusText');
const templateEditor = document.getElementById('templateEditor');
const previewFrame = document.getElementById('previewFrame');
const searchInput = document.getElementById('searchInput');

let templatesState = { front: '', back: '', css: '' };
let activeEditTab = 'front';
let activePreviewTab = 'front';

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, (res) => resolve(res || {})));
}

function storageSet(data) {
  return new Promise((resolve) => chrome.storage.local.set(data, () => resolve()));
}

function storageRemove(keys) {
  return new Promise((resolve) => chrome.storage.local.remove(keys, () => resolve()));
}

async function fetchTemplateText(relativePath) {
  const res = await fetch(chrome.runtime.getURL(relativePath), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Không thể đọc ${relativePath}`);
  return await res.text();
}

async function loadDefaultTemplates() {
  const [front, back, css] = await Promise.all([
    fetchTemplateText(TEMPLATE_FILES.front),
    fetchTemplateText(TEMPLATE_FILES.back),
    fetchTemplateText(TEMPLATE_FILES.css)
  ]);
  return { front, back, css };
}

function setStatus(text) {
  statusText.textContent = text;
}

function saveCurrentEditorToState() {
  templatesState[activeEditTab] = templateEditor.value;
}

function loadEditorFromState() {
  templateEditor.value = templatesState[activeEditTab] || '';
}

function fillAnkiTemplate(rawHtml, sampleFields) {
  let html = rawHtml || '';

  for (const key of Object.keys(sampleFields)) {
    const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`{{${escKey}}}`, 'g'), sampleFields[key]);
    html = html.replace(new RegExp(`{{#${escKey}}}`, 'g'), '');
    html = html.replace(new RegExp(`{{/${escKey}}}`, 'g'), '');
  }

  html = html.replace(/{{#[^}]+}}/g, '');
  html = html.replace(/{{\/[^}]+}}/g, '');
  html = html.replace(/{{[^}]+}}/g, '');
  return html;
}

function renderPreview() {
  saveCurrentEditorToState();

  const sample = {
    Header: 'Đề IELTS Writing Task 1',
    Footer: 'Nguồn: AddFlashcard',
    Remarks: 'Ghi chú mẫu',
    Sources: 'Nguồn mẫu',
    Image: '<img src="https://via.placeholder.com/900x500?text=Original+Image" alt="Image">',
    'Question Mask': '<img src="https://via.placeholder.com/900x500/ffd166/222?text=Question+Mask" alt="QMask">',
    'Answer Mask': '<img src="https://via.placeholder.com/900x500/fec89a/222?text=Answer+Mask" alt="AMask">',
    'Original Mask': '<img src="https://via.placeholder.com/900x500/fccf85/222?text=Original+Mask" alt="OMask">',
    'Extra 1': '',
    'Extra 2': ''
  };

  const sourceHtml = activePreviewTab === 'front' ? templatesState.front : templatesState.back;
  const html = fillAnkiTemplate(sourceHtml, sample);

  previewFrame.srcdoc = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>${templatesState.css || ''}</style>
  </head>
  <body class="card">${html}</body>
</html>`;
}

async function saveTemplates() {
  saveCurrentEditorToState();
  await storageSet({
    [TEMPLATE_KEY]: {
      front: templatesState.front,
      back: templatesState.back,
      css: templatesState.css,
      updatedAt: Date.now()
    }
  });
  setStatus('Đã lưu template. Lần xuất .apkg tiếp theo sẽ áp dụng.');
}

async function resetTemplates() {
  await storageRemove([TEMPLATE_KEY]);
  templatesState = await loadDefaultTemplates();
  loadEditorFromState();
  renderPreview();
  setStatus('Đã reset về template mặc định trong thư mục anki-templates.');
}

function bindTemplateTabRadios() {
  document.querySelectorAll('input[name="editTab"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      saveCurrentEditorToState();
      activeEditTab = radio.value;
      loadEditorFromState();
      renderPreview();
    });
  });
}

function bindPreviewTabRadios() {
  document.querySelectorAll('input[name="previewTab"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      activePreviewTab = radio.value;
      renderPreview();
    });
  });
}

function bindSearch() {
  const runSearch = () => {
    const q = searchInput.value || '';
    if (!q) return;
    const text = templateEditor.value;
    const index = text.toLowerCase().indexOf(q.toLowerCase());
    if (index < 0) {
      setStatus(`Không tìm thấy: "${q}"`);
      return;
    }
    templateEditor.focus();
    templateEditor.setSelectionRange(index, index + q.length);
    setStatus(`Đã tìm thấy: "${q}"`);
  };

  document.getElementById('searchBtn').addEventListener('click', runSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });
}

async function initializeTemplateEditor() {
  try {
    const defaults = await loadDefaultTemplates();
    const stored = await storageGet([TEMPLATE_KEY]);
    const custom = stored[TEMPLATE_KEY] || {};

    templatesState = {
      front: custom.front || defaults.front,
      back: custom.back || defaults.back,
      css: custom.css || defaults.css
    };

    loadEditorFromState();
    renderPreview();
    setStatus('Đã nạp template từ extension (hoặc bạn đã sửa trước đó).');
  } catch (error) {
    console.error(error);
    setStatus('Lỗi nạp template: ' + (error.message || error));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  bindTemplateTabRadios();
  bindPreviewTabRadios();
  bindSearch();

  document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
    try {
      await saveTemplates();
    } catch (error) {
      setStatus('Lỗi lưu template: ' + (error.message || error));
    }
  });

  document.getElementById('resetTemplateBtn').addEventListener('click', async () => {
    try {
      await resetTemplates();
    } catch (error) {
      setStatus('Lỗi reset template: ' + (error.message || error));
    }
  });

  document.getElementById('backEditorBtn').addEventListener('click', () => {
    window.location.href = chrome.runtime.getURL('image-occlusion-editor.html');
  });

  templateEditor.addEventListener('input', () => {
    saveCurrentEditorToState();
    renderPreview();
  });

  await initializeTemplateEditor();
});

