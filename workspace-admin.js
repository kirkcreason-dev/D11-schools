// Staff workspace, part 2: media library, site health, redirects, brand kit, people, analytics, backups, activity log, help.
import {t, esc, es, route, schoolURL, levelName, download} from './common.js';
import {demoItems, saveDemoItems, demoSchools, saveDemoSchools, readJSON, writeJSON, WS_KEYS, LOG_KEY, readLog, logActivity, DEMO_KEY, DEMO_SCHOOLS_KEY} from './static-api.js';
import {putMedia, putMediaAt, listMedia, deleteMedia, clearMedia, mediaURL} from './blocks.js';
import {bid} from './bid-details.js';
import {kindName, statusOf, allContent, titleOf, viewURL, when, ago, fmtBytes, csv, ROLES, roleName, healthReport, logLine, ACTIONS} from './workspace-core.js';

const L = es ? '&lang=es' : '', LQ = es ? '?lang=es' : '';
const pubOnly = () => `<p class="notice">${t('Switch to “District publisher” at the top to make changes here.', 'Cambie a “Publicador del distrito” arriba para hacer cambios aquí.')}</p>`;
const head = (title, text, actions = '') => `<div class="ws-head"><div><h2>${title}</h2><p class="muted">${text}</p></div>${actions ? `<div class="buttons">${actions}</div>` : ''}</div>`;

// ───────── Media library
async function pMedia(el, ctx) {
  let filter = 'all', q = '';
  el.innerHTML = head(t('Media library', 'Biblioteca de medios'), t('Upload photos, videos and documents once, describe them once, and reuse them on any page in the page builder.', 'Suba fotos, videos y documentos una vez, descríbalos una vez y reutilícelos en cualquier página del editor visual.'), `<a class="btn compact" href="builder.html${LQ}">${t('Open the page builder', 'Abrir el editor de páginas')}</a>`)
  + `<label class="ws-drop" id="md-drop"><strong>${t('Drop files here or choose files', 'Arrastre archivos aquí o elíjalos')}</strong><span class="small muted">${t('Photos (resized automatically), videos up to 250 MB, PDF and Office documents', 'Fotos (se ajustan automáticamente), videos de hasta 250 MB, documentos PDF y de Office')}</span><input id="md-file" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"></label>
  <div class="card ws-filters"><div class="field grow"><label for="md-q">${t('Search by name or description', 'Buscar por nombre o descripción')}</label><input id="md-q" type="search"></div><div class="field"><label for="md-type">${t('Show', 'Mostrar')}</label><select id="md-type"><option value="all">${t('Everything', 'Todo')}</option><option value="image">${t('Photos', 'Fotos')}</option><option value="video">${t('Videos', 'Videos')}</option><option value="doc">${t('Documents', 'Documentos')}</option></select></div></div>
  <p class="small" id="md-msg" role="status" aria-live="polite"></p><div id="md-grid"></div><section id="md-posts"></section><p class="small muted" id="md-usage"></p>`;
  const $ = id => el.querySelector('#' + id), msg = (m, err) => { $('md-msg').textContent = m; $('md-msg').className = 'small' + (err ? ' notice error' : ''); };
  const kindOf = m => (m.type || '').startsWith('image/') ? 'image' : (m.type || '').startsWith('video/') ? 'video' : 'doc';
  async function draw() {
    const meta = readJSON(WS_KEYS.mediaMeta, {}), used = JSON.stringify(demoItems()) + (localStorage.getItem('d11-builder-working-v1') || '');
    const all = (await listMedia()).filter(m => m.blob);
    const list = all.filter(m => (filter === 'all' || kindOf(m) === filter) && (!q || [m.name, meta[m.id]?.en, meta[m.id]?.es].join(' ').toLowerCase().includes(q.toLowerCase())));
    $('md-grid').innerHTML = list.length ? `<p class="small muted">${t(`${list.length} of ${all.length} files`, `${list.length} de ${all.length} archivos`)}</p><ul class="ws-media">${list.map(m => {
      const k = kindOf(m), uses = used.split(`"${m.id}"`).length - 1, d = meta[m.id] || {}, missing = k === 'image' && !(d.en && d.es);
      return `<li class="card ws-media-item"><div class="ws-thumb">${k === 'image' ? `<img data-src="${esc(m.id)}" alt="">` : `<span>${k === 'video' ? t('VIDEO', 'VIDEO') : esc((m.name.split('.').pop() || 'DOC').toUpperCase())}</span>`}</div>
        <div class="ws-media-body"><strong class="ws-media-name">${esc(m.name || t('Untitled', 'Sin nombre'))}</strong><span class="small muted">${esc(fmtBytes(m.size || m.blob.size))} · ${uses ? t(`used on ${uses} page${uses > 1 ? 's' : ''}`, `usado en ${uses} página(s)`) : t('not used yet', 'sin usar')}</span>
        ${k === 'image' ? `${missing ? `<span class="badge red">${t('Needs a description', 'Necesita descripción')}</span>` : `<span class="badge green">✓ ${t('Described', 'Descrita')}</span>`}<div class="field"><label for="alt-en-${esc(m.id)}">${t('Description (English)', 'Descripción (inglés)')}</label><input id="alt-en-${esc(m.id)}" data-alt="${esc(m.id)}" data-l="en" value="${esc(d.en || '')}" maxlength="200"></div><div class="field"><label for="alt-es-${esc(m.id)}">${t('Description (Spanish)', 'Descripción (español)')}</label><input id="alt-es-${esc(m.id)}" data-alt="${esc(m.id)}" data-l="es" value="${esc(d.es || '')}" maxlength="200"></div>` : ''}
        <div class="buttons"><a class="btn compact" data-dl="${esc(m.id)}" href="#" download="${esc(m.name || 'file')}">${t('Download', 'Descargar')}</a>${uses ? '' : `<button type="button" class="btn compact" data-mdel="${esc(m.id)}">${t('Delete', 'Eliminar')}</button>`}</div></div></li>`;
    }).join('')}</ul>` : `<div class="card"><p class="muted">${all.length ? t('No files match.', 'Ningún archivo coincide.') : t('The library is empty. Upload photos, videos or documents above, or add them in the page builder: everything lands here.', 'La biblioteca está vacía. Suba fotos, videos o documentos arriba, o agréguelos en el editor visual: todo llega aquí.')}</p></div>`;
    for (const img of el.querySelectorAll('img[data-src]')) img.src = await mediaURL(img.dataset.src);
    for (const a of el.querySelectorAll('[data-dl]')) a.href = await mediaURL(a.dataset.dl);
    const posts = demoItems().filter(x => x.uploaded && x.image);
    $('md-posts').innerHTML = posts.length ? `<div class="card"><h3>${t('Photos attached to posts', 'Fotos en publicaciones')} (${posts.length})</h3><ul class="ws-media mini">${posts.map(x => `<li><img src="${x.image}" alt="${esc(es ? x.imageAltEs : x.imageAlt)}"><span class="small">${esc(titleOf(x))}</span></li>`).join('')}</ul></div>` : '';
    try { const e = await navigator.storage?.estimate?.(); if (e) $('md-usage').textContent = t(`Storage in this demo browser: ${fmtBytes(e.usage || 0)} used. On the live platform media is stored in the cloud with a content delivery network.`, `Almacenamiento en este navegador de demostración: ${fmtBytes(e.usage || 0)} en uso. En la plataforma real, los archivos se guardan en la nube con una red de distribución de contenido.`); } catch {}
  }
  async function upload(files) {
    let n = 0;
    for (const f of files) {
      const img = f.type.startsWith('image/'), vid = f.type.startsWith('video/'), doc = /pdf|word|excel|powerpoint|officedocument|text\/plain/.test(f.type) || /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(f.name);
      const cap = img ? 15 : vid ? 250 : 25;
      if (!img && !vid && !doc) { msg(t(`${f.name}: this file type is not supported.`, `${f.name}: este tipo de archivo no es compatible.`), true); continue; }
      if (f.size > cap * 1e6) { msg(t(`${f.name} is larger than ${cap} MB.`, `${f.name} pesa más de ${cap} MB.`), true); continue; }
      try { await putMedia(img ? await shrink(f) : f, f.name); n++; logActivity('media-added', { title: f.name, titleEs: f.name }); }
      catch { msg(t('This browser blocked saving the file.', 'Este navegador bloqueó el guardado del archivo.'), true); }
    }
    if (n) { msg(t(`${n} file${n > 1 ? 's' : ''} added. Add a description to each photo so it can be reused on any page.`, `${n} archivo(s) agregado(s). Describa cada foto para poder reutilizarla.`)); ctx.changed(); }
    await draw();
  }
  $('md-file').addEventListener('change', e => upload([...e.target.files]).then(() => e.target.value = ''));
  const drop = $('md-drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); upload([...e.dataTransfer.files]); });
  $('md-q').addEventListener('input', e => { q = e.target.value.trim(); draw(); });
  $('md-type').addEventListener('change', e => { filter = e.target.value; draw(); });
  el.onchange = e => { const i = e.target.closest('[data-alt]'); if (!i) return; const meta = readJSON(WS_KEYS.mediaMeta, {}); meta[i.dataset.alt] = { ...(meta[i.dataset.alt] || {}), [i.dataset.l]: i.value.trim() }; writeJSON(WS_KEYS.mediaMeta, meta); msg(t('Description saved. It is filled in automatically when this photo is added to a page.', 'Descripción guardada. Se completa automáticamente al agregar esta foto a una página.')); };
  el.onclick = async e => {
    const b = e.target.closest('[data-mdel]'); if (!b) return;
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = t('Confirm delete', 'Confirmar'); b.classList.add('danger'); return; }
    const name = (await listMedia()).find(m => m.id === b.dataset.mdel)?.name || '';
    await deleteMedia(b.dataset.mdel); logActivity('media-removed', { title: name, titleEs: name }); msg(t('Deleted.', 'Eliminado.')); draw();
  };
  await draw();
}
function shrink(file, max = 1600) {
  return new Promise(ok => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); const s = Math.min(1, max / Math.max(img.width, img.height)); if (s === 1 && file.size < 1.5e6) return ok(file);
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => ok(b || file), file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86); };
    img.onerror = () => { URL.revokeObjectURL(url); ok(file); };
    img.src = url;
  });
}

// ───────── Site health
async function pHealth(el, ctx) {
  let show = 'error';
  function draw() {
    const r = healthReport(), at = new Date();
    const rows = (show === 'error' ? r.errors : show === 'warn' ? r.warnings : r.rows.filter(x => x.issues.length));
    const bySite = new Map(); r.errors.forEach(x => bySite.set(x.item.scope, (bySite.get(x.item.scope) || 0) + 1));
    el.innerHTML = head(t('Site health', 'Salud del sitio'), t('Every page on every site is checked for both languages, photo descriptions, broken links, leftover template text and out-of-date events. Problems are caught before families ever see them.', 'Cada página de cada sitio se revisa: ambos idiomas, descripciones de fotos, enlaces rotos, texto de plantilla y eventos vencidos. Los problemas se detectan antes de que las familias los vean.'), `<button type="button" class="btn compact" id="hl-run">${t('Check again', 'Revisar de nuevo')}</button>`)
    + `<div class="ws-stats"><div class="ws-stat ${r.score < 100 ? 'red' : 'green'}"><span class="ws-stat-n">${r.score}%</span><span>${t('of pages pass every required check', 'de las páginas pasan todas las revisiones')}</span></div><div class="ws-stat"><span class="ws-stat-n">${r.rows.length}</span><span>${t('pages, posts and alerts checked', 'páginas, publicaciones y avisos revisados')}</span></div><div class="ws-stat ${r.errors.length ? 'red' : ''}"><span class="ws-stat-n">${r.errors.length}</span><span>${t('must fix', 'deben corregirse')}</span></div><div class="ws-stat"><span class="ws-stat-n">${r.warnings.length}</span><span>${t('suggestions', 'sugerencias')}</span></div></div>
    <p class="small muted" role="status">${t('Last checked', 'Última revisión')} ${esc(when(at))}</p>
    ${bySite.size ? `<div class="card"><h3>${t('Sites with issues', 'Sitios con problemas')}</h3><ul class="ws-plain ws-chips">${[...bySite].sort((a, b) => b[1] - a[1]).map(([s, n]) => `<li><span class="badge red">${n}</span> ${esc(ctx.scopeName(s))}</li>`).join('')}</ul></div>` : ''}
    <div class="buttons" role="group" aria-label="${t('Show', 'Mostrar')}">${[['error', t('Must fix', 'Deben corregirse'), r.errors.length], ['warn', t('Suggestions', 'Sugerencias'), r.warnings.length], ['all', t('Everything with a note', 'Todo con observaciones'), r.rows.filter(x => x.issues.length).length]].map(([k, l, n]) => `<button type="button" class="btn compact" data-show="${k}" aria-pressed="${show === k}">${l} (${n})</button>`).join('')}</div>
    ${rows.length ? `<ul class="ws-plain">${rows.map(({ item: x, issues }) => `<li class="card ws-issue"><div class="ws-review-head"><div><span class="small muted">${esc(kindName(x.kind))} · ${esc(ctx.scopeName(x.scope))}${x.builtin ? ' · ' + t('built-in', 'incluido') : ''}</span><h3>${esc(titleOf(x))}</h3></div><div class="buttons">${x.builtin ? `<a class="btn compact" href="${esc(viewURL(x))}">${t('View', 'Ver')}</a>` : `<button type="button" class="btn compact primary" data-fix="${esc(x.id)}">${t('Fix it', 'Corregir')}</button>`}</div></div>
      <ul class="ws-issues">${issues.filter(i => show === 'all' || i.level === show).map(i => `<li class="${i.level}"><span aria-hidden="true">${i.level === 'error' ? '✗' : '!'}</span> ${esc(t(i.en, i.es))}</li>`).join('')}</ul></li>`).join('')}</ul>`
      : `<div class="card"><p class="ws-clear">✓ ${show === 'error' ? t('Nothing must be fixed. Every page passes the required checks.', 'No hay nada que corregir. Todas las páginas pasan las revisiones obligatorias.') : t('Nothing here.', 'Nada aquí.')}</p></div>`}
    <details class="card"><summary><strong>${t('What is checked', 'Qué se revisa')}</strong></summary><ul>${[['Title and text in English and Spanish', 'Título y texto en inglés y español'], ['Every photo described in both languages for screen readers', 'Cada foto descrita en ambos idiomas para lectores de pantalla'], ['Videos titled, documents named, tables and lists complete in both languages', 'Videos con título, documentos con nombre, tablas y listas completas en ambos idiomas'], ['Links point to pages that exist', 'Los enlaces llevan a páginas que existen'], ['No leftover [template prompts]', 'Sin [indicaciones] de plantilla'], ['Events whose date has passed', 'Eventos cuya fecha ya pasó'], ['Titles readable on a phone and not in all capitals', 'Títulos legibles en el teléfono y sin mayúsculas sostenidas'], ['Theme colors meet contrast rules (checked in the page builder)', 'Los colores del tema cumplen el contraste (se revisa en el editor visual)']].map(([en, sp]) => `<li>${t(en, sp)}</li>`).join('')}</ul></details>`;
  }
  el.onclick = e => {
    const b = e.target.closest('[data-show],[data-fix],#hl-run'); if (!b) return;
    if (b.id === 'hl-run') { draw(); el.querySelector('#hl-run').focus(); return; }
    if (b.dataset.show) { show = b.dataset.show; draw(); el.querySelector(`[data-show="${show}"]`).focus(); return; }
    const x = demoItems().find(i => i.id === b.dataset.fix); if (!x) return;
    if (x.blocks) location.href = `builder.html?id=${encodeURIComponent(x.id)}${L}`; else ctx.go('create', { edit: x.id });
  };
  draw();
}

// ───────── Redirects (old d11.org addresses keep working after migration)
const SEED_REDIRECTS = [
  ['/families-community/enrollment/studentenrollment', 'page.html?id=enrollment'], ['/aboutd11/operations/school/food-and-nutrition-services/fnsmenus', 'page.html?id=meals'],
  ['/families-community', 'families.html'], ['/calendars/district-calendar', 'page.html?id=district-calendar'], ['/select-a-school', 'schools.html'],
  ['/school-board', 'page.html?id=board'], ['/students', 'page.html?id=students'], ['/academics', 'page.html?id=academics']
];
const normPath = v => { let s = String(v || '').trim().toLowerCase(); s = s.replace(/^https?:\/\/[^/]+/, '').replace(/^(www\.)?d11\.org/, '').replace(/[?#].*$/, ''); if (!s.startsWith('/')) s = '/' + s; return s.length > 1 ? s.replace(/\/+$/, '') : s; };
const redirects = () => readJSON(WS_KEYS.redirects, null) || SEED_REDIRECTS.map(([from, to]) => ({ from, to, source: 'migration' }));
async function pRedirects(el, ctx) {
  const pub = ctx.role === 'publisher';
  const dests = [['index.html', t('District home', 'Inicio del distrito')], ['schools.html', t('Find a school', 'Buscar una escuela')], ['families.html', t('Family resources', 'Recursos familiares')], ['calendar.html', t('Calendar', 'Calendario')], ['search.html', t('Search', 'Búsqueda')],
    ...allContent().filter(x => ['page', 'news', 'event'].includes(x.kind) && statusOf(x) === 'live').map(x => [`page.html?id=${x.id}`, `${titleOf(x)} (${kindName(x.kind)})`]),
    ...ctx.schools.map(s => [`school.html?school=${s.id}`, s.name])];
  const destName = to => (dests.find(d => d[0] === to) || [to, to])[1];
  function draw(note) {
    const list = redirects();
    el.innerHTML = head(t('Redirects', 'Redirecciones'), t('When the site moves, every old d11.org address is sent to its new home, so bookmarks, printed flyers and search results keep working.', 'Al migrar el sitio, cada dirección antigua de d11.org se envía a su nuevo lugar, para que los marcadores, volantes impresos y resultados de búsqueda sigan funcionando.'), `<button type="button" class="btn compact" id="rd-csv">${t('Export (CSV)', 'Exportar (CSV)')}</button>`)
    + `<form class="card" id="rd-test" novalidate><h3>${t('Test an old address', 'Probar una dirección antigua')}</h3><div class="ws-filters"><div class="field grow"><label for="rd-try">${t('Old address', 'Dirección antigua')}</label><input id="rd-try" placeholder="www.d11.org/select-a-school"></div><div class="buttons"><button type="submit" class="btn compact">${t('Test', 'Probar')}</button></div></div><p id="rd-result" role="status" aria-live="polite"></p></form>
    ${pub ? `<form class="card" id="rd-add" novalidate><h3>${t('Add a redirect', 'Agregar una redirección')}</h3><div class="form-grid"><div class="field"><label for="rd-from">${t('Old address (on d11.org)', 'Dirección antigua (en d11.org)')}</label><input id="rd-from" placeholder="/families-community/back-to-school"></div><div class="field"><label for="rd-to">${t('Send visitors to', 'Enviar a los visitantes a')}</label><select id="rd-to">${dests.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('')}</select></div></div>
      <details><summary>${t('Add many at once (paste from a spreadsheet)', 'Agregar muchas a la vez (pegar desde una hoja de cálculo)')}</summary><div class="field"><label for="rd-bulk">${t('One per line: old address, new address', 'Una por línea: dirección antigua, dirección nueva')}</label><textarea id="rd-bulk" rows="4" placeholder="/old/page,page.html?id=enrollment"></textarea></div></details>
      <p class="small" id="rd-msg" role="status" aria-live="polite">${note || ''}</p><div class="buttons"><button class="btn primary compact" type="submit">${t('Save redirect', 'Guardar redirección')}</button></div></form>` : pubOnly()}
    <div class="card"><h3>${t('All redirects', 'Todas las redirecciones')} (${list.length})</h3><table class="ws-table"><caption class="sr-only">${t('Redirects', 'Redirecciones')}</caption><thead><tr><th scope="col">${t('Old address', 'Dirección antigua')}</th><th scope="col">${t('Goes to', 'Lleva a')}</th><th scope="col">${t('Source', 'Origen')}</th>${pub ? `<th scope="col"><span class="sr-only">${t('Actions', 'Acciones')}</span></th>` : ''}</tr></thead><tbody>${list.map((r, i) => `<tr><td data-label="${t('Old address', 'Dirección antigua')}"><code>d11.org${esc(r.from)}</code></td><td data-label="${t('Goes to', 'Lleva a')}"><a href="${esc(r.to)}">${esc(destName(r.to))}</a></td><td data-label="${t('Source', 'Origen')}">${r.source === 'migration' ? t('Migration map', 'Mapa de migración') : t('Added by staff', 'Agregada por el personal')}</td>${pub ? `<td><button type="button" class="btn compact" data-rdel="${i}">${t('Remove', 'Quitar')}</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }
  const save = list => writeJSON(WS_KEYS.redirects, list);
  el.onsubmit = e => {
    e.preventDefault();
    if (e.target.id === 'rd-test') {
      const p = normPath(el.querySelector('#rd-try').value), list = redirects(); if (p === '/') { el.querySelector('#rd-result').textContent = t('Type an old address first.', 'Escriba primero una dirección antigua.'); return; }
      const hit = list.find(r => r.from === p) || list.filter(r => p.startsWith(r.from + '/')).sort((a, b) => b.from.length - a.from.length)[0];
      el.querySelector('#rd-result').innerHTML = hit ? `✓ <code>d11.org${esc(p)}</code> → <a href="${esc(hit.to)}">${esc(destName(hit.to))}</a>${hit.from !== p ? ` <span class="small muted">(${t('matched', 'coincide con')} ${esc(hit.from)})</span>` : ''}` : `${t('No redirect yet. Visitors would see a friendly “page not found” with a search box. Add one below.', 'Aún no hay redirección. Los visitantes verían un aviso amable de “página no encontrada” con un buscador. Agregue una abajo.')}`;
      return;
    }
    if (e.target.id !== 'rd-add') return;
    const list = redirects(), bulk = el.querySelector('#rd-bulk').value.trim();
    const pairs = bulk ? bulk.split('\n').map(l => l.split(/[,\t]/).map(c => c.trim())).filter(c => c[0] && c[1]) : [[el.querySelector('#rd-from').value, el.querySelector('#rd-to').value]];
    let added = 0;
    for (const [from, to] of pairs) {
      const f = normPath(from); if (f === '/' || !to) continue;
      const i = list.findIndex(r => r.from === f); const rec = { from: f, to: to.replace(/^\//, ''), source: 'added', at: new Date().toISOString() };
      if (i >= 0) list[i] = rec; else list.unshift(rec); added++; logActivity('redirect-added', { title: 'd11.org' + f, titleEs: 'd11.org' + f });
    }
    if (!added) { el.querySelector('#rd-msg').textContent = t('Enter the old address.', 'Escriba la dirección antigua.'); return; }
    save(list); draw(t(`${added} redirect${added > 1 ? 's' : ''} saved.`, `${added} redirección(es) guardada(s).`));
  };
  el.onclick = e => {
    const b = e.target.closest('[data-rdel],#rd-csv'); if (!b) return;
    if (b.id === 'rd-csv') { download('d11-redirects.csv', csv([['Old address', 'New address'], ...redirects().map(r => ['https://www.d11.org' + r.from, r.to])]), 'text/csv;charset=utf-8'); return; }
    const list = redirects(), [r] = list.splice(+b.dataset.rdel, 1); save(list); logActivity('redirect-removed', { title: 'd11.org' + r.from, titleEs: 'd11.org' + r.from }); draw(t('Redirect removed.', 'Redirección quitada.'));
  };
  draw();
}

// ───────── Brand kit
async function pBrand(el, ctx) {
  const css = getComputedStyle(document.documentElement), hex = v => css.getPropertyValue(v).trim();
  const lum = h => { const c = h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const colors = [['--navy', 'District navy', 'Azul marino del distrito'], ['--blue', 'Link blue', 'Azul de enlaces'], ['--gold', 'District gold', 'Dorado del distrito'], ['--ink', 'Text', 'Texto'], ['--muted', 'Secondary text', 'Texto secundario'], ['--paper', 'Background', 'Fondo']].map(([v, en, sp]) => [hex(v), t(en, sp)]).filter(c => /^#[0-9a-f]{6}$/i.test(c[0]));
  const font = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/["']/g, '');
  const logos = ctx.schools.filter(s => s.identity === 'school' && s.image);
  el.innerHTML = head(t('Brand kit', 'Identidad visual'), t('Colors, type, logos and templates in one place, so all 58 school sites look like one district while keeping their own identity.', 'Colores, tipografía, logotipos y plantillas en un solo lugar, para que los 58 sitios se vean como un solo distrito sin perder su identidad.'))
  + `<section class="card" aria-labelledby="bk-c"><h3 id="bk-c">${t('Colors', 'Colores')}</h3><ul class="ws-swatches">${colors.map(([h, n]) => { const w = ratio(h, '#ffffff'); return `<li><span class="ws-swatch" style="background:${h}"></span><strong>${esc(n)}</strong><code>${h}</code><span class="small ${w >= 4.5 ? '' : 'muted'}">${t('On white', 'Sobre blanco')}: ${w.toFixed(1)}:1 ${w >= 4.5 ? '✓ ' + t('text OK', 'apto para texto') : t('decoration only', 'solo decoración')}</span><button type="button" class="btn compact" data-copy-hex="${h}">${t('Copy', 'Copiar')}</button></li>`; }).join('')}</ul><p class="small" id="bk-msg" role="status" aria-live="polite"></p></section>
  <section class="card" aria-labelledby="bk-t"><h3 id="bk-t">${t('Typography', 'Tipografía')}</h3><p><strong>${esc(font)}</strong> ${t('for headings and text, with Arial as the fallback.', 'para títulos y texto, con Arial como respaldo.')}</p><p class="ws-type-h">${t('A world of possibility.', 'Un mundo de posibilidades.')}</p><p>${t('Body text is 16 pixels or larger, with generous line spacing for easy reading on phones.', 'El texto es de 16 píxeles o más, con interlineado amplio para leer fácilmente en el teléfono.')}</p></section>
  <section class="card" aria-labelledby="bk-l"><h3 id="bk-l">${t('Logos', 'Logotipos')}</h3><ul class="ws-logos"><li><img src="assets/d11.png" alt="" loading="lazy"><span class="small">District 11</span><a class="btn compact" href="assets/d11.png" download>${t('Download', 'Descargar')}</a></li>${logos.slice(0, 11).map(s => `<li><img src="${esc(s.image)}" alt="" loading="lazy"><span class="small">${esc(s.name)}</span><a class="btn compact" href="${esc(s.image)}" download>${t('Download', 'Descargar')}</a></li>`).join('')}</ul><p class="small muted">${t(`${logos.length} school logos on file. Logo use follows the District’s brand guidelines; new logos are approved before they go live.`, `${logos.length} logotipos escolares registrados. Su uso sigue las normas de marca del distrito; los nuevos se aprueban antes de publicarse.`)}</p></section>
  <section class="card" aria-labelledby="bk-tp"><h3 id="bk-tp">${t('Templates', 'Plantillas')}</h3><div class="ws-actions">${[['#create?template=spotlight', 'School spotlight', 'Escuela destacada'], ['#create?template=event', 'Family event', 'Evento familiar'], ['#create?template=achievement', 'Achievement', 'Logro'], ['#create?template=newsletter', 'Weekly newsletter', 'Boletín semanal'], ['builder.html?layout=program' + L, 'Program page', 'Página de programa'], ['builder.html?layout=event' + L, 'Event page', 'Página de evento'], ['builder.html?layout=faq' + L, 'FAQ page', 'Preguntas frecuentes'], ['builder.html?layout=showcase' + L, 'Photo & video showcase', 'Fotos y video'], ['builder.html?layout=classroom' + L, 'Classroom page', 'Página de clase']].map(([h, en, sp]) => `<a class="ws-action" href="${h}"><strong>${t(en, sp)}</strong><span class="small muted">${h.startsWith('#') ? t('Quick editor', 'Editor rápido') : t('Page builder', 'Editor visual')}</span></a>`).join('')}</div></section>
  <section class="card" aria-labelledby="bk-w"><h3 id="bk-w">${t('Writing for families', 'Cómo escribir para las familias')}</h3><ul>${[['Plain language: short sentences, everyday words.', 'Lenguaje claro: oraciones cortas y palabras cotidianas.'], ['Every page in English and Spanish. The platform will not publish one without the other.', 'Cada página en inglés y español. La plataforma no publica una sin la otra.'], ['Describe every photo for people using screen readers.', 'Describa cada foto para quienes usan lectores de pantalla.'], ['Put dates, times and places first. Families scan on phones.', 'Ponga primero fechas, horas y lugares. Las familias leen rápido en el teléfono.'], ['No all-capital headlines; use bold sparingly.', 'Sin titulares en mayúsculas; use negritas con moderación.'], ['Link with words that say where the link goes, never “click here”.', 'Enlace con palabras que digan a dónde lleva, nunca “haga clic aquí”.']].map(([en, sp]) => `<li>${t(en, sp)}</li>`).join('')}</ul></section>`;
  el.onclick = async e => { const b = e.target.closest('[data-copy-hex]'); if (!b) return; try { await navigator.clipboard.writeText(b.dataset.copyHex); el.querySelector('#bk-msg').textContent = t(`Copied ${b.dataset.copyHex}`, `Copiado ${b.dataset.copyHex}`); } catch { el.querySelector('#bk-msg').textContent = b.dataset.copyHex; } };
}

// ───────── People & permissions
const SEED_USERS = [
  { id: 'u1', name: 'District web owner (sample)', email: 'web-owner@example.org', role: 'owner', sites: ['*'] },
  { id: 'u2', name: 'Communications office (sample)', email: 'communications@example.org', role: 'publisher', sites: ['*'] },
  { id: 'u3', name: 'Palmer High front office (sample)', email: 'palmer-office@example.org', role: 'editor', sites: ['palmer-high-school'] },
  { id: 'u4', name: 'Adams Elementary teacher (sample)', email: 'adams-teacher@example.org', role: 'teacher', sites: ['adams-elementary'] }
];
const PERMS = [
  ['Edit pages for their assigned schools', 'Editar páginas de sus escuelas asignadas', 1, 1, 1, 0],
  ['Teacher classroom pages', 'Páginas de clase docentes', 1, 1, 1, 1],
  ['Submit content for approval', 'Enviar contenido para aprobación', 1, 1, 1, 1],
  ['Publish without approval', 'Publicar sin aprobación', 1, 1, 0, 0],
  ['Approve school submissions', 'Aprobar envíos escolares', 1, 1, 0, 0],
  ['Districtwide emergency alerts', 'Avisos de emergencia para todo el distrito', 1, 1, 0, 0],
  ['Add school sites and redirects', 'Agregar sitios y redirecciones', 1, 1, 0, 0],
  ['Manage people and roles', 'Administrar personas y roles', 1, 0, 0, 0],
  ['Restore backups and export everything', 'Restaurar respaldos y exportar todo', 1, 0, 0, 0]
];
async function pPeople(el, ctx) {
  const pub = ctx.role === 'publisher';
  const users = () => readJSON(WS_KEYS.users, null) || SEED_USERS;
  const sitesText = u => u.sites.includes('*') ? t('All sites', 'Todos los sitios') : u.sites.map(s => ctx.scopeName(s)).join(', ');
  function draw(note) {
    const list = users();
    el.innerHTML = head(t('People & permissions', 'Personas y permisos'), t('Staff sign in with their district account through single sign-on: no extra passwords. Each person sees only the sites assigned to them, and leaving the district ends their access automatically.', 'El personal inicia sesión con su cuenta del distrito mediante acceso único: sin contraseñas adicionales. Cada persona ve solo los sitios asignados, y al dejar el distrito su acceso termina automáticamente.'))
    + `<div class="card"><h3>${t('People', 'Personas')} (${list.length})</h3><p class="small muted">${t('Sample accounts for the demonstration. The real list comes from the District’s staff directory at launch.', 'Cuentas de muestra para la demostración. La lista real proviene del directorio del personal del distrito al lanzar.')}</p><p class="small" id="pp-msg" role="status" aria-live="polite">${note || ''}</p>
      <table class="ws-table"><caption class="sr-only">${t('People', 'Personas')}</caption><thead><tr><th scope="col">${t('Name', 'Nombre')}</th><th scope="col">${t('Role', 'Rol')}</th><th scope="col">${t('Sites', 'Sitios')}</th>${pub ? `<th scope="col"><span class="sr-only">${t('Actions', 'Acciones')}</span></th>` : ''}</tr></thead><tbody>${list.map(u => `<tr><td data-label="${t('Name', 'Nombre')}"><strong>${esc(u.name)}</strong><div class="small muted">${esc(u.email)}</div></td>
      <td data-label="${t('Role', 'Rol')}">${pub ? `<label class="sr-only" for="role-${esc(u.id)}">${t('Role for', 'Rol de')} ${esc(u.name)}</label><select id="role-${esc(u.id)}" data-urole="${esc(u.id)}">${Object.keys(ROLES).map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${esc(roleName(r))}</option>`).join('')}</select>` : esc(roleName(u.role))}</td>
      <td data-label="${t('Sites', 'Sitios')}">${esc(sitesText(u))}</td>${pub ? `<td><button type="button" class="btn compact" data-udel="${esc(u.id)}" ${u.role === 'owner' && list.filter(x => x.role === 'owner').length < 2 ? `disabled title="${t('Keep at least one owner', 'Mantenga al menos un propietario')}"` : ''}>${t('Remove', 'Quitar')}</button></td>` : ''}</tr>`).join('')}</tbody></table></div>
    ${pub ? `<form class="card" id="pp-add" novalidate><h3>${t('Add a person', 'Agregar a una persona')}</h3><div class="form-grid"><div class="field"><label for="pp-name">${t('Name', 'Nombre')}</label><input id="pp-name" maxlength="80" autocomplete="off"></div><div class="field"><label for="pp-email">${t('District email', 'Correo del distrito')}</label><input id="pp-email" type="email" maxlength="120" autocomplete="off"></div>
      <div class="field"><label for="pp-role">${t('Role', 'Rol')}</label><select id="pp-role">${Object.keys(ROLES).reverse().map(r => `<option value="${r}" ${r === 'editor' ? 'selected' : ''}>${esc(roleName(r))}</option>`).join('')}</select></div>
      <div class="field"><label for="pp-sites">${t('Sites (hold Ctrl or ⌘ to pick several)', 'Sitios (mantenga Ctrl o ⌘ para elegir varios)')}</label><select id="pp-sites" multiple size="6"><option value="*">${t('All sites', 'Todos los sitios')}</option><option value="district">${t('District site', 'Sitio del distrito')}</option>${ctx.schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></div></div>
      <div class="buttons"><button class="btn primary compact" type="submit">${t('Add person', 'Agregar persona')}</button></div></form>` : pubOnly()}
    <div class="card"><h3>${t('What each role can do', 'Qué puede hacer cada rol')}</h3><table class="ws-table ws-matrix"><caption class="sr-only">${t('Permissions by role', 'Permisos por rol')}</caption><thead><tr><th scope="col">${t('Permission', 'Permiso')}</th>${Object.keys(ROLES).map(r => `<th scope="col">${esc(roleName(r))}</th>`).join('')}</tr></thead><tbody>${PERMS.map(([en, sp, ...v]) => `<tr><th scope="row">${t(en, sp)}</th>${v.map(x => `<td>${x ? `<span aria-hidden="true">✓</span><span class="sr-only">${t('Yes', 'Sí')}</span>` : `<span aria-hidden="true">—</span><span class="sr-only">${t('No', 'No')}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="ws-matrix-list">${Object.keys(ROLES).map((r, ri) => `<h4>${esc(roleName(r))}</h4><ul>${PERMS.filter(p => p[2 + ri]).map(([en, sp]) => `<li>${t(en, sp)}</li>`).join('')}</ul>`).join('')}</div><p class="small muted">${t('Roles can be adjusted to fit how the District works, for example a principal approver for each school.', 'Los roles se ajustan a la forma de trabajar del distrito, por ejemplo un director que aprueba en cada escuela.')}</p></div>`;
  }
  el.onsubmit = e => {
    e.preventDefault(); if (e.target.id !== 'pp-add') return;
    const name = el.querySelector('#pp-name').value.trim(), email = el.querySelector('#pp-email').value.trim(), role = el.querySelector('#pp-role').value;
    let sites = [...el.querySelector('#pp-sites').selectedOptions].map(o => o.value); if (sites.includes('*') || !sites.length && (role === 'owner' || role === 'publisher')) sites = ['*'];
    const m = el.querySelector('#pp-msg');
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { m.className = 'small notice error'; m.textContent = t('Enter a name and a valid email address.', 'Escriba un nombre y un correo válido.'); el.querySelector(name ? '#pp-email' : '#pp-name').focus(); return; }
    if (!sites.length) { m.className = 'small notice error'; m.textContent = t('Choose at least one site.', 'Elija al menos un sitio.'); el.querySelector('#pp-sites').focus(); return; }
    const list = users(); if (list.some(u => u.email.toLowerCase() === email.toLowerCase())) { m.className = 'small notice error'; m.textContent = t('That person is already on the list.', 'Esa persona ya está en la lista.'); return; }
    writeJSON(WS_KEYS.users, [...list, { id: 'u' + Date.now().toString(36), name, email, role, sites }]); logActivity('user-added', { title: name, titleEs: name });
    draw(t(`${name} added as ${roleName(role)}. They sign in with their district account.`, `${name} agregado como ${roleName(role)}. Inicia sesión con su cuenta del distrito.`));
  };
  el.onchange = e => {
    const s = e.target.closest('[data-urole]'); if (!s) return;
    const list = users(), u = list.find(x => x.id === s.dataset.urole); if (!u) return;
    if (u.role === 'owner' && s.value !== 'owner' && list.filter(x => x.role === 'owner').length < 2) { s.value = 'owner'; el.querySelector('#pp-msg').textContent = t('Keep at least one district owner.', 'Mantenga al menos un propietario del distrito.'); return; }
    u.role = s.value; if ((u.role === 'owner' || u.role === 'publisher') && !u.sites.length) u.sites = ['*'];
    writeJSON(WS_KEYS.users, list); logActivity('user-changed', { title: u.name, titleEs: u.name }); draw(t(`${u.name} is now ${roleName(u.role)}.`, `${u.name} ahora es ${roleName(u.role)}.`));
  };
  el.onclick = e => {
    const b = e.target.closest('[data-udel]'); if (!b) return;
    const list = users(), u = list.find(x => x.id === b.dataset.udel); writeJSON(WS_KEYS.users, list.filter(x => x !== u)); logActivity('user-removed', { title: u.name, titleEs: u.name }); draw(t(`${u.name} removed.`, `${u.name} eliminado.`));
  };
  draw();
}

// ───────── Analytics (sample numbers, clearly labeled)
async function pAnalytics(el, ctx) {
  let days = 30;
  const seed = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
  function draw() {
    const k = days / 30, n = v => Math.round(v * k).toLocaleString(es ? 'es-US' : 'en-US');
    const pages = [['enrollment', 'Enrollment', 'Inscripción', 18400], ['district-calendar', 'District calendar', 'Calendario del distrito', 15200], ['meals', 'School meals', 'Comidas escolares', 11900], ['powerschool', 'MyPowerHub', 'MyPowerHub', 10300], ['transportation', 'Transportation', 'Transporte', 8700], ['board', 'Board of Education', 'Junta de Educación', 5200], ['athletics', 'Athletics', 'Atletismo', 4900], ['new-families', 'New families', 'Familias nuevas', 3600]];
    const searches = [['enrollment', 'inscripción', 4100], ['calendar', 'calendario', 3600], ['lunch menu', 'menú', 2900], ['bus', 'autobús', 2300], ['snow day', 'día de nieve', 1900], ['jobs', 'empleos', 1600], ['transcripts', 'expedientes', 1100], ['kindergarten', 'kínder', 980]];
    const none = [['summer camp', 'campamento de verano', 210], ['uniform policy', 'política de uniforme', 140], ['parking permit', 'permiso de estacionamiento', 90]];
    const levels = [['High', 41], ['Elementary', 33], ['Middle', 18], ['Program', 8]];
    const bars = (rows, max) => `<ul class="ws-bars">${rows.map(([label, v, href]) => `<li><span class="ws-bar-l">${href ? `<a href="${href}">${esc(label)}</a>` : esc(label)}</span><span class="ws-meter" aria-hidden="true"><span style="width:${Math.max(3, 100 * v / max)}%"></span></span><span class="ws-bar-v">${typeof v === 'number' && v > 100 ? n(v) : v + '%'}</span></li>`).join('')}</ul>`;
    el.innerHTML = head(t('Analytics', 'Estadísticas'), t('What families look for, by site and language, so every school knows what to keep up to date.', 'Lo que buscan las familias, por sitio e idioma, para que cada escuela sepa qué mantener al día.'), `<label class="sr-only" for="an-range">${t('Date range', 'Periodo')}</label><select id="an-range"><option value="7">${t('Last 7 days', 'Últimos 7 días')}</option><option value="30" ${days === 30 ? 'selected' : ''}>${t('Last 30 days', 'Últimos 30 días')}</option><option value="90" ${days === 90 ? 'selected' : ''}>${t('Last 90 days', 'Últimos 90 días')}</option></select>`)
    + `<p class="notice"><strong>${t('Sample numbers for the demonstration.', 'Números de muestra para la demostración.')}</strong> ${t('The live dashboard counts real visits with first-party, privacy-respecting measurement: no advertising trackers and no personal data.', 'El panel real cuenta visitas reales con medición propia y respetuosa de la privacidad: sin rastreadores publicitarios y sin datos personales.')}</p>
    <div class="ws-stats"><div class="ws-stat"><span class="ws-stat-n">${n(212000)}</span><span>${t('visits', 'visitas')}</span></div><div class="ws-stat"><span class="ws-stat-n">${n(538000)}</span><span>${t('pages viewed', 'páginas vistas')}</span></div><div class="ws-stat"><span class="ws-stat-n">23%</span><span>${t('in Spanish', 'en español')}</span></div><div class="ws-stat"><span class="ws-stat-n">71%</span><span>${t('on phones', 'en teléfonos')}</span></div></div>
    <div class="ws-cols"><section class="card" aria-labelledby="an-p"><h3 id="an-p">${t('Most visited pages', 'Páginas más visitadas')}</h3>${bars(pages.map(([id, en, sp, v]) => [t(en, sp), v, `page.html?id=${id}${L}`]), pages[0][3])}</section>
    <section class="card" aria-labelledby="an-s"><h3 id="an-s">${t('Top searches', 'Búsquedas principales')}</h3>${bars(searches.map(([en, sp, v]) => [t(en, sp), v]), searches[0][2])}</section></div>
    <div class="ws-cols"><section class="card" aria-labelledby="an-n"><h3 id="an-n">${t('Searches that found nothing', 'Búsquedas sin resultados')}</h3><p class="small muted">${t('The quickest way to find what is missing from the site.', 'La forma más rápida de saber qué falta en el sitio.')}</p><ul class="ws-plain">${none.map(([en, sp, v]) => `<li class="ws-alert-row"><span>“${esc(t(en, sp))}” · ${n(v)} ${t('searches', 'búsquedas')}</span><a class="btn compact" href="builder.html?new=1${L}">${t('Create a page', 'Crear una página')}</a></li>`).join('')}</ul></section>
    <section class="card" aria-labelledby="an-l"><h3 id="an-l">${t('Visits by school level', 'Visitas por nivel escolar')}</h3>${bars(levels.map(([l, v]) => [levelName(l), v]), 41)}<p class="small muted">${t('Each school sees its own numbers; the district sees everything.', 'Cada escuela ve sus números; el distrito ve todo.')}</p></section></div>`;
    el.querySelector('#an-range').onchange = e => { days = +e.target.value; draw(); el.querySelector('#an-range').focus(); };
  }
  draw();
}

// ───────── Backups & export
const BK_DB = 'd11-demo-backups';
const bk = mode => new Promise((ok, bad) => { const r = indexedDB.open(BK_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('cp'); r.onsuccess = () => ok(r.result.transaction('cp', mode).objectStore('cp')); r.onerror = () => bad(r.error); });
const req = r => new Promise((ok, bad) => { r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });
const STATE_KEYS = () => [DEMO_KEY, DEMO_SCHOOLS_KEY, LOG_KEY, ...Object.values(WS_KEYS)];
async function snapshot(label) {
  const data = Object.fromEntries(STATE_KEYS().map(k => [k, localStorage.getItem(k)]));
  const media = await listMedia();
  return { id: 'cp' + Date.now().toString(36), at: new Date().toISOString(), label, data, media, items: demoItems().length, size: media.reduce((s, m) => s + (m.size || 0), 0) + JSON.stringify(data).length };
}
async function applySnapshot(cp) {
  STATE_KEYS().forEach(k => { const v = cp.data[k]; try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} });
  await clearMedia();
  for (const m of cp.media || []) { const { id, ...rec } = m; await putMediaAt(id, rec); }
}
const toDataURL = blob => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
async function pBackups(el, ctx) {
  const pub = ctx.role === 'publisher';
  let list = [];
  try { list = (await req((await bk('readonly')).getAll())).sort((a, b) => b.at.localeCompare(a.at)); } catch {}
  el.innerHTML = head(t('Backups & export', 'Respaldos y exportación'), t('The District owns everything. Save a checkpoint before big changes, roll the whole site back in one click, or download a complete copy at any time.', 'Todo es propiedad del distrito. Guarde un punto de restauración antes de cambios grandes, regrese todo el sitio con un clic o descargue una copia completa en cualquier momento.'))
  + `<p class="small" id="bk-msg" role="status" aria-live="polite"></p>${pub ? `<div class="ws-cols"><form class="card" id="bk-new" novalidate><h3>${t('Save a checkpoint', 'Guardar un punto de restauración')}</h3><div class="field"><label for="bk-label">${t('Name it (optional)', 'Nombre (opcional)')}</label><input id="bk-label" maxlength="60" placeholder="${t('Before the winter update', 'Antes de la actualización de invierno')}"></div><p class="small muted">${t('Includes every page, post, alert, added site, photo, video, document, person and redirect.', 'Incluye cada página, publicación, aviso, sitio agregado, foto, video, documento, persona y redirección.')}</p><div class="buttons"><button class="btn primary compact" type="submit">${t('Save checkpoint', 'Guardar punto')}</button></div></form>
    <div class="card"><h3>${t('Export & import', 'Exportar e importar')}</h3><p class="small muted">${t('One file with all content and media. Readable JSON, so it can move to any system.', 'Un archivo con todo el contenido y los medios. JSON legible, para llevarlo a cualquier sistema.')}</p><div class="buttons"><button type="button" class="btn compact" id="bk-export">${t('Download everything', 'Descargar todo')}</button><label class="btn compact">${t('Import a file', 'Importar un archivo')}<input type="file" id="bk-import" accept="application/json,.json" class="sr-only"></label></div></div></div>` : pubOnly()}
  <div class="card"><h3>${t('Checkpoints', 'Puntos de restauración')} (${list.length})</h3>${list.length ? `<ul class="ws-plain">${list.map(c => `<li class="ws-alert-row"><div><strong>${esc(c.label || t('Checkpoint', 'Punto de restauración'))}</strong><div class="small muted">${esc(when(c.at))} · ${c.items} ${t('workspace items', 'elementos')} · ${(c.media || []).length} ${t('media files', 'archivos')} · ${esc(fmtBytes(c.size))}</div></div>${pub ? `<div class="buttons"><button type="button" class="btn compact" data-restore="${c.id}">${t('Restore', 'Restaurar')}</button><button type="button" class="btn compact" data-cpdel="${c.id}">${t('Delete', 'Eliminar')}</button></div>` : ''}</li>`).join('')}</ul>` : `<p class="muted">${t('No checkpoints yet.', 'Aún no hay puntos de restauración.')}</p>`}<p class="small muted">${t('On the live platform, automatic backups also run on their own and every single page keeps its own version history.', 'En la plataforma real también hay respaldos automáticos y cada página conserva su propio historial de versiones.')}</p></div>`;
  const msg = (m, err) => { const p = el.querySelector('#bk-msg'); p.textContent = m; p.className = 'small' + (err ? ' notice error' : ''); };
  const store = async cp => req((await bk('readwrite')).put(cp, cp.id));
  const rerender = m => pBackups(el, ctx).then(() => msg(m));
  el.onsubmit = async e => {
    e.preventDefault(); if (e.target.id !== 'bk-new') return;
    try { const label = el.querySelector('#bk-label').value.trim(); await store(await snapshot(label)); logActivity('checkpoint', { title: label, titleEs: label }); rerender(t('Checkpoint saved.', 'Punto de restauración guardado.')); }
    catch { msg(t('This browser blocked saving the checkpoint.', 'Este navegador bloqueó el guardado.'), true); }
  };
  el.onclick = async e => {
    const b = e.target.closest('[data-restore],[data-cpdel],#bk-export'); if (!b) return;
    if (b.id === 'bk-export') {
      b.disabled = true; msg(t('Preparing the file…', 'Preparando el archivo…'));
      const cp = await snapshot('export'), media = [];
      for (const m of cp.media) media.push({ id: m.id, name: m.name, type: m.type, size: m.size, data: await toDataURL(m.blob) });
      const data = Object.fromEntries(Object.entries(cp.data).map(([k, v]) => [k, v == null ? null : JSON.parse(v)]));
      download(`d11-site-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ format: 'd11-site-export', version: 1, exportedAt: cp.at, data, media }, null, 1));
      b.disabled = false; msg(t('Downloaded. The file contains every page, post, setting and media file from this workspace.', 'Descargado. El archivo contiene cada página, publicación, ajuste y archivo de este espacio.')); return;
    }
    if (b.dataset.cpdel) { if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = t('Confirm delete', 'Confirmar'); b.classList.add('danger'); return; } await req((await bk('readwrite')).delete(b.dataset.cpdel)); rerender(t('Checkpoint deleted.', 'Punto eliminado.')); return; }
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = t('Confirm: replace current site', 'Confirmar: reemplazar el sitio actual'); b.classList.add('danger'); return; }
    const cp = await req((await bk('readonly')).get(b.dataset.restore)); if (!cp) return;
    await store(await snapshot(t('Automatic: before restoring', 'Automático: antes de restaurar')));
    await applySnapshot(cp); logActivity('restore', { title: cp.label || when(cp.at), titleEs: cp.label || when(cp.at) }); ctx.changed();
    rerender(t('Restored. The site is back to that checkpoint. (A checkpoint of what you had was saved first, just in case.)', 'Restaurado. El sitio volvió a ese punto. (Antes se guardó un punto con lo que tenía, por si acaso.)'));
  };
  el.onchange = async e => {
    if (e.target.id !== 'bk-import') return;
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()); if (j.format !== 'd11-site-export' || !j.data) throw 0;
      await store(await snapshot(t('Automatic: before import', 'Automático: antes de importar')));
      const media = []; for (const m of j.media || []) { const blob = await (await fetch(m.data)).blob(); media.push({ id: m.id, blob, name: m.name, type: m.type, size: m.size }); }
      await applySnapshot({ data: Object.fromEntries(STATE_KEYS().map(k => [k, j.data[k] == null ? null : JSON.stringify(j.data[k])])), media });
      logActivity('import', { title: f.name, titleEs: f.name }); ctx.changed(); rerender(t('Imported. Everything from the file is now in the workspace.', 'Importado. Todo lo del archivo está ahora en el espacio.'));
    } catch { msg(t('That file is not a D11 site export.', 'Ese archivo no es una exportación del sitio D11.'), true); }
    e.target.value = '';
  };
}

// ───────── Activity log (audit trail)
const GROUPS = { publishing: ['published', 'submitted', 'drafted', 'scheduled', 'updated', 'restored', 'removed'], approvals: ['approved', 'returned'], alerts: ['ended'], media: ['media-added', 'media-removed'], settings: ['site-added', 'user-added', 'user-changed', 'user-removed', 'redirect-added', 'redirect-removed', 'checkpoint', 'restore', 'import', 'request'] };
async function pActivity(el, ctx) {
  let g = 'all', role = 'all', q = '';
  el.innerHTML = head(t('Activity log', 'Registro de actividad'), t('A permanent record of every change: who did what, on which site, and when. Staff cannot edit or erase it.', 'Un registro permanente de cada cambio: quién hizo qué, en qué sitio y cuándo. El personal no puede editarlo ni borrarlo.'), `<button type="button" class="btn compact" id="ac-csv">${t('Export (CSV)', 'Exportar (CSV)')}</button>`)
  + `<div class="card ws-filters"><div class="field grow"><label for="ac-q">${t('Search', 'Buscar')}</label><input id="ac-q" type="search"></div><div class="field"><label for="ac-g">${t('Kind of change', 'Tipo de cambio')}</label><select id="ac-g"><option value="all">${t('Everything', 'Todo')}</option><option value="publishing">${t('Publishing', 'Publicación')}</option><option value="approvals">${t('Approvals', 'Aprobaciones')}</option><option value="alerts">${t('Alerts', 'Avisos')}</option><option value="media">${t('Media', 'Medios')}</option><option value="settings">${t('Sites, people & settings', 'Sitios, personas y ajustes')}</option></select></div><div class="field"><label for="ac-r">${t('Who', 'Quién')}</label><select id="ac-r"><option value="all">${t('Anyone', 'Cualquiera')}</option>${Object.keys(ROLES).map(r => `<option value="${r}">${esc(roleName(r))}</option>`).join('')}</select></div></div><div id="ac-list"></div>`;
  const list = () => readLog().filter(e => (g === 'all' || GROUPS[g].includes(e.action) || (g === 'alerts' && e.kind === 'alert')) && (role === 'all' || e.role === role) && (!q || [e.title, e.titleEs, e.note, ctx.scopeName(e.scope || '')].join(' ').toLowerCase().includes(q.toLowerCase())));
  const draw = () => { const l = list(); el.querySelector('#ac-list').innerHTML = l.length ? `<div class="card"><p class="small muted">${t(`${l.length} entries`, `${l.length} entradas`)}</p><ul class="ws-logs">${l.slice(0, 150).map(e => logLine(e, ctx.scopeName)).join('')}</ul></div>` : `<div class="card"><p class="muted">${readLog().length ? t('No entries match.', 'Ninguna entrada coincide.') : t('Nothing recorded yet. Publish, approve or upload something and it appears here.', 'Aún no hay registros. Publique, apruebe o suba algo y aparecerá aquí.')}</p></div>`; };
  el.querySelector('#ac-q').addEventListener('input', e => { q = e.target.value.trim(); draw(); });
  el.querySelector('#ac-g').addEventListener('change', e => { g = e.target.value; draw(); });
  el.querySelector('#ac-r').addEventListener('change', e => { role = e.target.value; draw(); });
  el.querySelector('#ac-csv').onclick = () => download('d11-activity-log.csv', '﻿' + csv([['When', 'Who', 'Action', 'Title', 'Type', 'Site', 'Note'], ...list().map(e => [e.at, ROLES[e.role]?.[0] || e.role, ACTIONS[e.action]?.[0] || e.action, e.title || '', e.kind || '', e.scope ? ctx.scopeName(e.scope) : '', e.note || ''])]), 'text/csv;charset=utf-8');
  draw();
}

// ───────── Help & support
const GUIDES = [
  ['Post a news story or event', 'Publicar una noticia o evento', ['Open Create & edit and choose the site.', 'Pick “News story” or “Event” and, if you like, a template.', 'Write the title and text in English and Spanish. Add a photo and describe it.', 'Publish, or submit it for approval. Events also appear on the district events calendar.'], ['Abra Crear y editar y elija el sitio.', 'Elija “Noticia” o “Evento” y, si quiere, una plantilla.', 'Escriba el título y el texto en inglés y español. Agregue una foto y descríbala.', 'Publique o envíe para aprobación. Los eventos también aparecen en el calendario del distrito.'], '#create?kind=news'],
  ['Send an emergency alert', 'Enviar un aviso de emergencia', ['Open Emergency alerts.', 'Pick a template: delay, closure, early release, bus delays, building closure or all clear.', 'Choose the sites and when the alert should end on its own.', 'Check both languages in the preview and publish. Calls and texts still go out through SchoolMessenger.'], ['Abra Avisos de emergencia.', 'Elija una plantilla: retraso, cierre, salida temprana, autobuses, cierre de edificio o todo normal.', 'Elija los sitios y cuándo debe terminar el aviso.', 'Revise ambos idiomas en la vista previa y publique. Las llamadas y textos siguen saliendo por SchoolMessenger.'], '#alerts'],
  ['Build a page with photos and video', 'Crear una página con fotos y video', ['Open the page builder.', 'Insert blocks or choose a ready-made layout.', 'Drag photos, videos and PDFs onto the page, or pick photos from the media library.', 'Preview it on a phone, then publish.'], ['Abra el editor de páginas.', 'Inserte bloques o elija un diseño listo.', 'Arrastre fotos, videos y PDF a la página, o elija fotos de la biblioteca.', 'Véala en el teléfono y publique.'], 'builder.html?new=1' + L],
  ['Make a classroom page (teachers)', 'Crear una página de clase (docentes)', ['Choose “Classroom page” in the page builder.', 'Fill in your contact card, upcoming dates, schedule and supply list.', 'Add a conference sign-up if you need one.', 'Duplicate it for each class you teach.'], ['Elija “Página de clase” en el editor de páginas.', 'Complete su tarjeta de contacto, fechas, horario y lista de útiles.', 'Agregue citas para conferencias si las necesita.', 'Duplíquela para cada clase.'], 'builder.html?layout=classroom' + L],
  ['Approve or send back a submission', 'Aprobar o devolver un envío', ['Open Approvals as a district publisher.', 'Read both languages side by side and check the automatic checks.', 'Approve to publish right away, or add a note and send it back.'], ['Abra Aprobaciones como publicador del distrito.', 'Lea ambos idiomas lado a lado y revise las verificaciones automáticas.', 'Apruebe para publicar de inmediato, o agregue una nota y devuélvalo.'], '#approvals'],
  ['Fix accessibility issues', 'Corregir problemas de accesibilidad', ['Open Site health.', 'Each page with a problem lists exactly what to fix.', 'Choose “Fix it” to open the page right where you need it.'], ['Abra Salud del sitio.', 'Cada página con un problema indica exactamente qué corregir.', 'Elija “Corregir” para abrir la página donde lo necesita.'], '#health'],
  ['Undo a mistake', 'Deshacer un error', ['In Create & edit, choose “Restore previous version” on any item.', 'In the page builder, use Undo, or reopen an earlier saved version.', 'For bigger changes, restore a checkpoint in Backups & export.'], ['En Crear y editar, elija “Restaurar versión anterior” en cualquier elemento.', 'En el editor de páginas, use Deshacer o abra una versión anterior.', 'Para cambios mayores, restaure un punto en Respaldos y exportación.'], '#backups'],
  ['Give someone access', 'Dar acceso a alguien', ['Open People & permissions as a district owner or publisher.', 'Add their district email, choose a role and their sites.', 'They sign in with their district account. No new password.'], ['Abra Personas y permisos como propietario o publicador.', 'Agregue su correo del distrito, elija un rol y sus sitios.', 'Inicia sesión con su cuenta del distrito. Sin contraseña nueva.'], '#people']
];
async function pHelp(el, ctx) {
  const reqs = () => readJSON(WS_KEYS.requests, []);
  function draw(note) {
    const list = reqs();
    el.innerHTML = head(t('Help & support', 'Ayuda y soporte'), t('Step-by-step guides, and a direct line to the owner. Want something changed? We will customize it any way you want, usually the same day.', 'Guías paso a paso y comunicación directa con el propietario. ¿Quiere cambiar algo? Lo personalizamos como usted quiera, normalmente el mismo día.'))
    + `<div class="ws-cols"><div><section class="card ws-owner" aria-labelledby="hp-o"><div class="eyebrow">${t('Your direct contact', 'Su contacto directo')}</div><h3 id="hp-o">${esc(bid.contactName)}, ${esc(t(bid.contactTitle, 'Propietario'))}</h3><p class="small">${esc(bid.vendor)}</p><p><a href="tel:${esc(bid.contactPhone.replace(/\D/g, ''))}">${esc(bid.contactPhone)}</a><br><a href="mailto:${esc(bid.contactEmail)}">${esc(bid.contactEmail)}</a></p><p class="small muted">${t('No call centers and no ticket queues. Training for every school editor is included in the flat rate.', 'Sin centros de llamadas ni filas de tickets. La capacitación para cada editor escolar está incluida en la tarifa fija.')}</p></section>
      <form class="card" id="hp-form" novalidate style="margin-top:20px"><h3>${t('Request a change', 'Solicitar un cambio')}</h3><div class="form-grid"><div class="field"><label for="hp-type">${t('What do you need?', '¿Qué necesita?')}</label><select id="hp-type"><option value="custom">${t('A customization', 'Una personalización')}</option><option value="feature">${t('A new feature', 'Una función nueva')}</option><option value="content">${t('Help with content', 'Ayuda con contenido')}</option><option value="training">${t('Training', 'Capacitación')}</option><option value="problem">${t('Something is not working', 'Algo no funciona')}</option></select></div><div class="field"><label for="hp-site">${t('Which site?', '¿Qué sitio?')}</label><select id="hp-site"><option value="district">${t('District site', 'Sitio del distrito')}</option><option value="all">${t('All sites', 'Todos los sitios')}</option>${ctx.schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></div></div><div class="field" style="margin-top:12px"><label for="hp-text">${t('Describe it', 'Descríbalo')}</label><textarea id="hp-text" rows="4" maxlength="1500"></textarea></div><p class="small" id="hp-msg" role="status" aria-live="polite">${note || ''}</p><div class="buttons"><button class="btn primary compact" type="submit">${t('Send request', 'Enviar solicitud')}</button></div></form>
      ${list.length ? `<section class="card" style="margin-top:20px" aria-labelledby="hp-r"><h3 id="hp-r">${t('Your requests', 'Sus solicitudes')}</h3><ul class="ws-plain">${list.map(r => `<li class="ws-alert-row"><div><strong>${esc(r.typeLabel)}</strong> · ${esc(ctx.scopeName(r.site))}<div class="small">${esc(r.text)}</div><div class="small muted">${esc(when(r.at))}</div></div><span class="badge gold">${t('Received', 'Recibida')}</span></li>`).join('')}</ul><p class="small muted">${t('In this demo, requests stay in your browser. On the live platform they go straight to the owner.', 'En esta demo, las solicitudes se quedan en su navegador. En la plataforma real llegan directo al propietario.')}</p></section>` : ''}</div>
    <section class="card" aria-labelledby="hp-g"><h3 id="hp-g">${t('How do I…', '¿Cómo…')}</h3>${GUIDES.map(([en, sp, sEn, sEs, href]) => `<details class="ws-guide"><summary>${t(en, sp)}</summary><ol>${(es ? sEs : sEn).map(s => `<li>${esc(s)}</li>`).join('')}</ol><a class="btn compact" href="${href}" aria-label="${esc(t('Do it now: ', 'Hacerlo ahora: ') + t(en, sp))}">${t('Do it now', 'Hacerlo ahora')}</a></details>`).join('')}<p class="small muted" style="margin-top:14px">${t('Everything works with a keyboard and screen reader, on any phone, tablet or computer.', 'Todo funciona con teclado y lector de pantalla, en cualquier teléfono, tableta o computadora.')}</p></section></div>`;
  }
  el.onsubmit = e => {
    e.preventDefault(); if (e.target.id !== 'hp-form') return;
    const text = el.querySelector('#hp-text').value.trim(), m = el.querySelector('#hp-msg');
    if (text.length < 5) { m.className = 'small notice error'; m.textContent = t('Tell us a little about what you need.', 'Cuéntenos un poco lo que necesita.'); el.querySelector('#hp-text').focus(); return; }
    const sel = el.querySelector('#hp-type'), r = { at: new Date().toISOString(), type: sel.value, typeLabel: sel.selectedOptions[0].textContent, site: el.querySelector('#hp-site').value, text };
    writeJSON(WS_KEYS.requests, [r, ...reqs()].slice(0, 50)); logActivity('request', { title: r.typeLabel, titleEs: r.typeLabel, scope: r.site });
    draw(t('Request sent. The owner usually handles customizations the same day.', 'Solicitud enviada. El propietario normalmente atiende las personalizaciones el mismo día.'));
  };
  draw();
}

export const ADMIN_PANELS = { media: pMedia, health: pHealth, redirects: pRedirects, brand: pBrand, people: pPeople, analytics: pAnalytics, backups: pBackups, activity: pActivity, help: pHelp };

const st = document.createElement('style');
st.textContent = `.ws-drop{display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;text-align:center;border:2px dashed #9db4c9;border-radius:var(--radius);padding:26px 16px;background:#fbfdff;cursor:pointer}.ws-drop.over{background:#eef4fa;border-color:var(--navy)}.ws-drop input{margin-top:8px;max-width:100%}
.ws-media{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}.ws-media-item{padding:0;overflow:hidden;display:flex;flex-direction:column}.ws-thumb{aspect-ratio:4/3;background:#e9eef3;display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--navy);letter-spacing:.08em}.ws-thumb img{width:100%;height:100%;object-fit:cover}
.ws-media-body{padding:12px 14px;display:flex;flex-direction:column;gap:6px}.ws-media-body .field{min-width:0}.ws-media-name{overflow-wrap:anywhere}.ws-media.mini{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}.ws-media.mini li{display:flex;flex-direction:column;gap:4px}.ws-media.mini img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px}
.ws-chips{display:flex;flex-wrap:wrap;gap:8px 16px}.ws-issue{margin-bottom:12px}.ws-issues{margin:8px 0 0;padding-left:0;list-style:none}.ws-issues li{margin:4px 0}.ws-issues li.error span{color:#b3261e;font-weight:700}.ws-issues li.warn span{color:#8a5a00;font-weight:700}
[data-show][aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
.ws-swatches{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}.ws-swatches li{display:flex;flex-direction:column;gap:4px;align-items:flex-start}.ws-swatch{width:100%;height:64px;border-radius:12px;border:1px solid var(--line)}
.ws-type-h{font-size:1.9rem;font-weight:750;color:var(--navy);margin:8px 0}
.ws-logos{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}.ws-logos li{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;border:1px solid var(--line);border-radius:12px;padding:12px}.ws-logos img{width:64px;height:64px;object-fit:contain}
.ws-scroll{overflow-x:auto}.ws-matrix td{text-align:center}.ws-matrix th[scope=row]{font-weight:550;text-transform:none;letter-spacing:0;font-size:.95rem;color:var(--ink);background:#fff}
.ws-bars{list-style:none;padding:0;margin:0}.ws-bars li{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 0}.ws-meter{height:10px;background:#eaf1f7;border-radius:6px;overflow:hidden}.ws-meter span{display:block;height:100%;background:var(--blue);border-radius:6px}.ws-bar-v{font-variant-numeric:tabular-nums;font-weight:650;font-size:.9rem}
.ws-owner{border-top:4px solid var(--gold)}.ws-owner h3{margin:4px 0}.ws-guide{border-bottom:1px solid var(--line);padding:10px 0}.ws-guide summary{cursor:pointer;font-weight:650}.ws-guide ol{margin:10px 0}
.ws-matrix-list{display:none}.ws-matrix-list h4{margin:14px 0 4px}.ws-matrix-list ul{margin:0;padding-left:20px}
@media (max-width:700px){.ws-matrix{display:none!important}.ws-matrix-list{display:block}}`;
document.head.append(st);
