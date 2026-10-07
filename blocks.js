// Shared page-builder blocks: media storage, safe rich text, rendering for the live site and the builder canvas.
const DB = 'd11-demo-media', STORE = 'media';
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const escH = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Media (IndexedDB holds photos, videos and documents for this visitor only)
function db() {
  return new Promise((ok, bad) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });
}
async function tx(mode, fn) { const d = await db(); return new Promise((ok, bad) => { const t = d.transaction(STORE, mode), s = t.objectStore(STORE), r = fn(s); t.oncomplete = () => ok(r && 'result' in r ? r.result : undefined); t.onerror = () => bad(t.error); }); }
export async function putMedia(blob, name = '') { const id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); await tx('readwrite', s => s.put({ blob, name, type: blob.type, size: blob.size }, id)); return id; }
export async function getMedia(id) { try { return await tx('readonly', s => s.get(id)); } catch { return null; } }
export async function putMediaAt(id, rec) { await tx('readwrite', s => s.put(rec, id)); urlCache.delete(id); }
export async function deleteMedia(id) { try { await tx('readwrite', s => s.delete(id)); urlCache.delete(id); } catch {} }
export async function listMedia() {
  try { const keys = await tx('readonly', s => s.getAllKeys()), vals = await tx('readonly', s => s.getAll()); return keys.map((id, i) => ({ id, ...vals[i] })); } catch { return []; }
}
export async function clearMedia() { try { await tx('readwrite', s => s.clear()); } catch {} }
const urlCache = new Map();
export async function mediaURL(id) { if (urlCache.has(id)) return urlCache.get(id); const m = await getMedia(id); if (!m) return ''; const u = URL.createObjectURL(m.blob); urlCache.set(id, u); return u; }

// ── Safe rich text (bold, italic, underline, links, lists, paragraphs)
const ALLOWED = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'UL', 'OL', 'LI', 'DIV']);
export function sanitize(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = String(html || '');
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) return;
      if (n.nodeType !== 1 || !ALLOWED.has(n.tagName)) { if (n.nodeType === 1) { walk(n); n.replaceWith(...n.childNodes); } else n.remove(); return; }
      [...n.attributes].forEach(a => { if (!(n.tagName === 'A' && a.name === 'href')) n.removeAttribute(a.name); });
      if (n.tagName === 'A') { const h = n.getAttribute('href') || ''; if (!/^(https:|mailto:|tel:|[\w./#?=&-]+$)/i.test(h) || /^javascript:/i.test(h)) n.removeAttribute('href'); }
      walk(n);
    });
  };
  walk(tpl.content); return tpl.innerHTML;
}
export const plain = html => { const d = document.createElement('div'); d.innerHTML = sanitize(html); return d.textContent || ''; };

// ── Video links
export function parseVideo(url) {
  const u = String(url || '').trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); if (m) return { provider: 'youtube', id: m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (m) return { provider: 'vimeo', id: m[1] };
  return null;
}
const embedSrc = v => v.provider === 'youtube' ? `https://www.youtube-nocookie.com/embed/${v.id}` : `https://player.vimeo.com/video/${v.id}`;

// ── Block catalog (used by the builder's Insert panel)
export const BLOCKS = {
  heading: { icon: 'H', en: 'Heading', es: 'Título' },
  text: { icon: '¶', en: 'Text', es: 'Texto' },
  image: { icon: '🖼', en: 'Photo', es: 'Foto' },
  gallery: { icon: '▦', en: 'Photo gallery', es: 'Galería' },
  video: { icon: '▶', en: 'Video', es: 'Video' },
  textimage: { icon: '◧', en: 'Text + photo', es: 'Texto + foto' },
  button: { icon: '⬭', en: 'Button', es: 'Botón' },
  file: { icon: '📄', en: 'Document', es: 'Documento' },
  collapsible: { icon: '▾', en: 'Collapsible (FAQ)', es: 'Desplegable (FAQ)' },
  callout: { icon: '!', en: 'Callout', es: 'Destacado' },
  divider: { icon: '—', en: 'Divider', es: 'Separador' },
  spacer: { icon: '↕', en: 'Spacer', es: 'Espacio' },
  contact: { icon: '👤', en: 'Teacher contact card', es: 'Tarjeta del docente' },
  table: { icon: '▤', en: 'Schedule or table', es: 'Horario o tabla' },
  checklist: { icon: '☑', en: 'Checklist (supply list)', es: 'Lista (útiles)' },
  links: { icon: '🔗', en: 'Resource links', es: 'Enlaces de recursos' },
  dates: { icon: '📅', en: 'Upcoming dates', es: 'Próximas fechas' },
  signup: { icon: '✍', en: 'Sign-up sheet', es: 'Hoja de inscripción' }
};
export const STATIC_BLOCKS = ['contact', 'table', 'checklist', 'links', 'dates', 'signup'];
const lines = x => String(x || '').split('\n').map(y => y.trim()).filter(Boolean);
const cells = line => line.split('|').map(y => y.trim());
const L = () => ({ en: '', es: '' });
export function newBlock(type) {
  const id = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), b = { id, type };
  if (type === 'heading') Object.assign(b, { text: L(), level: 2 });
  if (type === 'text') Object.assign(b, { html: L() });
  if (type === 'image') Object.assign(b, { media: '', alt: L(), caption: L(), size: 'wide' });
  if (type === 'gallery') Object.assign(b, { items: [] });
  if (type === 'video') Object.assign(b, { media: '', link: '', title: L(), caption: L(), tracks: { en: '', es: '' } });
  if (type === 'textimage') Object.assign(b, { html: L(), media: '', alt: L(), side: 'right' });
  if (type === 'button') Object.assign(b, { label: L(), href: '', style: 'primary' });
  if (type === 'file') Object.assign(b, { media: '', name: L(), fileName: '' });
  if (type === 'collapsible') Object.assign(b, { title: L(), body: L() });
  if (type === 'callout') Object.assign(b, { text: L(), tone: 'gold' });
  if (type === 'spacer') Object.assign(b, { size: 32 });
  if (type === 'contact') Object.assign(b, { name: '', role: L(), email: '', phone: '', hours: L(), media: '', alt: L() });
  if (type === 'table') Object.assign(b, { caption: L(), rows: L() });
  if (type === 'checklist') Object.assign(b, { title: L(), items: L() });
  if (type === 'links') Object.assign(b, { items: L() });
  if (type === 'dates') Object.assign(b, { items: L() });
  if (type === 'signup') Object.assign(b, { title: L(), note: L(), slots: '', capacity: 1 });
  return b;
}

// ── Accessibility & completeness checks
export function blockIssues(b) {
  const both = o => o && String(o.en || '').trim() && String(o.es || '').trim();
  const bothHtml = o => o && plain(o.en).trim() && plain(o.es).trim();
  const issues = [];
  const add = (en, es) => issues.push({ en, es });
  if (b.type === 'heading' && !both(b.text)) add('Heading needs English and Spanish', 'El título necesita inglés y español');
  if (b.type === 'text' && !bothHtml(b.html)) add('Text needs English and Spanish', 'El texto necesita inglés y español');
  if ((b.type === 'image' || b.type === 'textimage') && !b.media) add('Add a photo', 'Agregue una foto');
  if ((b.type === 'image' || b.type === 'textimage') && b.media && !both(b.alt)) add('Describe the photo in both languages', 'Describa la foto en ambos idiomas');
  if (b.type === 'textimage' && !bothHtml(b.html)) add('Text needs English and Spanish', 'El texto necesita inglés y español');
  if (b.type === 'gallery' && !b.items.length) add('Add photos to the gallery', 'Agregue fotos a la galería');
  if (b.type === 'gallery' && b.items.some(i => !both(i.alt))) add('Describe every gallery photo in both languages', 'Describa cada foto de la galería en ambos idiomas');
  if (b.type === 'video' && !b.media && !parseVideo(b.link)) add('Upload a video or paste a YouTube/Vimeo link', 'Suba un video o pegue un enlace de YouTube/Vimeo');
  if (b.type === 'video' && !both(b.title)) add('Give the video a title in both languages', 'Dé un título al video en ambos idiomas');
  if (b.type === 'button' && (!both(b.label) || !b.href)) add('Button needs a label in both languages and a destination', 'El botón necesita texto en ambos idiomas y un destino');
  if (b.type === 'file' && (!b.media || !both(b.name))) add('Upload the document and name it in both languages', 'Suba el documento y nómbrelo en ambos idiomas');
  if (b.type === 'collapsible' && (!both(b.title) || !both(b.body))) add('Question and answer need both languages', 'La pregunta y la respuesta necesitan ambos idiomas');
  if (b.type === 'callout' && !both(b.text)) add('Callout needs English and Spanish', 'El destacado necesita inglés y español');
  const sameLines = o => lines(o?.en).length && lines(o?.en).length === lines(o?.es).length;
  if (b.type === 'contact' && !String(b.name || '').trim()) add('Add the teacher’s name', 'Agregue el nombre del docente');
  if (b.type === 'contact' && b.media && !both(b.alt)) add('Describe the photo in both languages', 'Describa la foto en ambos idiomas');
  if (b.type === 'contact' && (!!String(b.hours?.en || '').trim() !== !!String(b.hours?.es || '').trim())) add('Office hours in both languages', 'Horario de atención en ambos idiomas');
  if (b.type === 'table' && (!both(b.caption) || !sameLines(b.rows))) add('Table needs a title and the same rows in both languages', 'La tabla necesita título y las mismas filas en ambos idiomas');
  if (b.type === 'checklist' && (!both(b.title) || !sameLines(b.items))) add('Checklist needs a title and the same items in both languages', 'La lista necesita título y los mismos elementos en ambos idiomas');
  if (b.type === 'links' && (!sameLines(b.items) || [...lines(b.items?.en), ...lines(b.items?.es)].some(l => !cells(l)[1]))) add('Each link needs a label and an address, in both languages', 'Cada enlace necesita texto y dirección, en ambos idiomas');
  if (b.type === 'dates' && (!sameLines(b.items) || [...lines(b.items?.en), ...lines(b.items?.es)].some(l => isNaN(new Date(cells(l)[0] + 'T12:00'))))) add('Each date needs YYYY-MM-DD and a label, in both languages', 'Cada fecha necesita AAAA-MM-DD y un texto, en ambos idiomas');
  if (b.type === 'signup' && (!both(b.title) || !lines(b.slots).length)) add('Sign-up needs a title in both languages and at least one time slot', 'La inscripción necesita título en ambos idiomas y al menos un horario');
  return issues;
}
export function blockText(blocks = []) {
  return blocks.flatMap(b => [b.text?.en, b.text?.es, b.html ? plain(b.html.en) : '', b.html ? plain(b.html.es) : '', b.title?.en, b.title?.es, b.body?.en, b.body?.es, b.label?.en, b.label?.es, b.caption?.en, b.caption?.es, b.name?.en, b.name?.es, typeof b.name === 'string' ? b.name : '', b.role?.en, b.role?.es, b.hours?.en, b.hours?.es, b.rows?.en, b.rows?.es, b.items?.en, b.items?.es, b.note?.en, b.note?.es, typeof b.slots === 'string' ? b.slots : '']).filter(x => typeof x === 'string' && x).join(' ');
}

// ── Rendering (live site and builder preview)
export function renderBlocks(blocks = [], spanish = false, theme = {}) {
  ensureStyles();
  const g = o => o ? (spanish ? o.es : o.en) || '' : '';
  const img = (media, alt, cls = '') => media ? `<img class="${cls}" src="${BLANK}" data-media="${escH(media)}" alt="${escH(alt)}" loading="lazy">` : '';
  const out = blocks.map(b => {
    switch (b.type) {
      case 'heading': return b.level === 3 ? `<h3 class="pb-h">${escH(g(b.text))}</h3>` : `<h2 class="pb-h">${escH(g(b.text))}</h2>`;
      case 'text': return `<div class="pb-text">${sanitize(g(b.html))}</div>`;
      case 'image': return b.media ? `<figure class="pb-figure pb-${b.size || 'wide'}">${img(b.media, g(b.alt))}${g(b.caption) ? `<figcaption>${escH(g(b.caption))}</figcaption>` : ''}</figure>` : '';
      case 'gallery': return b.items.length ? `<div class="pb-gallery" role="region" aria-label="${spanish ? 'Galería de fotos' : 'Photo gallery'}"><button type="button" class="pb-gal-btn" data-gal="-1" aria-label="${spanish ? 'Anterior' : 'Previous'}">‹</button><div class="pb-gal-track">${b.items.map(i => `<figure>${img(i.media, g(i.alt))}</figure>`).join('')}</div><button type="button" class="pb-gal-btn" data-gal="1" aria-label="${spanish ? 'Siguiente' : 'Next'}">›</button></div>` : '';
      case 'video': {
        const v = parseVideo(b.link), title = g(b.title);
        const player = b.media ? `<video controls preload="metadata" data-media="${escH(b.media)}" aria-label="${escH(title)}">${['en', 'es'].filter(l => b.tracks?.[l]).map(l => `<track kind="captions" srclang="${l}" label="${l === 'en' ? 'English' : 'Español'}" data-track-media="${escH(b.tracks[l])}" ${(spanish ? l === 'es' : l === 'en') ? 'default' : ''}>`).join('')}</video>`
          : v ? `<iframe src="${embedSrc(v)}" title="${escH(title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>` : '';
        return player ? `<figure class="pb-video">${player}${g(b.caption) ? `<figcaption>${escH(g(b.caption))}</figcaption>` : ''}</figure>` : '';
      }
      case 'textimage': return `<div class="pb-textimage pb-${b.side === 'left' ? 'left' : 'right'}"><div class="pb-text">${sanitize(g(b.html))}</div>${b.media ? `<figure class="pb-figure">${img(b.media, g(b.alt))}</figure>` : ''}</div>`;
      case 'button': return b.href ? `<p class="pb-btnrow"><a class="btn ${b.style === 'outline' ? '' : 'primary'} pb-btn" href="${escH(b.href)}">${escH(g(b.label))}</a></p>` : '';
      case 'file': return b.media ? `<p class="pb-file"><a data-media-href="${escH(b.media)}" data-filename="${escH(b.fileName || 'document')}" href="#">📄 ${escH(g(b.name) || b.fileName)}</a></p>` : '';
      case 'collapsible': return `<details class="pb-details"><summary>${escH(g(b.title))}</summary><p class="content-body">${escH(g(b.body))}</p></details>`;
      case 'callout': return `<aside class="pb-callout pb-${b.tone || 'gold'}"><p class="content-body">${escH(g(b.text))}</p></aside>`;
      case 'divider': return '<hr class="pb-divider">';
      case 'contact': return `<div class="pb-contact">${b.media ? img(b.media, g(b.alt), 'pb-contact-photo') : `<div class="pb-contact-photo pb-initials" aria-hidden="true">${escH(String(b.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())}</div>`}<div><strong class="pb-contact-name">${escH(b.name)}</strong>${g(b.role) ? `<span class="pb-contact-role">${escH(g(b.role))}</span>` : ''}${b.email ? `<a href="mailto:${escH(b.email)}">✉ ${escH(b.email)}</a>` : ''}${b.phone ? `<a href="tel:${escH(String(b.phone).replace(/[^\d+]/g, ''))}">☎ ${escH(b.phone)}</a>` : ''}${g(b.hours) ? `<span>🕒 ${escH(g(b.hours))}</span>` : ''}</div></div>`;
      case 'table': { const rows = lines(g(b.rows)).map(cells); if (!rows.length) return ''; const [head, ...body] = rows;
        return `<div class="table-wrap pb-tablewrap"><table class="pb-table">${g(b.caption) ? `<caption>${escH(g(b.caption))}</caption>` : ''}<thead><tr>${head.map(c => `<th scope="col">${escH(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${head.map((_, i) => `<td>${escH(r[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
      case 'checklist': return `<div class="pb-checklist" data-checklist="${escH(b.id)}">${g(b.title) ? `<h3 class="pb-h">${escH(g(b.title))}</h3>` : ''}<ul>${lines(g(b.items)).map((it, i) => `<li><label><input type="checkbox" data-chk="${i}"> <span>${escH(it)}</span></label></li>`).join('')}</ul><p class="small muted">${spanish ? 'Marque lo que ya tiene; se guarda en este dispositivo.' : 'Check off what you have. Saved on this device.'}</p></div>`;
      case 'links': return `<ul class="pb-links">${lines(g(b.items)).map(cells).filter(c => c[1]).map(([label, href]) => `<li><a href="${escH(href)}">${escH(label)}</a></li>`).join('')}</ul>`;
      case 'dates': { const today = new Date(); today.setHours(0, 0, 0, 0);
        const items = lines(g(b.items)).map(cells).map(([d, label]) => ({ d: new Date(d + 'T12:00'), label })).filter(x => !isNaN(x.d) && x.d >= today).sort((a, c) => a.d - c.d);
        return `<div class="pb-dates">${items.length ? items.map(x => { const days = Math.round((x.d - today) / 864e5 - 0.5); const when = days <= 0 ? (spanish ? 'Hoy' : 'Today') : days === 1 ? (spanish ? 'Mañana' : 'Tomorrow') : (spanish ? `En ${days} días` : `In ${days} days`);
          return `<div class="pb-date"><div class="pb-datebox"><span>${escH(x.d.toLocaleDateString(spanish ? 'es-US' : 'en-US', { month: 'short' }))}</span><strong>${x.d.getDate()}</strong></div><div><strong>${escH(x.label || '')}</strong><span class="small muted">${when}</span></div></div>`; }).join('') : `<p class="muted">${spanish ? 'No hay fechas próximas.' : 'No upcoming dates.'}</p>`}</div>`; }
      case 'signup': return `<div class="pb-signup" data-signup="${escH(b.id)}" data-cap="${Math.max(1, +b.capacity || 1)}">${g(b.title) ? `<h3 class="pb-h">${escH(g(b.title))}</h3>` : ''}${g(b.note) ? `<p class="content-body">${escH(g(b.note))}</p>` : ''}<ul>${lines(b.slots).map((slot, i) => `<li data-slot="${i}"><div><strong>${escH(slot)}</strong><span class="small muted pb-spots"></span></div><form class="pb-signup-form"><label class="sr-only" for="su-${escH(b.id)}-${i}">${spanish ? 'Nombre del padre, madre o tutor' : 'Parent or guardian name'} – ${escH(slot)}</label><input id="su-${escH(b.id)}-${i}" placeholder="${spanish ? 'Nombre del padre o tutor' : 'Parent/guardian name'}" maxlength="60" required><button class="btn compact primary" type="submit">${spanish ? 'Inscribirme' : 'Sign up'}</button></form></li>`).join('')}</ul><p class="small muted">${spanish ? 'Demostración: las inscripciones se guardan solo en este navegador. En producción le llegan directamente al docente.' : 'Demo: sign-ups are saved only in this browser. In production they go straight to the teacher.'}</p></div>`;
      case 'spacer': return `<div class="pb-spacer\" style="height:${Math.max(8, Math.min(160, +b.size || 32))}px" aria-hidden="true"></div>`;
      default: return '';
    }
  }).join('');
  return `<div class="pb-page" style="--pb-accent:${escH(theme.accent || '#0b2545')}">${out}</div>`;
}

// Swap stored media into the rendered page and wire galleries + document downloads
export async function hydrateBlocks(root) {
  for (const el of root.querySelectorAll('[data-media]')) { const u = await mediaURL(el.dataset.media); if (u) el.src = u; }
  for (const tr of root.querySelectorAll('[data-track-media]')) { const u = await mediaURL(tr.dataset.trackMedia); if (u) tr.src = u; }
  for (const a of root.querySelectorAll('[data-media-href]')) { const u = await mediaURL(a.dataset.mediaHref); if (u) { a.href = u; a.download = a.dataset.filename; } }
  root.querySelectorAll('[data-checklist]').forEach(box => { const key = 'd11-chk-' + box.dataset.checklist; let st = {}; try { st = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
    box.querySelectorAll('[data-chk]').forEach(cb => { cb.checked = !!st[cb.dataset.chk]; cb.onchange = () => { st[cb.dataset.chk] = cb.checked; try { localStorage.setItem(key, JSON.stringify(st)); } catch {} }; }); });
  root.querySelectorAll('[data-signup]').forEach(box => { const key = 'd11-signup-' + box.dataset.signup, cap = +box.dataset.cap, es = document.documentElement.lang === 'es' || /lang=es/.test(location.search);
    const load = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
    const draw = () => { const all = load(); box.querySelectorAll('[data-slot]').forEach(li => { const n = all.filter(x => x.slot === +li.dataset.slot).length, left = Math.max(0, cap - n), mine = all.find(x => x.slot === +li.dataset.slot && x.me);
      li.querySelector('.pb-spots').textContent = mine ? (es ? ` · Inscrito: ${mine.name}` : ` · You’re signed up: ${mine.name}`) : left ? (es ? ` · ${left} de ${cap} disponibles` : ` · ${left} of ${cap} open`) : (es ? ' · Completo' : ' · Full');
      li.querySelector('form').hidden = !left || !!mine; }); };
    box.querySelectorAll('form').forEach(f => f.onsubmit = e => { e.preventDefault(); const slot = +f.closest('[data-slot]').dataset.slot, name = f.querySelector('input').value.trim(); if (!name) return; const all = load(); all.push({ slot, name, me: true }); try { localStorage.setItem(key, JSON.stringify(all)); } catch {} draw(); });
    draw(); });
  if (!root.__pbGal) { root.__pbGal = true; root.addEventListener('click', e => { const b = e.target.closest('[data-gal]'); if (!b) return; const tr = b.parentElement.querySelector('.pb-gal-track'); tr.scrollBy({ left: tr.clientWidth * +b.dataset.gal, behavior: 'smooth' }); }); }
}

export function ensureStyles() {
  if (typeof document === 'undefined' || document.querySelector('#pb-styles')) return;
  const s = document.createElement('style'); s.id = 'pb-styles';
  s.textContent = `.pb-page{--pb-accent:#0b2545}.pb-h{color:var(--pb-accent);margin:28px 0 10px}.pb-text{line-height:1.7}.pb-text ul,.pb-text ol{padding-left:1.4em}
.pb-figure{margin:22px 0}.pb-figure img{width:100%;border-radius:14px;display:block}.pb-half{max-width:50%}.pb-wide{max-width:100%}.pb-full{margin-left:-24px;margin-right:-24px}.pb-full img{border-radius:0}
figcaption{font-size:.88rem;color:#5b6b7b;margin-top:8px}
.pb-gallery{position:relative;margin:22px 0}.pb-gal-track{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;border-radius:14px}
.pb-gal-track figure{flex:0 0 100%;margin:0;scroll-snap-align:start}.pb-gal-track img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:14px;display:block}
.pb-gal-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:1;width:42px;height:42px;border-radius:50%;border:0;background:rgba(11,37,69,.78);color:#fff;font-size:1.6rem;cursor:pointer}.pb-gal-btn[data-gal="-1"]{left:10px}.pb-gal-btn[data-gal="1"]{right:10px}
.pb-video{margin:22px 0}.pb-video video,.pb-video iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:14px;background:#000;display:block}
.pb-textimage{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;margin:22px 0}.pb-textimage.pb-left .pb-figure{order:-1}.pb-textimage .pb-figure{margin:0}
.pb-btnrow{margin:22px 0}.pb-btn{background:var(--pb-accent);border-color:var(--pb-accent)}.pb-file a{font-weight:600}
.pb-details{border:1px solid #dde6ee;border-radius:12px;padding:12px 16px;margin:12px 0}.pb-details summary{font-weight:700;cursor:pointer}
.pb-callout{border-left:5px solid var(--pb-accent);background:#fff8e6;border-radius:0 12px 12px 0;padding:14px 18px;margin:22px 0}.pb-callout.pb-blue{background:#eaf2fa}.pb-callout.pb-green{background:#e9f6ee}
.pb-divider{border:0;border-top:2px solid #dde6ee;margin:28px 0}
.pb-contact{display:flex;gap:18px;align-items:center;background:#f6f9fc;border:1px solid #dde6ee;border-radius:14px;padding:16px;margin:22px 0}.pb-contact>div{display:flex;flex-direction:column;gap:3px}
.pb-contact-photo{width:96px;height:96px;border-radius:50%;object-fit:cover;flex:none}.pb-initials{display:grid;place-items:center;background:var(--pb-accent);color:#fff;font-size:1.8rem;font-weight:800}.pb-contact-name{font-size:1.2rem}.pb-contact-role{color:#41505f}
.pb-table{width:100%;border-collapse:collapse}.pb-table caption{text-align:left;font-weight:800;color:var(--pb-accent);padding:6px 0;font-size:1.1rem}.pb-table th{background:var(--pb-accent);color:#fff;text-align:left;padding:8px 10px}.pb-table td{border-bottom:1px solid #dde6ee;padding:8px 10px}.pb-tablewrap{margin:22px 0;overflow-x:auto}
.pb-checklist ul{list-style:none;padding:0}.pb-checklist li{padding:6px 0;border-bottom:1px solid #eef2f6}.pb-checklist input{width:20px;height:20px;vertical-align:middle;accent-color:var(--pb-accent)}.pb-checklist input:checked+span{text-decoration:line-through;color:#6b7b8b}
.pb-links{padding-left:1.2em;margin:18px 0}.pb-links li{margin:6px 0}.pb-links a{font-weight:600}
.pb-dates{display:grid;gap:10px;margin:22px 0}.pb-date{display:flex;gap:14px;align-items:center}.pb-date>div:last-child{display:flex;flex-direction:column}.pb-datebox{width:58px;text-align:center;border-radius:10px;background:var(--pb-accent);color:#fff;padding:6px 0;line-height:1.1}.pb-datebox span{font-size:.75rem;text-transform:uppercase;display:block}.pb-datebox strong{font-size:1.4rem}
.pb-signup{border:1px solid #dde6ee;border-radius:14px;padding:16px;margin:22px 0}.pb-signup ul{list-style:none;padding:0;margin:0}.pb-signup li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #eef2f6}.pb-signup form{display:flex;gap:6px}.pb-signup input{min-width:180px}
@media (max-width:700px){.pb-textimage{grid-template-columns:1fr}.pb-half{max-width:100%}}`;
  document.head.append(s);
}
