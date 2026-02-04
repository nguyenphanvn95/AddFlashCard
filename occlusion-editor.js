/*
  VIP++ Image Occlusion Editor
  Basic integration: uses existing MediaHandler.processHTMLContent when saving
*/

const $ = (id) => document.getElementById(id);

const state = {
  ctx: null,
  img: new Image(),
  imgLoaded: false,
  imgSrc: "",
  deck: "",
  tags: [],
  baseBackHtml: "",
  rects: [],
  selected: -1,
  drawing: false,
  dragStart: null,
  undo: [],
  redo: [],
  showLabels: true,
};

function toast(msg, kind = "info") {
  const t = $("toast");
  t.textContent = msg;
  t.style.display = "block";
  t.dataset.kind = kind;
  clearTimeout(toast._tm);
  toast._tm = setTimeout(() => (t.style.display = "none"), 2200);
}

function pushUndo() { state.undo.push(JSON.stringify(state.rects)); if (state.undo.length>100) state.undo.shift(); state.redo.length=0; }
function doUndo(){ if(!state.undo.length) return; state.redo.push(JSON.stringify(state.rects)); state.rects = JSON.parse(state.undo.pop()); state.selected=-1; renderAll(); }
function doRedo(){ if(!state.redo.length) return; state.undo.push(JSON.stringify(state.rects)); state.rects = JSON.parse(state.redo.pop()); state.selected=-1; renderAll(); }

function getCanvas(){ return $("canvas"); }
function canvasToNorm(px,py){ const c = getCanvas(); return { nx: px / c.width, ny: py / c.height }; }
function normToCanvas(nx,ny){ const c = getCanvas(); return { px: nx * c.width, py: ny * c.height }; }

function draw(){
  const c = getCanvas(); const ctx = state.ctx; if(!ctx) return; ctx.clearRect(0,0,c.width,c.height);
  if(!state.imgLoaded) return; ctx.drawImage(state.img,0,0,c.width,c.height);
  state.rects.forEach((r,i)=>{
    const {px:x,py:y} = normToCanvas(r.x,r.y); const {px:x2,py:y2} = normToCanvas(r.x+r.w,r.y+r.h); const w = x2-x, h = y2-y;
    ctx.save(); ctx.lineWidth = i===state.selected?3:2; ctx.strokeStyle = i===state.selected?"#4f8cff":"rgba(255,255,255,.75)"; ctx.fillStyle = "rgba(0,0,0,.08)"; ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h); ctx.restore();
  });
  if(state.drawing && state.dragStart && state.dragTemp){ const r = state.dragTemp; const {px:x,py:y} = normToCanvas(r.x,r.y); const {px:x2,py:y2} = normToCanvas(r.x+r.w,r.y+r.h); ctx.save(); ctx.setLineDash([6,4]); ctx.strokeStyle="#4f8cff"; ctx.lineWidth=2; ctx.strokeRect(x,y,x2-x,y2-y); ctx.restore(); }
}

function renderBoxList(){ const list=$("boxList"); list.innerHTML=''; if(state.rects.length===0){ list.innerHTML=`<div class="empty">No boxes yet.</div>`; return;} state.rects.forEach((r,i)=>{ const item=document.createElement('div'); item.className='boxItem'+(i===state.selected? ' active':''); item.innerHTML = `<div class="boxName">#${i+1}</div><div class="boxMeta">${Math.round(r.w*100)}% × ${Math.round(r.h*100)}%</div><button class="miniBtn" data-act="select" data-idx="${i}">Select</button><button class="miniBtn danger" data-act="delete" data-idx="${i}">Delete</button>`; list.appendChild(item); }); list.querySelectorAll('button').forEach(b=>b.addEventListener('click',(e)=>{ const act=b.dataset.act, idx=Number(b.dataset.idx); if(act==='select'){ state.selected=idx; renderAll(); } else if(act==='delete'){ deleteRect(idx); } })); }

function renderInfo(){ $('deckName').textContent = state.deck || '-'; $('tagsName').textContent=(state.tags||[]).join(',')||'-'; $('imgInfo').textContent = state.imgLoaded ? 'Ready' : 'Loading...'; }
function renderAll(){ draw(); renderBoxList(); renderInfo(); }
function deleteRect(idx){ if(idx<0||idx>=state.rects.length) return; pushUndo(); state.rects.splice(idx,1); if(state.selected===idx) state.selected=-1; if(state.selected>idx) state.selected--; renderAll(); }
function clearRects(){ if(!state.rects.length) return; pushUndo(); state.rects=[]; state.selected=-1; renderAll(); }

function pickRect(nx,ny){ for(let i=state.rects.length-1;i>=0;i--){ const r = state.rects[i]; if(nx>=r.x && nx<=r.x+r.w && ny>=r.y && ny<=r.y+r.h) return i; } return -1; }

function setupCanvasInteractions(){ const c=getCanvas(); const getLocal=(ev)=>{ const r=c.getBoundingClientRect(); const px=(ev.clientX-r.left)*(c.width/r.width); const py=(ev.clientY-r.top)*(c.height/r.height); return {px,py}; };
  c.addEventListener('mousedown', (ev)=>{ if(!state.imgLoaded) return; const {px,py}=getLocal(ev); const {nx,ny}=canvasToNorm(px,py); const hit=pickRect(nx,ny); if(hit!==-1){ state.selected=hit; renderAll(); return; } pushUndo(); state.drawing=true; state.dragStart={px,py}; state.dragTemp={x:nx,y:ny,w:0,h:0}; state.selected=-1; draw(); });
  c.addEventListener('mousemove',(ev)=>{ if(!state.drawing||!state.dragStart) return; const {px,py}=getLocal(ev); const {nx,ny}=canvasToNorm(px,py); const r=state.dragTemp; r.w = nx - r.x; r.h = ny - r.y; renderAll(); });
  c.addEventListener('mouseup', ()=>{ if(state.drawing){ const r = sortRect(state.dragTemp); state.rects.push(r); state.dragTemp=null; state.drawing=false; renderAll(); } });
}

function setupShortcuts(){ document.addEventListener('keydown',(e)=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); doUndo(); } else if((e.ctrlKey||e.metaKey) && (e.key.toLowerCase()==='y' || (e.shiftKey && e.key.toLowerCase()==='z'))){ e.preventDefault(); doRedo(); } else if(e.key==='Delete'){ if(state.selected!==-1){ deleteRect(state.selected); } } else if(e.key==='Escape'){ window.close(); } }); }

function buildSvgOverlay(rects, opts){ const mode=opts.mode, targetIdx=opts.targetIdx, showLabels=opts.showLabels, fillAll=opts.fillAll||false, fillTarget=opts.fillTarget||false, highlight=opts.highlight||false; const parts=[]; parts.push(`<svg class="afc-io" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">`);
  rects.forEach((r,i)=>{ const x=r.x*1000,y=r.y*1000,w=r.w*1000,h=r.h*1000; const fill = (fillAll || (fillTarget && i===targetIdx)) ? 'rgba(0,0,0,0.95)' : 'none'; const stroke = highlight? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'; parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`); if(showLabels){ parts.push(`<text x="${x+8}" y="${y+24}" fill="white" font-size="36">${i+1}</text>`); } }); parts.push(`</svg>`); return parts.join(''); }

function buildIOCardHtml(imgSrc, rects, mode, targetIdx, showLabels){ const commonCss = `<style>.afc-io-wrap{position:relative;display:inline-block;max-width:100%}.afc-io-wrap img{max-width:100%;height:auto;display:block}.afc-io{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}</style>`; const frontSvg = mode==='hide_all'? buildSvgOverlay(rects,{mode,targetIdx,showLabels,fillAll:true,highlight:false}) : buildSvgOverlay(rects,{mode,targetIdx,showLabels,fillTarget:true,highlight:false}); const backSvg = buildSvgOverlay(rects,{mode,targetIdx,showLabels,fillAll:false,highlight:true}); const frontHtml = `${commonCss}<div class="afc-io-wrap"><img src="${imgSrc}"/>${frontSvg}</div>`; const backHtml = `${commonCss}<div class="afc-io-wrap"><img src="${imgSrc}"/>${backSvg}</div>`; return { frontHtml, backHtml }; }

async function saveGeneratedCards(cards){ if(typeof MediaHandler?.processHTMLContent === 'function'){ // let media handler replace remote URLs with base64 or media keys
    for(let i=0;i<cards.length;i++){ const r = await MediaHandler.processHTMLContent(cards[i].front); cards[i].front = r.html; if(r.media && r.media.length) cards[i].media = (cards[i].media||[]).concat(r.media); const rb = await MediaHandler.processHTMLContent(cards[i].back); cards[i].back = rb.html; if(rb.media && rb.media.length) cards[i].media = (cards[i].media||[]).concat(rb.media); }
  }
  const existing = await chrome.storage.local.get(['cards']); const list = existing.cards || []; list.push(...cards); await chrome.storage.local.set({ cards: list }); }

async function generateCards(){ if(!state.imgLoaded){ toast('Image not loaded','error'); return; } if(!state.rects.length){ toast('No boxes created','error'); return; } const mode = $('modeSelect').value; const showLabels = $('labelsToggle').checked; const cards = []; if(mode==='hide_one'){ for(let i=0;i<state.rects.length;i++){ const {frontHtml, backHtml} = buildIOCardHtml(state.imgSrc,state.rects,mode,i,showLabels); cards.push({ front: frontHtml, back: state.baseBackHtml + backHtml, tags: state.tags.slice(), deck: state.deck, noteType: 'AFC Image Occlusion - Hide One'}); } } else { const {frontHtml, backHtml} = buildIOCardHtml(state.imgSrc,state.rects,mode,0,showLabels); cards.push({ front: frontHtml, back: state.baseBackHtml + backHtml, tags: state.tags.slice(), deck: state.deck, noteType: 'AFC Image Occlusion - Hide All'}); }
  await saveGeneratedCards(cards); toast(`Generated ${cards.length} card(s)!`,'success'); setTimeout(()=>window.close(),700);
}

async function loadContext(){ const res = await chrome.storage.local.get(['afc_occlusion_context']); const ctx = res.afc_occlusion_context; if(!ctx || !ctx.imgSrc) { toast('No context to open', 'error'); return null; } state.imgSrc = ctx.imgSrc; state.deck = ctx.deck || ''; state.tags = ctx.tags || []; state.baseBackHtml = ctx.baseBackHtml || ''; return ctx; }

function fitCanvasToImage(imgW,imgH){ const maxW = Math.min(window.innerWidth - 360, 1200); const maxH = window.innerHeight - 140; const ratio = imgW/imgH; let w = maxW; let h = Math.round(w/ratio); if(h>maxH){ h = maxH; w = Math.round(h*ratio); } const c = getCanvas(); c.width = Math.max(10,w); c.height = Math.max(10,h); state.ctx = c.getContext('2d'); }

async function init(){ $('btnUndo').addEventListener('click', doUndo); $('btnRedo').addEventListener('click', doRedo); $('btnClear').addEventListener('click', clearRects); $('btnGenerate').addEventListener('click', generateCards); $('labelsToggle').addEventListener('change',()=>{ state.showLabels = $('labelsToggle').checked; renderAll(); }); $('btnBack').addEventListener('click',()=>window.close()); setupCanvasInteractions(); setupShortcuts(); const ctx = await loadContext(); if(!ctx) return; renderInfo(); state.img.onload = ()=>{ state.imgLoaded = true; fitCanvasToImage(state.img.naturalWidth, state.img.naturalHeight); renderAll(); }; state.img.onerror = ()=>{ toast('Failed to load image','error'); }; state.img.src = state.imgSrc; }

init();
