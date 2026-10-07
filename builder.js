// Visual page builder for the static demo: build a page from blocks, see it as families will, publish it.
import {shell, t, esc, es, route, schoolURL} from './common.js';
import {demoItems, saveDemoItems, readJSON, WS_KEYS} from './static-api.js';
import {BLOCKS, STATIC_BLOCKS, newBlock, renderBlocks, hydrateBlocks, putMedia, getMedia, listMedia, mediaURL, sanitize, parseVideo, blockIssues, ensureStyles} from './blocks.js';

shell('builder');
document.title = t('Page builder · D11', 'Editor de páginas · D11');
ensureStyles();
const main = document.querySelector('#main');
const ROLE_KEY = 'd11-demo-role-v1', WORK_KEY = 'd11-builder-working-v1';
const L = () => ({ en: '', es: '' });
const blankPage = scope => ({ id: null, scope: scope || 'district', title: L(), intro: L(), theme: { accent: '#0b2545' }, blocks: [] });
const SWATCHES = [['#0b2545', 'District navy', 'Azul del distrito'], ['#145f9f', 'Blue', 'Azul'], ['#1d6b45', 'Green', 'Verde'], ['#7a1f2b', 'Maroon', 'Granate'], ['#4b2a7b', 'Purple', 'Morado'], ['#0f6670', 'Teal', 'Verde azulado'], ['#9a3412', 'Rust', 'Óxido'], ['#222222', 'Charcoal', 'Carbón']];
const LAYOUTS = {
  program: { en: 'Program page', es: 'Página de programa', blocks: ['heading', 'text', 'textimage', 'button'] },
  event: { en: 'Event page', es: 'Página de evento', blocks: ['image', 'text', 'callout', 'button'] },
  faq: { en: 'FAQ page', es: 'Preguntas frecuentes', blocks: ['text', 'collapsible', 'collapsible', 'collapsible'] },
  showcase: { en: 'Photo & video showcase', es: 'Fotos y video', blocks: ['heading', 'gallery', 'video', 'text'] },
  classroom: { en: 'Classroom page', es: 'Página de clase', blocks: ['contact', 'text', 'dates', 'table', 'checklist', 'links', 'signup'] }
};

let schools = [], role = 'editor', page = blankPage(), sel = null, lang = es ? 'es' : 'en', device = 'desktop', tab = 'insert';
let undo = [], redo = [], typing = null, workTimer = null;
try { role = localStorage.getItem(ROLE_KEY) || 'editor'; } catch {}

const $ = id => document.getElementById(id);
const tt = (en, sp) => t(en, sp);
const blk = id => page.blocks.find(b => b.id === id);
const scopeName = s => s === 'district' ? tt('District site', 'Sitio del distrito') : (schools.find(x => x.id === s)?.name || s);
const contrast = hex => { const c = hex.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return 1.05 / (l + 0.05); };

// ── History (undo/redo) and autosave of the working copy
function snapshot() { undo.push(JSON.stringify(page)); if (undo.length > 60) undo.shift(); redo = []; syncTop(); }
function typingSnapshot() { if (!typing) snapshot(); clearTimeout(typing); typing = setTimeout(() => typing = null, 900); saveWork(); }
function saveWork() { clearTimeout(workTimer); workTimer = setTimeout(() => { try { localStorage.setItem(WORK_KEY, JSON.stringify(page)); } catch {} }, 400); }
function doUndo() { if (!undo.length) return; redo.push(JSON.stringify(page)); page = JSON.parse(undo.pop()); if (sel && !blk(sel)) sel = null; renderAll(); saveWork(); }
function doRedo() { if (!redo.length) return; undo.push(JSON.stringify(page)); page = JSON.parse(redo.pop()); renderAll(); saveWork(); }

// ── Media helpers
async function processImage(file, max = 1800) {
  const url = URL.createObjectURL(file), img = new Image(); img.src = url; await img.decode();
  const sc = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  const png = file.type === 'image/png';
  return new Promise(ok => c.toBlob(b => ok(b), png ? 'image/png' : 'image/jpeg', 0.86));
}
async function transformImage(b) { // rotate + crop from the original upload
  const src = await getMedia(b.original || b.media); if (!src) return;
  const url = URL.createObjectURL(src.blob), img = new Image(); img.src = url; await img.decode();
  const rot = ((b.rot || 0) % 360 + 360) % 360, sw = rot % 180 ? img.height : img.width, sh = rot % 180 ? img.width : img.height;
  const r = { orig: 0, '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1 }[b.aspect || 'orig'];
  let cw = sw, ch = sh; if (r) { if (sw / sh > r) cw = Math.round(sh * r); else ch = Math.round(sw / r); }
  const rotC = document.createElement('canvas'); rotC.width = sw; rotC.height = sh; const g = rotC.getContext('2d');
  g.translate(sw / 2, sh / 2); g.rotate(rot * Math.PI / 180); g.drawImage(img, -img.width / 2, -img.height / 2);
  const out = document.createElement('canvas'); out.width = cw; out.height = ch; out.getContext('2d').drawImage(rotC, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, cw, ch);
  URL.revokeObjectURL(url);
  const blob = await new Promise(ok => out.toBlob(ok, 'image/jpeg', 0.88)); b.media = await putMedia(blob, 'edited.jpg');
}
function tooBig(file, mb) { if (file.size > mb * 1e6) { msg(tt(`That file is larger than ${mb} MB.`, `Ese archivo supera ${mb} MB.`), true); return true; } return false; }
async function addFiles(files, afterId) {
  for (const f of files) {
    let b = null;
    if (f.type.startsWith('image/')) { if (tooBig(f, 15)) continue; b = newBlock('image'); const m = await putMedia(await processImage(f), f.name); b.media = b.original = m; }
    else if (f.type.startsWith('video/')) { if (tooBig(f, 250)) continue; b = newBlock('video'); b.media = await putMedia(f, f.name); }
    else if (/pdf|word|excel|powerpoint|officedocument|text\/plain/.test(f.type) || /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(f.name)) { if (tooBig(f, 25)) continue; b = newBlock('file'); b.media = await putMedia(f, f.name); b.fileName = f.name; b.name = { en: f.name.replace(/\.[^.]+$/, ''), es: '' }; }
    if (!b) { msg(tt(`${f.name}: use a photo, video or document.`, `${f.name}: use una foto, video o documento.`), true); continue; }
    insertBlock(b, afterId); afterId = b.id;
  }
}

// ── Structure changes
function insertBlock(b, afterId = sel) {
  snapshot(); const i = afterId ? page.blocks.findIndex(x => x.id === afterId) : -1;
  page.blocks.splice(i >= 0 ? i + 1 : page.blocks.length, 0, b); sel = b.id; tab = ['heading', 'text', 'divider', 'spacer'].includes(b.type) ? 'insert' : 'block'; renderAll(); saveWork();
  requestAnimationFrame(() => document.querySelector(`[data-bid="${b.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
}
function moveBlock(id, d) { const i = page.blocks.findIndex(x => x.id === id), j = i + d; if (j < 0 || j >= page.blocks.length) return; snapshot(); [page.blocks[i], page.blocks[j]] = [page.blocks[j], page.blocks[i]]; renderCanvas(); saveWork(); }
function dupBlock(id) { const b = blk(id); const c = JSON.parse(JSON.stringify(b)); c.id = newBlock(b.type).id; insertBlock(c, id); }
function delBlock(id) { snapshot(); page.blocks = page.blocks.filter(x => x.id !== id); if (sel === id) { sel = null; tab = 'insert'; } renderAll(); saveWork(); }

// ── Layout
main.innerHTML = `<section class="pb-app" aria-label="${tt('Page builder', 'Editor de páginas')}">
 <h1 class="sr-only">${tt('Page builder', 'Editor de páginas')}</h1>
 <div class="pb-top">
  <div class="pb-top-group"><a class="btn compact" href="${route('staff')}">← ${tt('Staff workspace', 'Espacio del personal')}</a>
   <label for="pb-scope" class="pb-mini">${tt('Site', 'Sitio')}</label><select id="pb-scope"></select></div>
  <div class="pb-top-group" role="group" aria-label="${tt('Editing language', 'Idioma de edición')}"><span class="pb-mini">${tt('Editing', 'Editando')}</span><button type="button" class="btn compact" data-lang="en">English</button><button type="button" class="btn compact" data-lang="es">Español</button></div>
  <div class="pb-top-group" role="group" aria-label="${tt('Preview size', 'Tamaño de vista')}"><button type="button" class="btn compact" data-device="desktop">🖥 ${tt('Desktop', 'Escritorio')}</button><button type="button" class="btn compact" data-device="phone">📱 ${tt('Phone', 'Teléfono')}</button></div>
  <div class="pb-top-group"><button type="button" class="btn compact" id="pb-undo">↶ ${tt('Undo', 'Deshacer')}</button><button type="button" class="btn compact" id="pb-redo">↷ ${tt('Redo', 'Rehacer')}</button><button type="button" class="btn compact" id="pb-preview">👁 ${tt('Preview', 'Vista previa')}</button><button type="button" class="btn compact" id="pb-save">${tt('Save draft', 'Guardar borrador')}</button><button type="button" class="btn compact primary" id="pb-publish"></button></div>
  <div class="pb-top-group" role="group" aria-label="${tt('Role', 'Rol')}"><span class="pb-mini">${tt('Role', 'Rol')}</span><button type="button" class="btn compact" data-role="editor">${tt('School editor', 'Editor escolar')}</button><button type="button" class="btn compact" data-role="publisher">${tt('District publisher', 'Publicador del distrito')}</button></div>
 </div>
 <p id="pb-msg" class="pb-msg" role="status" aria-live="polite"></p>
 <div class="pb-main">
  <div class="pb-stage" id="pb-stage"><div id="pb-canvas"></div></div>
  <aside class="pb-side">
   <div class="pb-tabs" role="tablist">${[['insert', 'Insert', 'Insertar'], ['block', 'Block', 'Bloque'], ['pages', 'Pages', 'Páginas'], ['theme', 'Theme', 'Tema']].map(([id, en, sp]) => `<button type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="pb-panel">${tt(en, sp)}</button>`).join('')}</div>
   <div id="pb-panel" role="tabpanel"></div>
   <div id="pb-checks" class="pb-checks" aria-live="polite"></div>
  </aside>
 </div>
 <dialog id="pb-dialog" aria-labelledby="pb-dialog-title"><div class="pb-dialog-bar"><strong id="pb-dialog-title">${tt('Preview', 'Vista previa')}</strong><span><button type="button" class="btn compact" data-plang="en">English</button><button type="button" class="btn compact" data-plang="es">Español</button><button type="button" class="btn compact" id="pb-dialog-close">${tt('Close', 'Cerrar')}</button></span></div><div id="pb-dialog-body"></div></dialog>
</section>`;

// ── Canvas
function editorFor(b) {
  const v = o => esc(o?.[lang] || ''), ph = (en, sp) => esc(tt(en, sp)) + (lang === 'es' ? ' (español)' : ' (English)');
  const drop = (kind, accept, en, sp, multiple = false) => `<label class="pb-drop"><span>${tt(en, sp)}</span><input type="file" class="sr-only" accept="${accept}" data-upload="${kind}" ${multiple ? 'multiple' : ''}></label>`;
  const rich = (k = 'html', label = tt('Text', 'Texto')) => `${sel === b.id ? toolbar() : ''}<div class="pb-rich" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(label)} (${lang === 'es' ? 'español' : 'English'})" data-rich="${k}" data-ph="${ph('Start typing…', 'Empiece a escribir…')}">${sanitize(b[k][lang])}</div>`;
  switch (b.type) {
    case 'heading': return `<input class="pb-in pb-in-h${b.level}" data-k="text" aria-label="${esc(tt('Heading', 'Título'))}" placeholder="${ph('Heading', 'Título')}" value="${v(b.text)}">`;
    case 'text': return rich();
    case 'image': return b.media ? `<figure class="pb-figure pb-${b.size}"><img src="" data-media="${b.media}" alt="${v(b.alt)}"><input class="pb-in pb-cap" data-k="caption" aria-label="${esc(tt('Caption', 'Pie de foto'))}" placeholder="${ph('Add a caption (optional)', 'Agregue un pie de foto (opcional)')}" value="${v(b.caption)}"></figure>` : drop('image', 'image/*', 'Click to upload a photo, or drop one here', 'Haga clic para subir una foto o suéltela aquí');
    case 'gallery': return `<div class="pb-thumbs">${b.items.map((i, n) => `<figure><img src="" data-media="${i.media}" alt="${esc(i.alt[lang] || '')}"><button type="button" class="pb-x" data-gal-del="${n}" aria-label="${esc(tt('Remove photo', 'Quitar foto'))} ${n + 1}">✕</button></figure>`).join('')}</div>${drop('gallery', 'image/*', '+ Add photos (you can select several)', '+ Agregar fotos (puede elegir varias)', true)}`;
    case 'video': { const pv = parseVideo(b.link); return b.media ? `<video controls preload="metadata" data-media="${b.media}" aria-label="${v(b.title)}"></video>` : pv ? `<div class="pb-embed">▶ ${pv.provider === 'youtube' ? 'YouTube' : 'Vimeo'} · ${esc(pv.id)}<br><span class="small">${tt('Plays on the published page.', 'Se reproduce en la página publicada.')}</span></div>` : `${drop('video', 'video/*', 'Click to upload a video, or drop one here', 'Haga clic para subir un video o suéltelo aquí')}<label class="pb-mini" for="vl-${b.id}">${tt('…or paste a YouTube or Vimeo link', '…o pegue un enlace de YouTube o Vimeo')}</label><input id="vl-${b.id}" class="pb-in" data-k="link" data-raw="1" value="${esc(b.link)}" placeholder="https://youtu.be/…">`; }
    case 'textimage': return `<div class="pb-textimage pb-${b.side}"><div>${rich()}</div>${b.media ? `<figure class="pb-figure"><img src="" data-media="${b.media}" alt="${v(b.alt)}"></figure>` : drop('textimage', 'image/*', 'Add a photo', 'Agregar una foto')}</div>`;
    case 'button': return `<span class="btn ${b.style === 'outline' ? '' : 'primary'} pb-btn pb-btn-edit"><input class="pb-in" data-k="label" aria-label="${esc(tt('Button text', 'Texto del botón'))}" placeholder="${ph('Button text', 'Texto del botón')}" value="${v(b.label)}"></span><span class="small muted"> → ${b.href ? esc(b.href) : tt('choose a destination in the Block panel', 'elija un destino en el panel Bloque')}</span>`;
    case 'file': return b.media ? `<div class="pb-filebox">📄 <input class="pb-in" data-k="name" aria-label="${esc(tt('Document name', 'Nombre del documento'))}" placeholder="${ph('Document name', 'Nombre del documento')}" value="${v(b.name)}"><span class="small muted">${esc(b.fileName)}</span></div>` : drop('file', '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt', 'Upload a document (PDF, Word, Excel, PowerPoint)', 'Suba un documento (PDF, Word, Excel, PowerPoint)');
    case 'collapsible': return `<div class="pb-details"><input class="pb-in pb-strong" data-k="title" aria-label="${esc(tt('Question', 'Pregunta'))}" placeholder="${ph('Question or heading', 'Pregunta o título')}" value="${v(b.title)}"><textarea class="pb-in" data-k="body" rows="2" aria-label="${esc(tt('Answer', 'Respuesta'))}" placeholder="${ph('Answer', 'Respuesta')}">${v(b.body)}</textarea></div>`;
    case 'callout': return `<aside class="pb-callout pb-${b.tone}"><textarea class="pb-in" data-k="text" rows="2" aria-label="${esc(tt('Callout text', 'Texto destacado'))}" placeholder="${ph('Something families should not miss', 'Algo que las familias no deben perderse')}">${v(b.text)}</textarea></aside>`;
    case 'divider': return '<hr class="pb-divider">';
    case 'contact': case 'table': case 'checklist': case 'links': case 'dates': case 'signup': return `<div class="pb-static" aria-hidden="true">${renderBlocks([b], lang === 'es', page.theme)}</div><p class="small muted pb-static-hint">${blockIssues(b).length ? '✎ ' + tt('Fill in the details in the Block panel →', 'Complete los detalles en el panel Bloque →') : tt('Edit in the Block panel →', 'Editar en el panel Bloque →')}</p>`;
    case 'spacer': return `<div class="pb-spacer-edit" style="height:${b.size}px">${tt('Space', 'Espacio')} · ${b.size}px</div>`;
  }
  return '';
}
function toolbar() {
  return `<div class="pb-fmt" role="toolbar" aria-label="${esc(tt('Text formatting', 'Formato de texto'))}">${[['bold', 'B', 'Bold', 'Negrita'], ['italic', 'I', 'Italic', 'Cursiva'], ['underline', 'U', 'Underline', 'Subrayado'], ['insertUnorderedList', '•', 'Bulleted list', 'Lista con viñetas'], ['insertOrderedList', '1.', 'Numbered list', 'Lista numerada'], ['link', '🔗', 'Link', 'Enlace'], ['removeFormat', '⌫', 'Clear formatting', 'Quitar formato']].map(([c, s, en, sp]) => `<button type="button" data-cmd="${c}" aria-label="${esc(tt(en, sp))}" title="${esc(tt(en, sp))}">${s}</button>`).join('')}
  <span class="pb-linkbox" hidden><label class="sr-only" for="pb-link-url">URL</label><input id="pb-link-url" placeholder="https://… ${esc(tt('or a page like page.html?id=…', 'o una página como page.html?id=…'))}"><button type="button" data-cmd="applyLink">${tt('Apply', 'Aplicar')}</button></span></div>`;
}
let drawing = 0;
function guarded(fn) { return (...args) => { if (drawing) { queueMicrotask(() => fn(...args)); return; } drawing++; try { fn(...args); } finally { drawing--; } }; }
const renderCanvas = guarded(function renderCanvasImpl() {
  const issues = new Set(page.blocks.filter(b => blockIssues(b).length).map(b => b.id));
  $('pb-canvas').innerHTML = `<div class="pb-paper ${device}"><div class="pb-page" style="--pb-accent:${esc(page.theme.accent)}">
   <div class="pb-head"><div class="eyebrow">${esc(scopeName(page.scope))}</div>
    <input id="pb-title" class="pb-in pb-title" aria-label="${esc(tt('Page title', 'Título de la página'))}" placeholder="${esc(tt('Page title', 'Título de la página'))}${lang === 'es' ? ' (español)' : ' (English)'}" value="${esc(page.title[lang])}">
    <textarea id="pb-intro" class="pb-in pb-intro" rows="2" aria-label="${esc(tt('Introduction', 'Introducción'))}" placeholder="${esc(tt('A short introduction (optional)', 'Una introducción breve (opcional)'))}">${esc(page.intro[lang])}</textarea></div>
   ${page.blocks.length ? '' : `<div class="pb-empty" id="pb-empty"><strong>${tt('Your page is empty.', 'Su página está vacía.')}</strong><br>${tt('Insert a block from the panel, choose a ready-made layout, or drop photos, videos and documents right here.', 'Inserte un bloque desde el panel, elija un diseño listo, o suelte aquí fotos, videos y documentos.')}</div>`}
   ${page.blocks.map((b, i) => `<div class="pb-blk ${sel === b.id ? 'sel' : ''} ${issues.has(b.id) ? 'warn' : ''}" data-bid="${b.id}">
     <div class="pb-tools"><span class="pb-drag" draggable="true" title="${esc(tt('Drag to move', 'Arrastre para mover'))}" aria-hidden="true">⠿</span><span class="pb-type">${esc(tt(BLOCKS[b.type].en, BLOCKS[b.type].es))}</span>
      <button type="button" data-act="up" aria-label="${esc(tt('Move up', 'Subir'))}" ${i ? '' : 'disabled'}>↑</button><button type="button" data-act="down" aria-label="${esc(tt('Move down', 'Bajar'))}" ${i < page.blocks.length - 1 ? '' : 'disabled'}>↓</button><button type="button" data-act="dup" aria-label="${esc(tt('Duplicate', 'Duplicar'))}">⧉</button><button type="button" data-act="del" aria-label="${esc(tt('Delete block', 'Eliminar bloque'))}">✕</button></div>
     <div class="pb-body">${editorFor(b)}</div></div>`).join('')}
  </div></div>`;
  hydrateBlocks($('pb-canvas'));
  renderChecks();
});

// ── Side panel
function field(label, html, id) { return `<div class="field"><label for="${id}">${label}</label>${html}</div>`; }
function biField(b, key, en, sp, ta = false) {
  return ['en', 'es'].map(l => { const id = `s-${b.id}-${key}-${l}`, label = `${tt(en, sp)} (${l === 'en' ? 'English' : 'Español'})`, val = esc(b[key]?.[l] || '');
    return field(label, ta ? `<textarea id="${id}" data-set="${key}" data-l="${l}" rows="2">${val}</textarea>` : `<input id="${id}" data-set="${key}" data-l="${l}" value="${val}">`, id); }).join('');
}
function pageOptions(current) {
  const items = demoItems().filter(x => x.kind === 'page' && x.status !== 'draft');
  const opts = [['', tt('Choose a page…', 'Elija una página…')], [route('index'), tt('District home', 'Inicio del distrito')], [route('schools'), tt('Find a school', 'Buscar escuela')], [route('families'), tt('Family resources', 'Recursos familiares')], [route('calendar'), tt('Calendar', 'Calendario')],
    ['page.html?id=enrollment', tt('Enrollment', 'Inscripción')], ['page.html?id=meals', tt('Meals', 'Comidas')], ['page.html?id=transportation', tt('Transportation', 'Transporte')], ['page.html?id=customize', tt('Customization', 'Personalización')],
    ...(page.scope !== 'district' ? [[schoolURL(page.scope), tt('This school’s homepage', 'Inicio de esta escuela')]] : []),
    ...items.map(x => [`page.html?id=${x.id}`, es ? x.titleEs : x.title])];
  return opts.map(([v, n]) => `<option value="${esc(v)}" ${v === current ? 'selected' : ''}>${esc(n)}</option>`).join('');
}
const libPicker = b => `<details class="pb-lib"><summary>${tt('Choose from the media library', 'Elegir de la biblioteca de medios')}</summary><div class="pb-lib-grid" data-lib-for="${b.id}"><p class="small muted">${tt('Loading…', 'Cargando…')}</p></div></details>`;
document.addEventListener('toggle', async e => {
  const d = e.target; if (!(d instanceof HTMLDetailsElement) || !d.open || !d.classList.contains('pb-lib')) return;
  const grid = d.querySelector('[data-lib-for]'), list = (await listMedia()).filter(m => (m.type || '').startsWith('image/'));
  if (!list.length) { grid.innerHTML = `<p class="small muted">${tt('No photos in the library yet. Upload some in the staff workspace (Media library) or drop them on the page.', 'Aún no hay fotos en la biblioteca. Súbalas en el espacio del personal (Biblioteca de medios) o arrástrelas a la página.')}</p>`; return; }
  const meta = readJSON(WS_KEYS.mediaMeta, {});
  grid.innerHTML = list.map(m => `<button type="button" class="pb-lib-item" data-pick-media="${esc(m.id)}"><img src="" data-libsrc="${esc(m.id)}" alt=""><span>${esc(meta[m.id]?.en || m.name || tt('Photo', 'Foto'))}</span></button>`).join('');
  for (const img of grid.querySelectorAll('[data-libsrc]')) img.src = await mediaURL(img.dataset.libsrc);
}, true);
const renderPanel = guarded(function renderPanelImpl() {
  document.querySelectorAll('[data-tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); b.classList.toggle('active', b.dataset.tab === tab); });
  const P = $('pb-panel');
  if (tab === 'insert') {
    P.innerHTML = `<h2 class="pb-ph">${tt('Insert', 'Insertar')}</h2><p class="small muted">${sel ? tt('New blocks go below the selected block.', 'Los bloques nuevos van debajo del bloque seleccionado.') : tt('New blocks go at the end of the page.', 'Los bloques nuevos van al final de la página.')}</p>
     <div class="pb-insert">${Object.entries(BLOCKS).map(([k, v]) => `<button type="button" data-insert="${k}"><span aria-hidden="true">${v.icon}</span>${esc(tt(v.en, v.es))}</button>`).join('')}</div>
     <h2 class="pb-ph">${tt('Layouts', 'Diseños')}</h2><p class="small muted">${tt('Start from a ready-made arrangement of blocks.', 'Comience con una combinación lista de bloques.')}</p>
     <div class="pb-insert">${Object.entries(LAYOUTS).map(([k, v]) => `<button type="button" data-layout="${k}">${esc(tt(v.en, v.es))}</button>`).join('')}</div>
     <p class="small muted">${tt('Tip: drag photos, videos or PDFs from your computer straight onto the page.', 'Consejo: arrastre fotos, videos o PDF desde su computadora directamente a la página.')}</p>`;
  } else if (tab === 'block') {
    const b = blk(sel);
    if (!b) { P.innerHTML = `<h2 class="pb-ph">${tt('Block', 'Bloque')}</h2><p class="muted">${tt('Click a block on the page to change its settings.', 'Haga clic en un bloque de la página para cambiar su configuración.')}</p>`; return; }
    let h = `<h2 class="pb-ph">${esc(tt(BLOCKS[b.type].en, BLOCKS[b.type].es))}</h2>`;
    if (b.type === 'heading') h += field(tt('Size', 'Tamaño'), `<select id="s-level" data-setv="level"><option value="2" ${b.level === 2 ? 'selected' : ''}>${tt('Large', 'Grande')}</option><option value="3" ${b.level === 3 ? 'selected' : ''}>${tt('Medium', 'Mediano')}</option></select>`, 's-level') + biField(b, 'text', 'Heading', 'Título');
    if (b.type === 'image') h += (b.media ? `<div class="buttons"><button type="button" class="btn compact" data-img="rotate">⟳ ${tt('Rotate', 'Girar')}</button><label class="btn compact">${tt('Replace photo', 'Reemplazar foto')}<input type="file" class="sr-only" accept="image/*" data-upload="image-replace"></label></div>` + field(tt('Crop', 'Recortar'), `<select id="s-aspect" data-img-aspect>${[['orig', tt('Original', 'Original')], ['16:9', '16:9 (' + tt('wide', 'ancho') + ')'], ['4:3', '4:3'], ['1:1', tt('Square', 'Cuadrado')]].map(([v, n]) => `<option value="${v}" ${(b.aspect || 'orig') === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`, 's-aspect') + field(tt('Width', 'Ancho'), `<select id="s-size" data-setv="size">${[['half', tt('Half', 'Mitad')], ['wide', tt('Content width', 'Ancho del contenido')], ['full', tt('Edge to edge', 'De borde a borde')]].map(([v, n]) => `<option value="${v}" ${b.size === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`, 's-size') : '') + biField(b, 'alt', 'Photo description for screen readers', 'Descripción para lectores de pantalla') + biField(b, 'caption', 'Caption', 'Pie de foto') + libPicker(b);
    if (b.type === 'gallery') h += b.items.length ? b.items.map((it, n) => `<div class="pb-gal-set"><img src="" data-media="${it.media}" alt=""><div>${['en', 'es'].map(l => field(`${tt('Photo', 'Foto')} ${n + 1}: ${tt('description', 'descripción')} (${l === 'en' ? 'English' : 'Español'})`, `<input id="g-${n}-${l}" data-galalt="${n}" data-l="${l}" value="${esc(it.alt[l])}">`, `g-${n}-${l}`)).join('')}</div></div>`).join('') : `<p class="muted">${tt('Add photos on the page.', 'Agregue fotos en la página.')}</p>`;
    if (b.type === 'video') h += (b.media ? `<p class="small">${tt('Uploaded video', 'Video subido')} · <button type="button" class="btn compact" data-video-clear>${tt('Remove video', 'Quitar video')}</button></p>` : field(tt('YouTube or Vimeo link', 'Enlace de YouTube o Vimeo'), `<input id="s-link" data-setraw="link" value="${esc(b.link)}" placeholder="https://youtu.be/…">`, 's-link')) + biField(b, 'title', 'Video title (read aloud to screen reader users)', 'Título del video (para lectores de pantalla)') + biField(b, 'caption', 'Caption', 'Pie de video')
      + (b.media ? `<h3 class="pb-ph3">${tt('Closed captions', 'Subtítulos')}</h3><p class="small muted">${tt('Upload a captions file (.vtt) so the video is accessible.', 'Suba un archivo de subtítulos (.vtt) para que el video sea accesible.')}</p>${['en', 'es'].map(l => `<label class="btn compact">${b.tracks?.[l] ? '✓ ' : ''}${l === 'en' ? tt('English captions', 'Subtítulos en inglés') : tt('Spanish captions', 'Subtítulos en español')}<input type="file" class="sr-only" accept=".vtt,text/vtt" data-track="${l}"></label>`).join(' ')}` : '');
    if (b.type === 'textimage') h += field(tt('Photo position', 'Posición de la foto'), `<select id="s-side" data-setv="side"><option value="right" ${b.side === 'right' ? 'selected' : ''}>${tt('Right', 'Derecha')}</option><option value="left" ${b.side === 'left' ? 'selected' : ''}>${tt('Left', 'Izquierda')}</option></select>`, 's-side') + (b.media ? `<label class="btn compact">${tt('Replace photo', 'Reemplazar foto')}<input type="file" class="sr-only" accept="image/*" data-upload="textimage"></label>` : '') + biField(b, 'alt', 'Photo description for screen readers', 'Descripción para lectores de pantalla') + libPicker(b);
    if (b.type === 'button') h += biField(b, 'label', 'Button text', 'Texto del botón') + field(tt('Goes to', 'Lleva a'), `<select id="s-href" data-setv="href">${pageOptions(b.href)}</select>`, 's-href') + field(tt('…or type an address', '…o escriba una dirección'), `<input id="s-href2" data-setraw="href" value="${esc(b.href)}">`, 's-href2') + field(tt('Style', 'Estilo'), `<select id="s-style" data-setv="style"><option value="primary" ${b.style !== 'outline' ? 'selected' : ''}>${tt('Filled', 'Relleno')}</option><option value="outline" ${b.style === 'outline' ? 'selected' : ''}>${tt('Outline', 'Contorno')}</option></select>`, 's-style');
    if (b.type === 'file') h += biField(b, 'name', 'Document name', 'Nombre del documento') + (b.media ? `<label class="btn compact">${tt('Replace document', 'Reemplazar documento')}<input type="file" class="sr-only" data-upload="file"></label>` : '');
    if (b.type === 'collapsible') h += biField(b, 'title', 'Question or heading', 'Pregunta o título') + biField(b, 'body', 'Answer', 'Respuesta', true);
    if (b.type === 'callout') h += field(tt('Color', 'Color'), `<select id="s-tone" data-setv="tone"><option value="gold" ${b.tone === 'gold' ? 'selected' : ''}>${tt('Gold', 'Dorado')}</option><option value="blue" ${b.tone === 'blue' ? 'selected' : ''}>${tt('Blue', 'Azul')}</option><option value="green" ${b.tone === 'green' ? 'selected' : ''}>${tt('Green', 'Verde')}</option></select>`, 's-tone') + biField(b, 'text', 'Text', 'Texto', true);
    if (b.type === 'spacer') h += field(tt('Height', 'Altura'), `<input id="s-size2" type="range" min="8" max="160" step="8" value="${b.size}" data-setv="size">`, 's-size2');
    const raw = (key, en, sp, ta = false, type = 'text') => field(tt(en, sp), ta ? `<textarea id="s-${key}" data-setraw="${key}" rows="4">${esc(b[key])}</textarea>` : `<input id="s-${key}" type="${type}" data-setraw="${key}" value="${esc(b[key])}">`, 's-' + key);
    const hint = (en, sp) => `<p class="small muted">${tt(en, sp)}</p>`;
    if (b.type === 'contact') h += raw('name', 'Teacher name', 'Nombre del docente') + biField(b, 'role', 'Role (e.g. 3rd grade, Room 12)', 'Cargo (p. ej. 3.er grado, salón 12)') + raw('email', 'Email', 'Correo', false, 'email') + raw('phone', 'Phone (optional)', 'Teléfono (opcional)', false, 'tel') + biField(b, 'hours', 'Office hours (optional)', 'Horario de atención (opcional)')
      + `<label class="btn compact">${b.media ? tt('Replace photo', 'Reemplazar foto') : tt('Add a photo', 'Agregar foto')}<input type="file" class="sr-only" accept="image/*" data-upload="contact"></label>` + (b.media ? biField(b, 'alt', 'Photo description', 'Descripción de la foto') : '');
    if (b.type === 'table') h += biField(b, 'caption', 'Table title (e.g. Daily schedule)', 'Título de la tabla (p. ej. Horario diario)') + hint('One row per line. Separate columns with |. The first line is the header, e.g. “Time | Subject”.', 'Una fila por línea. Separe columnas con |. La primera línea es el encabezado, p. ej. “Hora | Materia”.') + biField(b, 'rows', 'Rows', 'Filas', true);
    if (b.type === 'checklist') h += biField(b, 'title', 'Title (e.g. Supply list)', 'Título (p. ej. Lista de útiles)') + hint('One item per line. Families can check items off on their phone.', 'Un elemento por línea. Las familias pueden marcarlos en su teléfono.') + biField(b, 'items', 'Items', 'Elementos', true);
    if (b.type === 'links') h += hint('One link per line: Label | address. Example: Class reading list | page.html?id=…', 'Un enlace por línea: Texto | dirección. Ejemplo: Lista de lectura | page.html?id=…') + biField(b, 'items', 'Links', 'Enlaces', true);
    if (b.type === 'dates') h += hint('One date per line: YYYY-MM-DD | what happens. Past dates hide automatically.', 'Una fecha por línea: AAAA-MM-DD | qué pasa. Las fechas pasadas se ocultan solas.') + biField(b, 'items', 'Dates', 'Fechas', true);
    if (b.type === 'signup') h += biField(b, 'title', 'Title (e.g. Conference sign-up)', 'Título (p. ej. Inscripción a conferencias)') + biField(b, 'note', 'Instructions (optional)', 'Instrucciones (opcional)', true) + hint('Time slots are the same in both languages. One per line, e.g. Oct 16, 3:30 PM.', 'Los horarios son iguales en ambos idiomas. Uno por línea, p. ej. 16 oct, 3:30 PM.') + raw('slots', 'Time slots', 'Horarios', true) + raw('capacity', 'People per slot', 'Personas por horario', false, 'number');
    if (b.type === 'text') h += `<p class="small muted">${tt('Type on the page. Use the toolbar for bold, lists and links. Switch “Editing” at the top to write the Spanish version.', 'Escriba en la página. Use la barra para negrita, listas y enlaces. Cambie “Editando” arriba para escribir la versión en español.')}</p>`;
    const iss = blockIssues(b); if (iss.length) h += `<ul class="pb-block-issues">${iss.map(i => `<li>✗ ${esc(tt(i.en, i.es))}</li>`).join('')}</ul>`;
    h += `<div class="buttons" style="margin-top:14px"><button type="button" class="btn compact primary" data-tab="insert">+ ${tt('Add another block', 'Agregar otro bloque')}</button><button type="button" class="btn compact" data-act-side="dup">⧉ ${tt('Duplicate', 'Duplicar')}</button><button type="button" class="btn compact" data-act-side="del">✕ ${tt('Delete', 'Eliminar')}</button></div>`;
    P.innerHTML = h; hydrateBlocks(P);
  } else if (tab === 'pages') {
    const pages = demoItems().filter(x => x.kind === 'page' && x.blocks);
    const st = x => x.status === 'draft' ? tt('Draft', 'Borrador') : x.status === 'review' ? tt('Awaiting approval', 'Pendiente de aprobación') : tt('Live', 'Publicado');
    P.innerHTML = `<h2 class="pb-ph">${tt('Pages', 'Páginas')}</h2><button type="button" class="btn compact primary" id="pb-new">+ ${tt('New page', 'Página nueva')}</button>
     ${pages.length ? `<ul class="pb-pagelist">${pages.map(x => `<li class="${x.id === page.id ? 'current' : ''}"><div><strong>${esc(es ? x.titleEs || x.title : x.title || x.titleEs || tt('Untitled', 'Sin título'))}</strong><span class="small muted">${esc(scopeName(x.scope))} · ${st(x)}</span></div><div class="buttons"><button type="button" class="btn compact" data-open="${x.id}">${tt('Open', 'Abrir')}</button>${x.status !== 'draft' && x.status !== 'review' ? `<a class="btn compact" href="page.html?id=${encodeURIComponent(x.id)}${es ? '&lang=es' : ''}">${tt('View', 'Ver')}</a>` : ''}<button type="button" class="btn compact" data-duppage="${x.id}">${tt('Duplicate', 'Duplicar')}</button><button type="button" class="btn compact" data-delpage="${x.id}">${tt('Delete', 'Eliminar')}</button></div></li>`).join('')}</ul>` : `<p class="muted">${tt('No saved pages yet.', 'Aún no hay páginas guardadas.')}</p>`}`;
  } else if (tab === 'theme') {
    const ok = contrast(page.theme.accent) >= 4.5;
    P.innerHTML = `<h2 class="pb-ph">${tt('Theme', 'Tema')}</h2><p class="small muted">${tt('The accent color is used for headings, buttons and callouts on this page.', 'El color de acento se usa en títulos, botones y destacados de esta página.')}</p>
     <div class="pb-swatches" role="radiogroup" aria-label="${esc(tt('Accent color', 'Color de acento'))}">${SWATCHES.map(([c, en, sp]) => `<button type="button" role="radio" aria-checked="${page.theme.accent === c}" data-accent="${c}" style="--sw:${c}" aria-label="${esc(tt(en, sp))}"><span></span>${esc(tt(en, sp))}</button>`).join('')}</div>
     ${field(tt('Custom color', 'Color personalizado'), `<input id="s-accent" type="color" value="${esc(page.theme.accent)}">`, 's-accent')}
     <p class="small ${ok ? '' : 'notice error'}">${ok ? '✓ ' + tt('Readable: white text on this color meets accessibility contrast.', 'Legible: el texto blanco sobre este color cumple el contraste de accesibilidad.') : tt('Too light: white button text would be hard to read. Choose a darker color.', 'Demasiado claro: el texto blanco sería difícil de leer. Elija un color más oscuro.')}</p>`;
  }
});

// ── Checks, top bar, messages
function pageIssues() {
  const list = [];
  if (!page.title.en.trim() || !page.title.es.trim()) list.push({ en: 'Page title in English and Spanish', es: 'Título de la página en inglés y español' });
  if (!!page.intro.en.trim() !== !!page.intro.es.trim()) list.push({ en: 'Introduction in both languages (or neither)', es: 'Introducción en ambos idiomas (o en ninguno)' });
  if (!page.blocks.length) list.push({ en: 'Add at least one block', es: 'Agregue al menos un bloque' });
  if (contrast(page.theme.accent) < 4.5) list.push({ en: 'Pick a darker theme color', es: 'Elija un color de tema más oscuro' });
  page.blocks.forEach((b, i) => blockIssues(b).forEach(x => list.push({ ...x, block: b.id, n: i + 1 })));
  return list;
}
function renderChecks() {
  const list = pageIssues();
  $('pb-checks').innerHTML = `<h3 class="pb-ph3">${list.length ? tt(`${list.length} thing${list.length > 1 ? 's' : ''} to finish before publishing`, `${list.length} pendiente${list.length > 1 ? 's' : ''} antes de publicar`) : '✓ ' + tt('Ready to publish', 'Listo para publicar')}</h3>${list.length ? `<ul>${list.slice(0, 8).map(x => `<li>${x.block ? `<button type="button" class="pb-linkish" data-goto="${x.block}">${tt('Block', 'Bloque')} ${x.n}</button>: ` : ''}${esc(tt(x.en, x.es))}</li>`).join('')}</ul>` : `<p class="small muted">${tt('Both languages complete, every photo and video described.', 'Ambos idiomas completos, cada foto y video descritos.')}</p>`}`;
  syncTop(list.length);
}
function syncTop(nIssues = pageIssues().length) {
  $('pb-undo').disabled = !undo.length; $('pb-redo').disabled = !redo.length;
  $('pb-publish').textContent = role === 'editor' ? tt('Submit for approval', 'Enviar para aprobación') : tt('Publish', 'Publicar');
  $('pb-publish').disabled = nIssues > 0;
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.device === device)));
  document.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
}
function refreshStatic(b) { if (!STATIC_BLOCKS.includes(b.type)) return; const host = document.querySelector(`[data-bid="${b.id}"] .pb-body`); if (host) { host.innerHTML = editorFor(b); hydrateBlocks(host); } }
function msg(html, err) { $('pb-msg').innerHTML = html; $('pb-msg').className = 'pb-msg' + (err ? ' notice error' : html ? ' notice' : ''); }
function renderAll() { renderCanvas(); renderPanel(); }
function selectBlock(id, toTab = true) {
  if (sel === id) return; sel = id; if (toTab) tab = 'block';
  document.querySelectorAll('.pb-blk').forEach(el => el.classList.toggle('sel', el.dataset.bid === id));
  const b = blk(id); if (b && (b.type === 'text' || b.type === 'textimage')) { const body = document.querySelector(`[data-bid="${id}"] .pb-body`); if (body && !body.querySelector('.pb-fmt')) body.insertAdjacentHTML('afterbegin', toolbar()); }
  renderPanel();
}

// ── Save / publish
function toItem(status) {
  const items = demoItems(), old = page.id ? items.find(i => i.id === page.id) : null;
  const id = page.id || 'pb-' + Date.now().toString(36);
  const item = { id, kind: 'page', scope: page.scope, builder: true, status, publishedAt: new Date().toISOString(),
    title: page.title.en.trim(), titleEs: page.title.es.trim(), body: page.intro.en.trim(), bodyEs: page.intro.es.trim(), sections: [], blocks: JSON.parse(JSON.stringify(page.blocks)), theme: { ...page.theme },
    versions: old ? [(({ versions, ...r }) => r)(old), ...(old.versions || [])].slice(0, 5) : [] };
  if (!saveDemoItems([item, ...items.filter(i => i.id !== id)])) { msg(tt('This browser blocked saving. Try a regular (not private) window.', 'Este navegador bloqueó el guardado. Pruebe una ventana normal (no privada).'), true); return null; }
  page.id = id; saveWork(); return item;
}

// ── Events
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  let el;
  if ((el = q('[data-pick-media]'))) { const b = blk(sel); if (!b) return; snapshot(); const m = readJSON(WS_KEYS.mediaMeta, {})[el.dataset.pickMedia];
    b.media = b.original = el.dataset.pickMedia; b.rot = 0; b.aspect = 'orig'; if (m && !String(b.alt?.en || '').trim() && !String(b.alt?.es || '').trim()) b.alt = { en: m.en || '', es: m.es || '' };
    renderAll(); saveWork(); msg(tt('Photo added from the library.', 'Foto agregada desde la biblioteca.')); return; }
  if ((el = q('[data-lang]'))) { lang = el.dataset.lang; renderAll(); return; }
  if ((el = q('[data-device]'))) { device = el.dataset.device; renderCanvas(); syncTop(); return; }
  if ((el = q('[data-role]'))) { role = el.dataset.role; try { localStorage.setItem(ROLE_KEY, role); } catch {} syncTop(); return; }
  if ((el = q('[data-tab]'))) { tab = el.dataset.tab; renderPanel(); return; }
  if ((el = q('[data-insert]'))) { insertBlock(newBlock(el.dataset.insert)); return; }
  if ((el = q('[data-layout]'))) { snapshot(); LAYOUTS[el.dataset.layout].blocks.forEach(k => page.blocks.push(newBlock(k))); sel = page.blocks[page.blocks.length - LAYOUTS[el.dataset.layout].blocks.length].id; tab = 'block'; renderAll(); saveWork(); return; }
  if ((el = q('[data-act]'))) { const id = el.closest('[data-bid]').dataset.bid, a = el.dataset.act; a === 'up' ? moveBlock(id, -1) : a === 'down' ? moveBlock(id, 1) : a === 'dup' ? dupBlock(id) : delBlock(id); return; }
  if ((el = q('[data-act-side]'))) { el.dataset.actSide === 'dup' ? dupBlock(sel) : delBlock(sel); return; }
  if ((el = q('[data-goto]'))) { sel = null; selectBlock(el.dataset.goto); document.querySelector(`[data-bid="${el.dataset.goto}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  if ((el = q('[data-gal-del]'))) { const b = blk(el.closest('[data-bid]').dataset.bid); snapshot(); b.items.splice(+el.dataset.galDel, 1); renderAll(); saveWork(); return; }
  if ((el = q('[data-img="rotate"]'))) { const b = blk(sel); snapshot(); b.original = b.original || b.media; b.rot = ((b.rot || 0) + 90) % 360; await transformImage(b); renderAll(); saveWork(); return; }
  if ((el = q('[data-video-clear]'))) { const b = blk(sel); snapshot(); b.media = ''; b.tracks = { en: '', es: '' }; renderAll(); saveWork(); return; }
  if ((el = q('[data-accent]'))) { snapshot(); page.theme.accent = el.dataset.accent; renderAll(); saveWork(); return; }
  if ((el = q('#pb-new'))) { snapshot(); page = blankPage(page.scope); sel = null; tab = 'insert'; renderAll(); saveWork(); msg(''); return; }
  if ((el = q('[data-open]'))) { const x = demoItems().find(i => i.id === el.dataset.open); if (x) { snapshot(); page = { id: x.id, scope: x.scope, title: { en: x.title, es: x.titleEs }, intro: { en: x.body || '', es: x.bodyEs || '' }, theme: x.theme || { accent: '#0b2545' }, blocks: JSON.parse(JSON.stringify(x.blocks || [])) }; $('pb-scope').value = x.scope; sel = null; tab = 'insert'; renderAll(); saveWork(); } return; }
  if ((el = q('[data-duppage]'))) { const x = demoItems().find(i => i.id === el.dataset.duppage); if (x) { snapshot(); page = { id: null, scope: x.scope, title: { en: x.title + ' (copy)', es: x.titleEs + ' (copia)' }, intro: { en: x.body || '', es: x.bodyEs || '' }, theme: x.theme || { accent: '#0b2545' }, blocks: JSON.parse(JSON.stringify(x.blocks || [])).map(b => ({ ...b, id: newBlock(b.type).id })) }; sel = null; tab = 'insert'; renderAll(); saveWork(); msg(tt('Copy made. Choose the site at the top for this copy (another class or school), edit it, then save or publish.', 'Copia creada. Elija arriba el sitio para esta copia (otra clase o escuela), edítela y luego guárdela o publíquela.')); $('pb-scope').focus(); } return; }
  if ((el = q('[data-delpage]'))) { saveDemoItems(demoItems().filter(i => i.id !== el.dataset.delpage)); if (page.id === el.dataset.delpage) page.id = null; renderPanel(); msg(tt('Page deleted.', 'Página eliminada.')); return; }
  if ((el = q('#pb-undo'))) { doUndo(); return; }
  if ((el = q('#pb-redo'))) { doRedo(); return; }
  if ((el = q('#pb-save'))) { const it = toItem('draft'); if (it) { msg(tt('Draft saved. Only you can see it until it is published.', 'Borrador guardado. Solo usted lo ve hasta que se publique.')); renderPanel(); } return; }
  if ((el = q('#pb-publish'))) { if (pageIssues().length) return; const it = toItem(role === 'editor' ? 'review' : 'published'); if (!it) return;
    msg(role === 'editor' ? tt('Submitted for approval. Switch the role to “District publisher” and publish it, or approve it from the staff workspace.', 'Enviado para aprobación. Cambie el rol a “Publicador del distrito” y publíquelo, o apruébelo desde el espacio del personal.')
      : `${tt('Published!', '¡Publicado!')} <a href="page.html?id=${encodeURIComponent(it.id)}${es ? '&lang=es' : ''}">${tt('Open the live page', 'Abrir la página publicada')}</a> · ${tt('It is also listed on', 'También aparece en')} <a href="${page.scope === 'district' ? route('index') : schoolURL(page.scope)}">${esc(scopeName(page.scope))}</a>.`);
    renderPanel(); return; }
  if ((el = q('#pb-preview'))) { openPreview(lang); return; }
  if ((el = q('[data-plang]'))) { openPreview(el.dataset.plang); return; }
  if ((el = q('#pb-dialog-close'))) { $('pb-dialog').close(); return; }
  if ((el = q('[data-cmd]'))) { handleCmd(el); return; }
  if ((el = q('.pb-blk'))) { selectBlock(el.dataset.bid); return; }
});
document.addEventListener('mousedown', e => { if (e.target.closest('.pb-fmt button')) e.preventDefault(); });
let savedRange = null;
function handleCmd(el) {
  const c = el.dataset.cmd, box = el.closest('.pb-fmt').querySelector('.pb-linkbox');
  if (c === 'link') { const s = getSelection(); savedRange = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; box.hidden = !box.hidden; if (!box.hidden) box.querySelector('input').focus(); return; }
  if (c === 'applyLink') { const url = box.querySelector('input').value.trim(); if (savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } if (url) document.execCommand('createLink', false, url); box.hidden = true; captureRich(el.closest('.pb-body').querySelector('.pb-rich')); return; }
  document.execCommand(c, false, null); captureRich(el.closest('.pb-body').querySelector('.pb-rich'));
}
function captureRich(node) { if (!node) return; const b = blk(node.closest('[data-bid]').dataset.bid); typingSnapshot(); b[node.dataset.rich][lang] = sanitize(node.innerHTML); renderChecks(); }

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'pb-title' || el.id === 'pb-intro') { typingSnapshot(); page[el.id === 'pb-title' ? 'title' : 'intro'][lang] = el.value; renderChecks(); return; }
  if (el.matches('.pb-rich')) { captureRich(el); return; }
  const host = el.closest('[data-bid]');
  if (host && el.dataset.k) { const b = blk(host.dataset.bid); typingSnapshot(); if (el.dataset.raw) b[el.dataset.k] = el.value; else b[el.dataset.k][lang] = el.value; renderChecks(); return; }
  if (el.dataset.set) { const b = blk(sel); typingSnapshot(); b[el.dataset.set][el.dataset.l] = el.value; refreshStatic(b); const canvasEl = document.querySelector(`[data-bid="${sel}"] [data-k="${el.dataset.set}"]`); if (canvasEl && el.dataset.l === lang) canvasEl.value = el.value; renderChecks(); return; }
  if (el.dataset.galalt !== undefined) { const b = blk(sel); typingSnapshot(); b.items[+el.dataset.galalt].alt[el.dataset.l] = el.value; renderChecks(); return; }
  if (el.dataset.setraw) { const b = blk(sel); typingSnapshot(); b[el.dataset.setraw] = el.dataset.setraw === 'capacity' ? Math.max(1, +el.value || 1) : el.dataset.setraw === 'slots' ? el.value : el.value.trim(); refreshStatic(b); renderChecks(); return; }
  if (el.id === 's-accent') { typingSnapshot(); page.theme.accent = el.value; document.querySelector('.pb-page').style.setProperty('--pb-accent', el.value); renderChecks(); return; }
  if (el.dataset.setv === 'size' && el.type === 'range') { const b = blk(sel); typingSnapshot(); b.size = +el.value; renderCanvas(); return; }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'pb-scope') { snapshot(); page.scope = el.value; renderAll(); saveWork(); return; }
  if (el.dataset.setv && el.type !== 'range') { const b = blk(sel); snapshot(); b[el.dataset.setv] = el.dataset.setv === 'level' ? +el.value : el.value; renderAll(); saveWork(); return; }
  if (el.dataset.setraw || (el.dataset.k === 'link')) { renderCanvas(); return; }
  if (el.id === 's-accent') { renderAll(); saveWork(); return; }
  if (el.dataset.imgAspect !== undefined) { const b = blk(sel); snapshot(); b.original = b.original || b.media; b.aspect = el.value; await transformImage(b); renderAll(); saveWork(); return; }
  if (el.dataset.track) { const f = el.files[0]; if (!f) return; const b = blk(sel); snapshot(); b.tracks = b.tracks || { en: '', es: '' }; b.tracks[el.dataset.track] = await putMedia(f, f.name); renderAll(); saveWork(); msg(tt('Captions added.', 'Subtítulos agregados.')); return; }
  if (el.dataset.upload) {
    const files = [...el.files]; if (!files.length) return; const kind = el.dataset.upload, b = blk(el.closest('[data-bid]')?.dataset.bid || sel);
    msg(tt('Uploading…', 'Subiendo…'));
    if (kind === 'image' || kind === 'image-replace' || kind === 'textimage') { const f = files[0]; if (tooBig(f, 15)) return; snapshot(); b.media = b.original = await putMedia(await processImage(f), f.name); b.rot = 0; b.aspect = 'orig'; }
    if (kind === 'contact') { const f = files[0]; if (tooBig(f, 15)) return; snapshot(); b.media = await putMedia(await processImage(f, 600), f.name); }
    if (kind === 'gallery') { snapshot(); for (const f of files) { if (!f.type.startsWith('image/') || tooBig(f, 15)) continue; b.items.push({ media: await putMedia(await processImage(f, 1600), f.name), alt: L() }); } }
    if (kind === 'video') { const f = files[0]; if (tooBig(f, 250)) return; snapshot(); b.media = await putMedia(f, f.name); }
    if (kind === 'file') { const f = files[0]; if (tooBig(f, 25)) return; snapshot(); b.media = await putMedia(f, f.name); b.fileName = f.name; if (!b.name.en) b.name.en = f.name.replace(/\.[^.]+$/, ''); }
    msg(''); renderAll(); saveWork();
  }
});
document.addEventListener('focusin', e => { const h = e.target.closest?.('[data-bid]'); if (h && h.dataset.bid !== sel) selectBlock(h.dataset.bid); });
document.addEventListener('keydown', e => {
  const editing = e.target.closest('input,textarea,select,[contenteditable="true"]');
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !editing) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
});

// Drag to reorder blocks, and drop files from the computer
let dragId = null;
document.addEventListener('dragstart', e => { const h = e.target.closest('.pb-drag'); if (!h) return; dragId = h.closest('[data-bid]').dataset.bid; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
document.addEventListener('dragover', e => { if (!e.target.closest('#pb-canvas')) return; e.preventDefault(); document.querySelectorAll('.pb-blk.drop').forEach(x => x.classList.remove('drop')); e.target.closest('.pb-blk')?.classList.add('drop'); });
document.addEventListener('dragleave', e => { e.target.closest?.('.pb-blk')?.classList.remove('drop'); });
document.addEventListener('drop', async e => {
  if (!e.target.closest('#pb-canvas')) return; e.preventDefault(); document.querySelectorAll('.pb-blk.drop').forEach(x => x.classList.remove('drop'));
  const target = e.target.closest('.pb-blk')?.dataset.bid;
  if (e.dataTransfer.files?.length) { await addFiles([...e.dataTransfer.files], target || (page.blocks.at(-1)?.id)); dragId = null; return; }
  if (dragId && target && dragId !== target) { snapshot(); const from = page.blocks.findIndex(x => x.id === dragId), mv = page.blocks.splice(from, 1)[0], to = page.blocks.findIndex(x => x.id === target); page.blocks.splice(to + (from <= to ? 1 : 0), 0, mv); renderCanvas(); saveWork(); }
  dragId = null;
});

function openPreview(l) {
  const sp = l === 'es', d = $('pb-dialog');
  $('pb-dialog-body').innerHTML = `<div class="pb-preview ${device}"><div class="eyebrow">${esc(scopeName(page.scope))}</div><h1 class="article-title">${esc(page.title[l] || '…')}</h1>${page.intro[l] ? `<p class="content-body">${esc(page.intro[l])}</p>` : ''}${renderBlocks(page.blocks, sp, page.theme)}</div>`;
  d.querySelectorAll('[data-plang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plang === l)));
  if (!d.open) d.showModal(); hydrateBlocks($('pb-dialog-body'));
}

// ── Start
(async () => {
  try { schools = await (await fetch('schools-data.json')).json(); } catch {}
  $('pb-scope').innerHTML = `<option value="district">${tt('District site', 'Sitio del distrito')}</option>` + schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  const params = new URLSearchParams(location.search), openId = params.get('id');
  const x = openId && demoItems().find(i => i.id === openId);
  if (x) page = { id: x.id, scope: x.scope, title: { en: x.title, es: x.titleEs }, intro: { en: x.body || '', es: x.bodyEs || '' }, theme: x.theme || { accent: '#0b2545' }, blocks: JSON.parse(JSON.stringify(x.blocks || [])) };
  else if (params.get('layout') && LAYOUTS[params.get('layout')]) { page = blankPage(params.get('site') || 'district'); LAYOUTS[params.get('layout')].blocks.forEach(k => page.blocks.push(newBlock(k))); saveWork(); }
  else if (params.get('new')) { page = blankPage(params.get('site') || 'district'); saveWork(); }
  else { try { const w = JSON.parse(localStorage.getItem(WORK_KEY) || 'null'); if (w && w.blocks) page = w; } catch {} if (params.get('site')) page.scope = params.get('site'); }
  $('pb-scope').value = page.scope;
  renderAll(); syncTop();
})();

// ── Builder styles
const st = document.createElement('style');
st.textContent = `.pb-app{padding:16px 16px 48px;max-width:1500px;margin:0 auto}
.pb-top{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between;background:#fff;border:1px solid #dde6ee;border-radius:14px;padding:10px 14px;position:sticky;top:0;z-index:5}
.pb-top-group{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.pb-mini{font-size:.78rem;font-weight:700;color:#41505f;text-transform:uppercase;letter-spacing:.06em}
.pb-top select{max-width:220px}.pb-app [aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
.pb-msg:empty{display:none}.pb-msg{margin:10px 0}
.pb-main{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;margin-top:14px;align-items:start}
.pb-stage{background:#e9eef3;border-radius:16px;padding:22px;min-height:70vh}
.pb-paper{background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(11,37,69,.12);padding:28px 32px 40px;max-width:860px;margin:0 auto;transition:max-width .25s}.pb-paper.phone{max-width:390px;padding:20px 18px 30px}
.pb-in{width:100%;border:1px dashed transparent;border-radius:8px;background:transparent;font:inherit;color:inherit;padding:4px 6px}.pb-in:hover,.pb-in:focus{border-color:#9db4c9;background:#fbfdff;outline:none}
.pb-title{font-size:2rem;font-weight:800;letter-spacing:-.02em;color:var(--navy)}.pb-intro{font-size:1.05rem;resize:vertical}.pb-in-h2{font-size:1.6rem;font-weight:800;color:var(--pb-accent)}.pb-in-h3{font-size:1.25rem;font-weight:800;color:var(--pb-accent)}
.pb-strong{font-weight:700}.pb-cap{font-size:.88rem;color:#5b6b7b;margin-top:6px}
.pb-head{margin-bottom:18px;border-bottom:1px solid #eef2f6;padding-bottom:12px}
.pb-empty{border:2px dashed #b9c9d8;border-radius:14px;padding:34px;text-align:center;color:#41505f}
.pb-blk{position:relative;border:2px solid transparent;border-radius:12px;padding:6px 8px;margin:8px -10px}.pb-blk:hover{border-color:#d3dee8}.pb-blk.sel{border-color:#145f9f}.pb-blk.warn:not(.sel){border-left-color:#d97706}.pb-blk.drop{box-shadow:0 -4px 0 #145f9f}
.pb-tools{display:none;position:absolute;top:-16px;right:10px;gap:2px;align-items:center;background:#0b2545;color:#fff;border-radius:8px;padding:2px 4px;z-index:2}.pb-blk:hover .pb-tools,.pb-blk.sel .pb-tools,.pb-blk:focus-within .pb-tools{display:flex}
.pb-tools button{background:none;border:0;color:#fff;font-size:.95rem;padding:3px 7px;cursor:pointer;border-radius:5px}.pb-tools button:disabled{opacity:.4}.pb-tools button:hover:not(:disabled){background:rgba(255,255,255,.18)}
.pb-drag{cursor:grab;padding:0 4px}.pb-type{font-size:.72rem;font-weight:700;padding:0 6px;text-transform:uppercase;letter-spacing:.05em}
.pb-rich{min-height:2.2em;padding:6px 8px;border:1px dashed transparent;border-radius:8px;line-height:1.7}.pb-rich:focus{outline:none;border-color:#9db4c9;background:#fbfdff}.pb-rich:empty:before{content:attr(data-ph);color:#8696a6}
.pb-fmt{display:flex;flex-wrap:wrap;gap:2px;margin-bottom:6px;background:#f2f6f9;border-radius:8px;padding:3px}.pb-fmt button{border:0;background:none;padding:4px 9px;border-radius:6px;cursor:pointer;font-weight:700;color:#0b2545}.pb-fmt button:hover{background:#dfe8f0}.pb-linkbox{display:flex;gap:4px;flex:1}.pb-linkbox input{flex:1;min-width:140px}
.pb-drop{display:block;border:2px dashed #9db4c9;border-radius:12px;padding:26px;text-align:center;color:#145f9f;font-weight:700;cursor:pointer;background:#f6f9fc}.pb-drop:hover,.pb-drop:focus-within{background:#eaf2fa}
.pb-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:8px}.pb-thumbs figure{position:relative;margin:0}.pb-thumbs img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}
.pb-x{position:absolute;top:4px;right:4px;border:0;border-radius:50%;width:24px;height:24px;background:rgba(11,37,69,.8);color:#fff;cursor:pointer}
.pb-embed{background:#111;color:#fff;border-radius:12px;padding:40px;text-align:center;font-weight:700}.pb-blk video{width:100%;border-radius:12px;background:#000}
.pb-filebox{display:flex;gap:8px;align-items:center;background:#f2f6f9;border-radius:10px;padding:10px}.pb-btn-edit .pb-in{color:#fff;width:auto;min-width:160px}.pb-btn-edit{display:inline-flex}
.pb-spacer-edit{background:repeating-linear-gradient(45deg,#f2f6f9,#f2f6f9 8px,#fff 8px,#fff 16px);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#5b6b7b;min-height:8px}
.pb-side{position:sticky;top:76px;max-height:calc(100vh - 96px);overflow:auto;background:#fff;border:1px solid #dde6ee;border-radius:14px;padding:14px}
.pb-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:12px}.pb-tabs button{border:0;background:#f2f6f9;border-radius:8px;padding:8px 4px;font-weight:700;cursor:pointer;color:#0b2545}.pb-tabs button.active{background:#0b2545;color:#fff}
.pb-insert{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.pb-insert button{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid #dde6ee;background:#fff;border-radius:10px;padding:12px 6px;cursor:pointer;font-weight:600;color:#0b2545}.pb-insert button span{font-size:1.4rem}.pb-insert button:hover{border-color:#145f9f;background:#f6f9fc}
.pb-side .field{margin-bottom:10px}.pb-side input:not([type=file]):not([type=range]):not([type=color]),.pb-side select,.pb-side textarea{width:100%}
.pb-gal-set{display:grid;grid-template-columns:70px 1fr;gap:8px;margin-bottom:10px}.pb-gal-set img{width:70px;height:70px;object-fit:cover;border-radius:8px}
.pb-swatches{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}.pb-swatches button{display:flex;gap:8px;align-items:center;border:1px solid #dde6ee;background:#fff;border-radius:8px;padding:6px;cursor:pointer;color:#0b2545}.pb-swatches button span{width:22px;height:22px;border-radius:50%;background:var(--sw)}.pb-swatches button[aria-checked=true]{outline:3px solid #145f9f}
.pb-pagelist{list-style:none;padding:0}.pb-pagelist li{border:1px solid #dde6ee;border-radius:10px;padding:10px;margin:8px 0}.pb-pagelist li.current{border-color:#145f9f}.pb-pagelist li div:first-child{display:flex;flex-direction:column}
.pb-checks{margin-top:16px;background:#f2f6f9;border-radius:12px;padding:12px}.pb-checks h3{margin:0 0 6px;font-size:1rem}.pb-ph{font-size:1.15rem;margin:.2em 0 .5em}.pb-ph3{font-size:1rem}.pb-checks ul,.pb-block-issues{margin:0;padding-left:18px;font-size:.9rem}.pb-block-issues{color:#b3261e}
.pb-linkish{border:0;background:none;color:#145f9f;text-decoration:underline;cursor:pointer;padding:0;font:inherit}
#pb-dialog{width:min(1000px,96vw);max-height:92vh;border:0;border-radius:16px;padding:0}#pb-dialog::backdrop{background:rgba(11,37,69,.6)}.pb-dialog-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 16px;background:#0b2545;color:#fff;position:sticky;top:0;z-index:2}
.pb-lib{margin-top:12px}.pb-lib summary{cursor:pointer;font-weight:600;color:var(--navy)}.pb-lib-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.pb-lib-item{border:1px solid #dde6ee;border-radius:10px;background:#fff;padding:4px;cursor:pointer;font:inherit;font-size:.72rem;text-align:left}.pb-lib-item:hover,.pb-lib-item:focus{border-color:var(--navy)}.pb-lib-item img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;display:block}.pb-lib-item span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.pb-static{pointer-events:none}.pb-static-hint{margin:2px 0 0}.pb-dialog-bar [aria-pressed=true]{background:var(--gold);color:#0b2545;border-color:var(--gold)}.pb-preview{padding:28px 36px;max-width:820px;margin:0 auto}.pb-preview.phone{max-width:390px;padding:20px}
@media (max-width:1000px){.pb-main{grid-template-columns:1fr}.pb-side{position:static;max-height:none}}`;
document.head.append(st);
