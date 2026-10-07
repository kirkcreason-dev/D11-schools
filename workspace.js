// Staff workspace: one place for everything school and district staff do on the platform.
import {t, esc, es, route, schoolURL, levelName, download} from './common.js';
import {demoItems, saveDemoItems, readLog, currentRole, ROLE_KEY} from './static-api.js';
import {renderEditor} from './demo-editor.js';
import {hubEvents, TYPES, TIERS} from './events-hub.js';
import {calendarICS} from './calendar-utils.js';
import {kindName, KIND, STATUS, statusOf, badge, allContent, titleOf, viewURL, siteURL, when, day, ago, csv, roleName, issuesOf, healthReport, logLine} from './workspace-core.js';
import {ADMIN_PANELS} from './workspace-admin.js';

const TABS = [
  ['dashboard', 'Dashboard', 'Panel', 'overview'],
  ['create', 'Create & edit', 'Crear y editar', 'content'],
  ['builder', 'Page builder', 'Editor de páginas', 'content', true],
  ['content', 'All content', 'Todo el contenido', 'content'],
  ['approvals', 'Approvals', 'Aprobaciones', 'content'],
  ['media', 'Media library', 'Biblioteca de medios', 'content'],
  ['calendar', 'Calendar', 'Calendario', 'content'],
  ['alerts', 'Emergency alerts', 'Avisos de emergencia', 'content'],
  ['sites', 'Schools & sites', 'Escuelas y sitios', 'sites'],
  ['health', 'Site health', 'Salud del sitio', 'sites'],
  ['redirects', 'Redirects', 'Redirecciones', 'sites'],
  ['brand', 'Brand kit', 'Identidad visual', 'sites'],
  ['people', 'People & permissions', 'Personas y permisos', 'admin'],
  ['analytics', 'Analytics', 'Estadísticas', 'admin'],
  ['backups', 'Backups & export', 'Respaldos y exportación', 'admin'],
  ['activity', 'Activity log', 'Registro de actividad', 'admin'],
  ['help', 'Help & support', 'Ayuda y soporte', 'help']
];
const GROUPS = { overview: ['Overview', 'Resumen'], content: ['Content', 'Contenido'], sites: ['Sites', 'Sitios'], admin: ['Administration', 'Administración'], help: ['Support', 'Soporte'] };
const L = es ? '&lang=es' : '', LQ = es ? '?lang=es' : '';

export async function renderWorkspace(root) {
  ensureStyles();
  let schools = [];
  try { schools = await (await fetch('schools-data.json')).json(); } catch {}
  const byId = Object.fromEntries(schools.map(s => [s.id, s]));
  const scopeName = s => s === 'all' ? t('District + all schools', 'Distrito y todas las escuelas') : s === 'district' ? t('District site', 'Sitio del distrito') : (byId[s]?.name || s);
  const ctx = {
    schools, byId, scopeName, stamp: 0,
    get role() { return currentRole(); },
    changed() { ctx.stamp++; badges(); },
    go(tab, params) { const h = '#' + tab + (params ? '?' + new URLSearchParams(params) : ''); if (location.hash === h) show(tab, new URLSearchParams(params || {}), true); else location.hash = h; }
  };

  const groups = Object.entries(GROUPS).map(([g, [en, sp]]) => `<p class="ws-group" id="ws-g-${g}">${t(en, sp)}</p><ul aria-labelledby="ws-g-${g}">${TABS.filter(x => x[3] === g).map(([id, en2, sp2, , ext]) => ext
    ? `<li><a href="builder.html${LQ}">${t(en2, sp2)} <span class="small muted">${t('(full screen)', '(pantalla completa)')}</span></a></li>`
    : `<li><a href="#${id}" data-tab="${id}">${t(en2, sp2)}<span class="ws-count" data-count="${id}" hidden></span></a></li>`).join('')}</ul>`).join('');
  root.innerHTML = `<div class="ws-bar card"><div><div class="eyebrow">${t('Staff workspace', 'Espacio del personal')}</div><p class="ws-sub"><strong>${t('Everything school and district staff need, in one place.', 'Todo lo que el personal escolar y del distrito necesita, en un solo lugar.')}</strong><br><span class="small muted">${t('This is a working demo: changes stay only in this browser.', 'Esta es una demo funcional: los cambios se guardan solo en este navegador.')}</span></p></div>
    <div class="ws-role"><span id="ws-role-label" class="small"><strong>${t('Signed in as', 'Sesión iniciada como')}</strong></span><div class="buttons" role="group" aria-labelledby="ws-role-label"><button type="button" class="btn compact" data-role="editor">${t('School editor', 'Editor escolar')}</button><button type="button" class="btn compact" data-role="publisher">${t('District publisher', 'Publicador del distrito')}</button></div></div></div>
  <div class="ws-jump field"><label for="ws-jump">${t('Go to', 'Ir a')}</label><select id="ws-jump">${Object.entries(GROUPS).map(([g, [en, sp]]) => `<optgroup label="${t(en, sp)}">${TABS.filter(x => x[3] === g).map(([id, en2, sp2, , ext]) => `<option value="${ext ? 'builder' : id}">${t(en2, sp2)}${ext ? ' ↗' : ''}</option>`).join('')}</optgroup>`).join('')}</select></div>
  <div class="ws-layout"><nav class="ws-nav" aria-label="${t('Workspace sections', 'Secciones del espacio de trabajo')}">${groups}</nav>
  <div class="ws-main">${TABS.filter(x => !x[4]).map(([id]) => `<div class="ws-panel" id="ws-p-${id}" hidden></div>`).join('')}</div></div>`;

  const PANELS = { dashboard: pDashboard, create: pCreate, content: pContent, approvals: pApprovals, calendar: pCalendar, alerts: pAlerts, sites: pSites, ...ADMIN_PANELS };
  let current = null;
  function syncRole() { root.querySelectorAll('.ws-bar [data-role]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === ctx.role))); }
  function badges() {
    const n = demoItems().filter(x => x.status === 'review').length, h = healthReport().errors.length;
    const set = (id, v, label) => { const el = root.querySelector(`[data-count="${id}"]`); el.hidden = !v; el.textContent = v; el.setAttribute('aria-label', label); };
    set('approvals', n, t(`${n} waiting`, `${n} pendientes`)); set('health', h, t(`${h} with issues`, `${h} con problemas`));
  }
  async function show(tab, params, focus) {
    if (!PANELS[tab]) tab = 'dashboard';
    current = tab;
    root.querySelectorAll('[data-tab]').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    root.querySelectorAll('.ws-panel').forEach(p => p.hidden = p.id !== 'ws-p-' + tab);
    root.querySelector('#ws-jump').value = tab;
    const el = root.querySelector('#ws-p-' + tab);
    try { await PANELS[tab](el, ctx, params || new URLSearchParams()); }
    catch (e) { console.warn(e); el.innerHTML = `<p class="notice error">${t('This section could not load in this browser.', 'Esta sección no pudo cargarse en este navegador.')}</p>`; }
    badges();
    if (focus) { const h = el.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } root.scrollIntoView({ block: 'start' }); }
  }
  ctx.show = show;
  function fromHash(focus) { const [tab, q] = location.hash.slice(1).split('?'); show(tab === 'try' ? 'create' : tab || 'dashboard', new URLSearchParams(q || ''), focus); }
  window.addEventListener('hashchange', () => fromHash(true));
  root.querySelector('#ws-jump').addEventListener('change', e => { if (e.target.value === 'builder') location.href = 'builder.html' + LQ; else location.hash = e.target.value; });
  root.addEventListener('click', e => {
    const r = e.target.closest('.ws-bar [data-role]'); if (!r) return;
    try { localStorage.setItem(ROLE_KEY, r.dataset.role); } catch {}
    syncRole(); ctx.changed(); show(current, new URLSearchParams(location.hash.split('?')[1] || ''));
  });
  syncRole(); fromHash(!!location.hash && location.hash !== '#dashboard');
}

// ───────── Dashboard
async function pDashboard(el, ctx) {
  const items = allContent(), mine = demoItems(), pub = ctx.role === 'publisher';
  const count = s => mine.filter(x => statusOf(x) === s).length;
  const live = items.filter(x => statusOf(x) === 'live' && x.kind !== 'alert').length;
  const alerts = items.filter(x => x.kind === 'alert' && statusOf(x) === 'live');
  const h = healthReport(), queue = mine.filter(x => x.status === 'review'), returned = mine.filter(x => x.status === 'draft' && x.returnNote);
  const hr = new Date().getHours(), greet = hr < 12 ? t('Good morning', 'Buenos días') : hr < 17 ? t('Good afternoon', 'Buenas tardes') : t('Good evening', 'Buenas noches');
  const stat = (href, n, en, sp, tone = '') => `<a class="ws-stat ${tone}" href="${href}"><span class="ws-stat-n">${n}</span><span>${t(en, sp)}</span></a>`;
  const att = [];
  if (queue.length) att.push(pub ? [`#approvals`, t(`${queue.length} submission${queue.length > 1 ? 's are' : ' is'} waiting for your approval`, `${queue.length} envío(s) esperan su aprobación`), 'gold']
    : [`#approvals`, t(`${queue.length} of your submissions ${queue.length > 1 ? 'are' : 'is'} waiting for district approval`, `${queue.length} de sus envíos esperan la aprobación del distrito`), '']);
  if (returned.length) att.push(['#content?status=draft', t(`${returned.length} draft${returned.length > 1 ? 's were' : ' was'} sent back with a note`, `${returned.length} borrador(es) devuelto(s) con una nota`), 'gold']);
  if (h.errors.length) att.push(['#health', t(`${h.errors.length} page${h.errors.length > 1 ? 's have' : ' has'} accessibility or content issues to fix`, `${h.errors.length} página(s) con problemas de accesibilidad o contenido`), 'red']);
  const drafts = mine.filter(x => x.status === 'draft' && !x.returnNote).length;
  if (drafts) att.push(['#content?status=draft', t(`${drafts} draft${drafts > 1 ? 's' : ''} not yet submitted`, `${drafts} borrador(es) sin enviar`), '']);
  alerts.filter(x => x.expiresAt && new Date(x.expiresAt) - Date.now() < 864e5).forEach(x => att.push(['#alerts', t(`Alert “${x.title}” ends ${ago(x.expiresAt).replace(/^in /, 'in ')}`, `El aviso “${x.titleEs}” termina ${ago(x.expiresAt)}`), '']));
  const upcoming = [
    ...mine.filter(x => statusOf(x) === 'scheduled').map(x => ({ at: x.publishAt, text: `${t('Goes live:', 'Se publica:')} ${titleOf(x)}`, href: '#content?status=scheduled', tag: t('Scheduled', 'Programado') })),
    ...hubEvents(ctx.schools).map(e => ({ at: e.eventAt, text: es ? e.titleEs || e.title : e.title, href: '#calendar', tag: e.sample ? t('Sample', 'Muestra') : e.official ? t('District calendar', 'Calendario del distrito') : t('Published', 'Publicado') }))
  ].filter(x => new Date(x.at) - Date.now() < 10 * 864e5).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 7);
  const qa = (href, en, sp, sub, subEs) => `<a class="ws-action" href="${href}"><strong>${t(en, sp)}</strong><span class="small muted">${t(sub, subEs)}</span></a>`;
  const log = readLog().slice(0, 6);
  el.innerHTML = `<div class="ws-head"><div><div class="eyebrow">${esc(roleName(ctx.role))}</div><h2>${greet}.</h2><p class="muted">${pub ? t('Here is what is happening across the district site and all school sites.', 'Esto es lo que pasa en el sitio del distrito y en todos los sitios escolares.') : t('Here is what is happening on your school sites.', 'Esto es lo que pasa en sus sitios escolares.')}</p></div></div>
  <div class="ws-stats">${stat('#content?status=live', live, 'Live pages & posts', 'Páginas y publicaciones')}${stat('#approvals', queue.length, 'Awaiting approval', 'Pendientes de aprobación', queue.length ? 'gold' : '')}${stat('#content?status=scheduled', count('scheduled'), 'Scheduled', 'Programados')}${stat('#content?status=draft', count('draft'), 'Drafts', 'Borradores')}${stat('#alerts', alerts.length, 'Active alerts', 'Avisos activos')}${stat('#sites', ctx.schools.length + 1, 'Sites', 'Sitios')}${stat('#health', h.score + '%', 'Pages passing every check', 'Páginas que pasan todo', h.score < 100 ? 'red' : 'green')}</div>
  <div class="ws-cols"><section class="card" aria-labelledby="ws-att"><h3 id="ws-att">${t('Needs your attention', 'Requiere su atención')}</h3>${att.length ? `<ul class="ws-todo">${att.map(([href, text, tone]) => `<li class="${tone}"><a href="${href}">${esc(text)}</a></li>`).join('')}</ul>` : `<p class="ws-clear">✓ ${t('You’re all caught up.', 'Está todo al día.')}</p>`}
    <h3 style="margin-top:22px">${t('Quick actions', 'Acciones rápidas')}</h3><div class="ws-actions">
    ${qa('#create?kind=news', 'Post a news story', 'Publicar una noticia', 'Photo, both languages, done', 'Foto, dos idiomas, listo')}
    ${qa('#create?kind=event', 'Add an event', 'Agregar un evento', 'Shows on the district calendar too', 'También aparece en el calendario del distrito')}
    ${qa('builder.html?new=1' + L, 'Build a page', 'Crear una página', 'Photos, video, files, FAQs', 'Fotos, video, archivos, preguntas')}
    ${qa('builder.html?layout=classroom' + L, 'Make a classroom page', 'Crear una página de clase', 'For teachers, ready in minutes', 'Para docentes, lista en minutos')}
    ${qa('#alerts', 'Send an emergency alert', 'Enviar un aviso de emergencia', 'Delays, closures, all clear', 'Retrasos, cierres, todo normal')}
    ${qa('#media', 'Upload photos & files', 'Subir fotos y archivos', 'Reuse them on any page', 'Reutilícelos en cualquier página')}</div></section>
  <div><section class="card" aria-labelledby="ws-up"><h3 id="ws-up">${t('Coming up', 'Próximamente')}</h3>${upcoming.length ? `<ul class="ws-agenda">${upcoming.map(x => `<li><span class="ws-when">${esc(day(x.at))}</span><a href="${x.href}">${esc(x.text)}</a> <span class="badge">${esc(x.tag)}</span></li>`).join('')}</ul>` : `<p class="muted">${t('Nothing in the next ten days.', 'Nada en los próximos diez días.')}</p>`}<a class="btn compact" href="#calendar">${t('Open the calendar', 'Abrir el calendario')}</a></section>
  <section class="card" aria-labelledby="ws-rec" style="margin-top:20px"><h3 id="ws-rec">${t('Recent activity', 'Actividad reciente')}</h3>${log.length ? `<ul class="ws-logs">${log.map(e => logLine(e, ctx.scopeName)).join('')}</ul><a class="btn compact" href="#activity">${t('Full activity log', 'Registro completo')}</a>` : `<p class="muted">${t('Nothing yet. Every change anyone makes is recorded here: who, what and when.', 'Nada todavía. Cada cambio queda registrado aquí: quién, qué y cuándo.')}</p>`}</section></div></div>`;
}

// ───────── Create & edit (the quick editor)
async function pCreate(el, ctx, params) {
  if (!ctx.editor || ctx.editorStamp !== ctx.stamp) {
    el.innerHTML = '<div></div>';
    ctx.editor = await renderEditor(el.firstElementChild, { embedded: true });
    ctx.editorStamp = ctx.stamp;
  }
  const e = ctx.editor; if (!e) return;
  if (params.get('edit')) e.load(params.get('edit'));
  else if (params.get('newschool')) e.newSchool();
  else if (params.get('kind') || params.get('scope') || params.get('template')) e.start({ scope: params.get('scope'), kind: params.get('kind'), template: params.get('template'), when: params.get('when') });
}

// ───────── All content
async function pContent(el, ctx, params) {
  const f = { q: params.get('q') || '', site: params.get('site') || 'any', kind: params.get('type') || 'any', status: params.get('status') || 'any', source: params.get('source') || 'any' };
  let shown = 25;
  const opt = (v, label, cur) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(label)}</option>`;
  el.innerHTML = `<div class="ws-head"><div><h2>${t('All content', 'Todo el contenido')}</h2><p class="muted">${t('Every page, story, event and alert on the district site and every school site. Search, filter, edit, copy or unpublish.', 'Cada página, noticia, evento y aviso del distrito y de cada escuela. Busque, filtre, edite, copie o despublique.')}</p></div><div class="buttons"><a class="btn primary compact" href="#create">${t('+ New', '+ Nuevo')}</a><button type="button" class="btn compact" id="wc-csv">${t('Export list (CSV)', 'Exportar lista (CSV)')}</button></div></div>
  <div class="card ws-filters"><div class="field grow"><label for="wc-q">${t('Search', 'Buscar')}</label><input id="wc-q" type="search" value="${esc(f.q)}" placeholder="${t('Title or text', 'Título o texto')}"></div>
   <div class="field"><label for="wc-site">${t('Site', 'Sitio')}</label><select id="wc-site">${opt('any', t('All sites', 'Todos los sitios'), f.site)}${opt('district', t('District site', 'Sitio del distrito'), f.site)}${opt('all', t('Districtwide (all sites)', 'Todo el distrito'), f.site)}${ctx.schools.map(s => opt(s.id, s.name, f.site)).join('')}</select></div>
   <div class="field"><label for="wc-kind">${t('Type', 'Tipo')}</label><select id="wc-kind">${opt('any', t('All types', 'Todos'), f.kind)}${Object.keys(KIND).map(k => opt(k, kindName(k), f.kind)).join('')}</select></div>
   <div class="field"><label for="wc-status">${t('Status', 'Estado')}</label><select id="wc-status">${opt('any', t('Any status', 'Cualquier estado'), f.status)}${Object.entries(STATUS).map(([k, v]) => opt(k, t(v[0], v[1]), f.status)).join('')}</select></div>
   <div class="field"><label for="wc-source">${t('Created', 'Creado')}</label><select id="wc-source">${opt('any', t('Anywhere', 'En cualquier lugar'), f.source)}${opt('mine', t('In this workspace', 'En este espacio'), f.source)}${opt('builtin', t('Built into the demo', 'Incluido en la demo'), f.source)}</select></div></div>
  <p class="small" id="wc-msg" role="status" aria-live="polite"></p><div id="wc-list"></div>`;
  const $ = id => el.querySelector('#' + id), norm = s => String(s || '').toLowerCase();
  const list = () => allContent().filter(x => (f.site === 'any' || x.scope === f.site) && (f.kind === 'any' || x.kind === f.kind) && (f.status === 'any' || statusOf(x) === f.status)
    && (f.source === 'any' || (f.source === 'mine') === !x.builtin) && (!f.q || norm([x.title, x.titleEs, x.body, x.bodyEs].join(' ')).includes(norm(f.q))));
  function draw() {
    const rows = list(), ids = new Set(allContent().map(x => x.id));
    $('wc-list').innerHTML = rows.length ? `<p class="small muted">${t(`${rows.length} item${rows.length === 1 ? '' : 's'}`, `${rows.length} elemento(s)`)}</p><table class="ws-table"><caption class="sr-only">${t('Content', 'Contenido')}</caption><thead><tr><th scope="col">${t('Title', 'Título')}</th><th scope="col">${t('Type', 'Tipo')}</th><th scope="col">${t('Site', 'Sitio')}</th><th scope="col">${t('Status', 'Estado')}</th><th scope="col">${t('Updated', 'Actualizado')}</th><th scope="col"><span class="sr-only">${t('Actions', 'Acciones')}</span></th></tr></thead><tbody>${rows.slice(0, shown).map(x => {
      const st = statusOf(x), n = issuesOf(x, ids).filter(i => i.level === 'error').length;
      return `<tr><td data-label="${t('Title', 'Título')}"><a href="${esc(viewURL(x))}">${esc(titleOf(x))}</a>${x.builtin ? ` <span class="badge">${t('Built-in', 'Incluido')}</span>` : ''}${n ? ` <a class="badge red" href="#health">${t(`${n} issue${n > 1 ? 's' : ''}`, `${n} problema(s)`)}</a>` : ''}${x.returnNote && x.status === 'draft' ? `<div class="small muted">${t('Note:', 'Nota:')} ${esc(x.returnNote)}</div>` : ''}</td>
        <td data-label="${t('Type', 'Tipo')}">${esc(kindName(x.kind))}${x.blocks ? ` <span class="small muted">· ${t('builder', 'editor visual')}</span>` : ''}</td><td data-label="${t('Site', 'Sitio')}">${esc(ctx.scopeName(x.scope))}</td><td data-label="${t('Status', 'Estado')}">${badge(st)}${st === 'scheduled' ? `<div class="small muted">${esc(when(x.publishAt))}</div>` : ''}</td>
        <td data-label="${t('Updated', 'Actualizado')}">${x.builtin ? '—' : `<time datetime="${esc(x.publishedAt)}">${esc(ago(x.publishedAt))}</time>`}</td>
        <td class="ws-row-actions">${x.builtin ? `<button type="button" class="btn compact" data-copy="${esc(x.id)}">${t('Copy to edit', 'Copiar para editar')}</button>`
          : `<button type="button" class="btn compact" data-edit="${esc(x.id)}">${t('Edit', 'Editar')}</button>${x.kind !== 'home' ? `<button type="button" class="btn compact" data-copy="${esc(x.id)}">${t('Duplicate', 'Duplicar')}</button>` : ''}${st === 'live' || st === 'scheduled' ? `<button type="button" class="btn compact" data-unpub="${esc(x.id)}">${t('Unpublish', 'Despublicar')}</button>` : `<button type="button" class="btn compact" data-del="${esc(x.id)}">${t('Delete', 'Eliminar')}</button>`}`}</td></tr>`;
    }).join('')}</tbody></table>${rows.length > shown ? `<button type="button" class="btn compact" id="wc-more">${t(`Show more (${rows.length - shown})`, `Mostrar más (${rows.length - shown})`)}</button>` : ''}`
      : `<p class="card muted">${t('Nothing matches these filters.', 'Nada coincide con estos filtros.')}</p>`;
  }
  const msg = text => $('wc-msg').textContent = text;
  $('wc-q').addEventListener('input', () => { f.q = $('wc-q').value; shown = 25; draw(); });
  [['wc-site', 'site'], ['wc-kind', 'kind'], ['wc-status', 'status'], ['wc-source', 'source']].forEach(([id, k]) => $(id).addEventListener('change', () => { f[k] = $(id).value; shown = 25; draw(); }));
  $('wc-csv').onclick = () => download('d11-content-inventory.csv', '﻿' + csv([['Title', 'Spanish title', 'Type', 'Site', 'Status', 'Source', 'Last updated', 'Address'], ...list().map(x => [x.title, x.titleEs, KIND[x.kind]?.[0] || x.kind, ctx.scopeName(x.scope), STATUS[statusOf(x)][0], x.builtin ? 'Built-in' : 'Workspace', x.publishedAt || '', viewURL(x)])]), 'text/csv;charset=utf-8');
  el.onclick = e => {
    const b = e.target.closest('[data-edit],[data-copy],[data-unpub],[data-del],#wc-more'); if (!b) return;
    if (b.id === 'wc-more') { shown += 25; draw(); return; }
    if (b.dataset.edit) { const x = demoItems().find(i => i.id === b.dataset.edit); if (x?.blocks) location.href = `builder.html?id=${encodeURIComponent(x.id)}${L}`; else ctx.go('create', { edit: b.dataset.edit }); return; }
    const items = demoItems();
    if (b.dataset.copy) {
      const src = allContent().find(i => i.id === b.dataset.copy); if (!src) return;
      const { builtin, versions, returnNote, approvedAt, ...rest } = src;
      const copy = { ...JSON.parse(JSON.stringify(rest)), id: (src.blocks ? 'pb-' : `demo-${src.kind}-`) + Date.now().toString(36), status: 'draft', publishAt: null, publishedAt: new Date().toISOString(), title: src.title + (builtin ? '' : ' (copy)'), titleEs: src.titleEs + (builtin ? '' : ' (copia)'), versions: [],
        sections: (src.sections || []).map(s => ({ type: 'text', title: s.title || '', titleEs: s.titleEs || '', body: [s.body, s.linkLabel].filter(Boolean).join('\n'), bodyEs: [s.bodyEs, s.linkLabelEs].filter(Boolean).join('\n') })) };
      if (copy.kind === 'alert' && builtin) copy.expiresAt = new Date(Date.now() + 864e5).toISOString();
      saveDemoItems([copy, ...items]); ctx.changed(); f.source = 'any'; draw(); msg(t('Copied as a draft. Edit it, then publish.', 'Copiado como borrador. Edítelo y luego publíquelo.'));
    }
    if (b.dataset.unpub) { const x = items.find(i => i.id === b.dataset.unpub); x.status = 'draft'; x.publishAt = null; saveDemoItems(items); ctx.changed(); draw(); msg(t('Unpublished. It is now a draft and no longer on the site.', 'Despublicado. Ahora es un borrador y ya no aparece en el sitio.')); }
    if (b.dataset.del) {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = t('Confirm delete', 'Confirmar'); b.classList.add('danger'); return; }
      saveDemoItems(items.filter(i => i.id !== b.dataset.del)); ctx.changed(); draw(); msg(t('Deleted. A checkpoint in Backups can bring it back.', 'Eliminado. Un punto de restauración en Respaldos puede recuperarlo.'));
    }
  };
  draw();
}

// ───────── Approvals
async function pApprovals(el, ctx) {
  const pub = ctx.role === 'publisher', ids = new Set(allContent().map(x => x.id));
  const queue = demoItems().filter(x => x.status === 'review');
  const recent = readLog().filter(e => e.action === 'approved' || e.action === 'returned').slice(0, 6);
  const excerpt = s => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > 320 ? s.slice(0, 317) + '…' : s; };
  const side = (x, sp) => `<div class="ws-lang"><div class="eyebrow">${sp ? 'Español' : 'English'}</div><h4>${esc((sp ? x.titleEs : x.title) || '—')}</h4><p class="small">${esc(excerpt(sp ? x.bodyEs : x.body))}</p>${(x.sections || []).length ? `<p class="small muted">+ ${(x.sections || []).length} ${t('sections', 'secciones')}</p>` : ''}${x.blocks ? `<p class="small muted">+ ${x.blocks.length} ${t('builder blocks', 'bloques')}</p>` : ''}</div>`;
  const card = x => {
    const iss = issuesOf(x, ids);
    return `<article class="card ws-review" aria-labelledby="rv-${esc(x.id)}"><div class="ws-review-head"><div><span class="small muted">${esc(kindName(x.kind))} · ${esc(ctx.scopeName(x.scope))} · ${t('submitted', 'enviado')} ${esc(ago(x.publishedAt))}</span><h3 id="rv-${esc(x.id)}">${esc(titleOf(x))}</h3></div>${badge('review')}</div>
      ${x.image && x.uploaded ? `<img class="ws-review-img" src="${x.image}" alt="${esc(es ? x.imageAltEs : x.imageAlt)}">` : ''}
      <div class="ws-langs">${side(x, false)}${side(x, true)}</div>
      ${x.kind === 'event' && x.eventAt ? `<p class="small"><strong>${t('Event:', 'Evento:')}</strong> ${esc(when(x.eventAt))}${x.location ? ' · ' + esc(x.location) : ''}</p>` : ''}${x.publishAt ? `<p class="small"><strong>${t('Goes live:', 'Se publica:')}</strong> ${esc(when(x.publishAt))}</p>` : ''}
      <div class="checklist"><h4>${t('Automatic checks', 'Revisiones automáticas')}</h4><ul>${iss.length ? iss.map(i => `<li class="${i.level === 'error' ? 'no' : 'warn'}"><span aria-hidden="true">${i.level === 'error' ? '✗' : '!'}</span> ${esc(t(i.en, i.es))}</li>`).join('') : `<li class="ok"><span aria-hidden="true">✓</span> ${t('Both languages, photo descriptions and links all pass', 'Ambos idiomas, descripciones de fotos y enlaces correctos')}</li>`}</ul></div>
      ${pub ? `<div class="field"><label for="note-${esc(x.id)}">${t('Note to the editor (optional)', 'Nota para el editor (opcional)')}</label><textarea id="note-${esc(x.id)}" rows="2" maxlength="400"></textarea></div>
      <div class="buttons"><button type="button" class="btn primary compact" data-approve="${esc(x.id)}">${t('Approve & publish', 'Aprobar y publicar')}</button><button type="button" class="btn compact" data-return="${esc(x.id)}">${t('Send back with note', 'Devolver con nota')}</button><button type="button" class="btn compact" data-open="${esc(x.id)}">${t('Open in editor', 'Abrir en el editor')}</button></div>`
      : `<div class="buttons"><button type="button" class="btn compact" data-withdraw="${esc(x.id)}">${t('Withdraw to draft', 'Retirar a borrador')}</button><button type="button" class="btn compact" data-open="${esc(x.id)}">${t('Edit', 'Editar')}</button></div>`}</article>`;
  };
  el.innerHTML = `<div class="ws-head"><div><h2>${pub ? t('Approvals', 'Aprobaciones') : t('Your submissions', 'Sus envíos')}</h2><p class="muted">${pub ? t('School editors submit; you approve. Nothing reaches families until a district publisher says yes.', 'Los editores escolares envían; usted aprueba. Nada llega a las familias sin el visto bueno de un publicador del distrito.') : t('Everything you submit waits here until a district publisher approves it.', 'Todo lo que envía espera aquí hasta que un publicador del distrito lo apruebe.')}</p></div></div>
  <p class="small" id="ap-msg" role="status" aria-live="polite"></p>
  ${queue.length ? queue.map(card).join('') : `<div class="card"><p class="ws-clear">✓ ${t('Nothing is waiting for approval.', 'No hay nada pendiente de aprobación.')}</p><p class="small muted">${pub ? t('Tip: switch to “School editor” at the top, submit something, then come back as a publisher to approve it.', 'Consejo: cambie a “Editor escolar” arriba, envíe algo y vuelva como publicador para aprobarlo.') : t('Submit a story or event from Create & edit and it appears here.', 'Envíe una noticia o evento desde Crear y editar y aparecerá aquí.')}</p></div>`}
  <section class="card" style="margin-top:20px" aria-labelledby="ap-recent"><h3 id="ap-recent">${t('Recent decisions', 'Decisiones recientes')}</h3>${recent.length ? `<ul class="ws-logs">${recent.map(e => logLine(e, ctx.scopeName)).join('')}</ul>` : `<p class="small muted">${t('None yet.', 'Ninguna todavía.')}</p>`}</section>`;
  el.onclick = e => {
    const b = e.target.closest('[data-approve],[data-return],[data-open],[data-withdraw]'); if (!b) return;
    const items = demoItems(), id = b.dataset.approve || b.dataset.return || b.dataset.open || b.dataset.withdraw, x = items.find(i => i.id === id); if (!x) return;
    if (b.dataset.open) { if (x.blocks) location.href = `builder.html?id=${encodeURIComponent(id)}${L}`; else ctx.go('create', { edit: id }); return; }
    let m;
    if (b.dataset.approve) { x.status = 'published'; x.approvedAt = new Date().toISOString(); m = `${t('Approved and published.', 'Aprobado y publicado.')} <a href="${esc(viewURL(x))}">${t('See it on the site', 'Verlo en el sitio')}</a>`; }
    if (b.dataset.return) { x.status = 'draft'; x.returnNote = el.querySelector('#note-' + CSS.escape(id))?.value.trim() || t('Please review and resubmit.', 'Revise y vuelva a enviar.'); m = t('Sent back to the editor as a draft, with your note.', 'Devuelto al editor como borrador, con su nota.'); }
    if (b.dataset.withdraw) { x.status = 'draft'; m = t('Withdrawn. It is a draft again.', 'Retirado. Vuelve a ser borrador.'); }
    saveDemoItems(items); ctx.changed(); pApprovals(el, ctx).then(() => el.querySelector('#ap-msg').innerHTML = m);
  };
}

// ───────── Schools & sites
async function pSites(el, ctx) {
  const pub = ctx.role === 'publisher', mine = demoItems();
  let q = '', level = 'any', shown = 24;
  const h = healthReport(), bad = new Map();
  h.errors.forEach(r => bad.set(r.item.scope, (bad.get(r.item.scope) || 0) + 1));
  const levels = [...new Set(ctx.schools.map(s => s.level))];
  el.innerHTML = `<div class="ws-head"><div><h2>${t('Schools & sites', 'Escuelas y sitios')}</h2><p class="muted">${t(`The district site and ${ctx.schools.length} school and program sites, all on one platform. Each keeps its own identity.`, `El sitio del distrito y ${ctx.schools.length} sitios escolares y de programas, en una sola plataforma. Cada uno conserva su identidad.`)}</p></div><div class="buttons">${pub ? `<a class="btn primary compact" href="#create?newschool=1">${t('+ Add a school site', '+ Agregar sitio escolar')}</a>` : ''}</div></div>
  <div class="card ws-filters"><div class="field grow"><label for="ws-sq">${t('Find a site', 'Buscar un sitio')}</label><input id="ws-sq" type="search" placeholder="${t('School name', 'Nombre de la escuela')}"></div><div class="field"><label for="ws-sl">${t('Level', 'Nivel')}</label><select id="ws-sl"><option value="any">${t('All levels', 'Todos los niveles')}</option>${levels.map(l => `<option value="${esc(l)}">${esc(levelName(l))}</option>`).join('')}</select></div></div>
  <div id="ws-sites"></div>`;
  const tile = s => {
    const id = s ? s.id : 'district', live = mine.filter(x => x.scope === id && statusOf(x) === 'live').length, wait = mine.filter(x => x.scope === id && x.status === 'review').length, n = bad.get(id) || 0;
    return `<article class="card ws-site"><div class="ws-site-top"><img src="${esc(s ? s.image : 'assets/d11.png')}" alt="" loading="lazy" width="44" height="44"><div><h3>${esc(s ? s.name : t('District 11 site', 'Sitio del Distrito 11'))}</h3><p class="small muted">${s ? esc(levelName(s.level)) + (s.demo ? ' · ' + t('added in this demo', 'agregado en esta demo') : '') : t('Districtwide', 'Todo el distrito')}</p></div></div>
      <p class="small">${live ? `<span class="badge green">${live} ${t('new live', 'nuevos')}</span> ` : ''}${wait ? `<span class="badge gold">${wait} ${t('waiting', 'pendientes')}</span> ` : ''}${n ? `<a class="badge red" href="#health">${n} ${t('with issues', 'con problemas')}</a>` : `<span class="badge">✓ ${t('Healthy', 'En buen estado')}</span>`}</p>
      <div class="buttons"><a class="btn compact" href="${esc(siteURL(id))}">${t('View site', 'Ver sitio')}</a><a class="btn compact" href="#create?scope=${esc(id)}&kind=news">${t('Post news', 'Publicar noticia')}</a><a class="btn compact" href="builder.html?new=1&site=${esc(id)}${L}">${t('Build a page', 'Crear página')}</a>${s && /Elementary|Middle|High|Preschool/.test(s.level) ? `<a class="btn compact" href="builder.html?layout=classroom&site=${esc(id)}${L}">${t('Classroom page', 'Página de clase')}</a>` : ''}</div></article>`;
  };
  function draw() {
    const norm = v => String(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const list = ctx.schools.filter(s => (level === 'any' || s.level === level) && (!q || norm(s.name).includes(norm(q))));
    const showDistrict = level === 'any' && (!q || norm('district 11 distrito').includes(norm(q)));
    el.querySelector('#ws-sites').innerHTML = `<p class="small muted">${t(`${list.length + (showDistrict ? 1 : 0)} sites`, `${list.length + (showDistrict ? 1 : 0)} sitios`)}</p><div class="ws-site-grid">${showDistrict ? tile(null) : ''}${list.slice(0, shown).map(tile).join('')}</div>${list.length > shown ? `<button type="button" class="btn compact" id="ws-smore">${t(`Show all (${list.length})`, `Mostrar todos (${list.length})`)}</button>` : ''}`;
  }
  el.querySelector('#ws-sq').addEventListener('input', e => { q = e.target.value.trim(); draw(); });
  el.querySelector('#ws-sl').addEventListener('change', e => { level = e.target.value; draw(); });
  el.onclick = e => { if (e.target.closest('#ws-smore')) { shown = 1e4; draw(); } };
  draw();
}

// ───────── Calendar (every site + publishing schedule)
const dkey = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
async function pCalendar(el, ctx) {
  const now = new Date();
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1), selected = dkey(now), type = 'all', tier = 'all';
  const mine = demoItems();
  const events = [
    ...hubEvents(ctx.schools, { includePast: true }),
    ...mine.filter(x => statusOf(x) === 'scheduled').map(x => ({ id: 'pub-' + x.id, type: 'publish', school: ctx.byId[x.scope] || null, eventAt: x.publishAt, title: `Goes live: ${x.title}`, titleEs: `Se publica: ${x.titleEs}` })),
    ...mine.filter(x => x.kind === 'alert' && statusOf(x) === 'live' && x.expiresAt).map(x => ({ id: 'end-' + x.id, type: 'publish', school: ctx.byId[x.scope] || null, eventAt: x.expiresAt, title: `Alert ends: ${x.title}`, titleEs: `Termina el aviso: ${x.titleEs}` }))
  ];
  const TYPE_OPTS = [...TYPES, ['publish', 'Publishing schedule', 'Calendario de publicación']];
  const label = k => { const x = TYPE_OPTS.find(o => o[0] === k); return x ? t(x[1], x[2]) : k; };
  const match = e => (type === 'all' || e.type === type) && (tier === 'all' || !e.school || e.school.level === tier);
  el.innerHTML = `<div class="ws-head"><div><h2>${t('Calendar', 'Calendario')}</h2><p class="muted">${t('Every event from every school site, district dates, and what is scheduled to publish, on one calendar.', 'Cada evento de cada escuela, las fechas del distrito y lo que está programado para publicarse, en un solo calendario.')}</p></div><div class="buttons"><a class="btn primary compact" href="#create?kind=event">${t('+ Add an event', '+ Agregar evento')}</a><a class="btn compact" href="${route('index')}#events-hub">${t('Public events hub', 'Calendario público')}</a></div></div>
  <div class="card ws-filters"><div class="field"><label for="cal-type">${t('Show', 'Mostrar')}</label><select id="cal-type">${TYPE_OPTS.map(([k, en, sp]) => `<option value="${k}">${t(en, sp)}</option>`).join('')}</select></div><div class="field"><label for="cal-tier">${t('School level', 'Nivel escolar')}</label><select id="cal-tier">${TIERS.map(([k, en, sp]) => `<option value="${k}">${t(en, sp)}</option>`).join('')}</select></div>
   <div class="buttons ws-cal-nav"><button type="button" class="btn compact" data-m="-1" aria-label="${t('Previous month', 'Mes anterior')}">‹</button><button type="button" class="btn compact" data-m="0">${t('Today', 'Hoy')}</button><button type="button" class="btn compact" data-m="1" aria-label="${t('Next month', 'Mes siguiente')}">›</button><button type="button" class="btn compact" id="cal-ics">${t('Download month (.ics)', 'Descargar mes (.ics)')}</button></div></div>
  <div class="card"><h3 id="cal-title" aria-live="polite"></h3><div id="cal-grid"></div></div><section class="card" style="margin-top:20px" aria-labelledby="cal-day-title"><h3 id="cal-day-title"></h3><div id="cal-day"></div></section>`;
  const $ = id => el.querySelector('#' + id);
  const monthEvents = () => events.filter(e => match(e) && dkey(e.eventAt).slice(0, 7) === dkey(new Date(cursor.getFullYear(), cursor.getMonth(), 15)).slice(0, 7));
  function draw() {
    const y = cursor.getFullYear(), m = cursor.getMonth(), first = new Date(y, m, 1, 12), days = new Date(y, m + 1, 0).getDate(), lead = first.getDay();
    $('cal-title').textContent = first.toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'long', year: 'numeric' });
    const byDay = {}; monthEvents().forEach(e => (byDay[dkey(e.eventAt)] ||= []).push(e));
    const wk = [...Array(7)].map((_, i) => new Date(2026, 1, 1 + i).toLocaleDateString(es ? 'es-US' : 'en-US', { weekday: 'short' }));
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="ws-day ws-blank" aria-hidden="true"></div>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d, 12), k = dkey(date), list = (byDay[k] || []).sort((a, b) => a.eventAt.localeCompare(b.eventAt));
      cells += `<div class="ws-day${k === dkey(now) ? ' today' : ''}${k === selected ? ' sel' : ''}"><button type="button" data-day="${k}" aria-pressed="${k === selected}" aria-label="${esc(date.toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'long', day: 'numeric' }))}, ${list.length} ${t('events', 'eventos')}">${d}${list.length ? `<span class="ws-dots">${list.length}</span>` : ''}</button><ul aria-hidden="true">${list.slice(0, 3).map(e => `<li class="ws-t-${e.type}">${esc(es ? e.titleEs || e.title : e.title)}</li>`).join('')}${list.length > 3 ? `<li class="more">+${list.length - 3}</li>` : ''}</ul></div>`;
    }
    $('cal-grid').innerHTML = `<div class="ws-cal" role="group" aria-labelledby="cal-title">${wk.map(w => `<div class="ws-wk" aria-hidden="true">${esc(w)}</div>`).join('')}${cells}</div>`;
    const dayList = events.filter(e => match(e) && dkey(e.eventAt) === selected).sort((a, b) => a.eventAt.localeCompare(b.eventAt));
    $('cal-day-title').textContent = new Date(selected + 'T12:00').toLocaleDateString(es ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    $('cal-day').innerHTML = (dayList.length ? `<ul class="ws-agenda">${dayList.map(e => `<li><span class="ws-when">${e.allDay ? t('All day', 'Todo el día') : esc(new Date(e.eventAt).toLocaleTimeString(es ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' }))}</span><span>${esc(es ? e.titleEs || e.title : e.title)} <span class="small muted">· ${esc(e.school ? e.school.name : t('Districtwide', 'Todo el distrito'))}</span></span> <span class="badge ws-t-${e.type}">${esc(label(e.type))}</span>${e.sample ? ` <span class="badge">${t('Sample', 'Muestra')}</span>` : ''}</li>`).join('')}</ul>` : `<p class="muted">${t('Nothing on this day.', 'Nada este día.')}</p>`)
      + `<a class="btn compact" href="#create?kind=event&when=${selected}T18:00">${t('+ Add an event on this day', '+ Agregar un evento este día')}</a>`;
  }
  $('cal-type').onchange = e => { type = e.target.value; draw(); };
  $('cal-tier').onchange = e => { tier = e.target.value; draw(); };
  $('cal-ics').onclick = () => download('d11-month.ics', calendarICS(monthEvents().filter(e => e.type !== 'publish').map(e => ({ id: e.id, title: e.title, titleEs: e.titleEs, body: e.body || '', bodyEs: e.bodyEs || '', eventAt: e.eventAt, eventEnd: e.eventEnd, allDay: e.allDay, location: e.location })), es), 'text/calendar;charset=utf-8');
  el.onclick = e => {
    const m = e.target.closest('[data-m]'), d = e.target.closest('[data-day]');
    if (m) { const n = +m.dataset.m; cursor = n ? new Date(cursor.getFullYear(), cursor.getMonth() + n, 1) : new Date(now.getFullYear(), now.getMonth(), 1); if (!n) selected = dkey(now); draw(); }
    if (d) { selected = d.dataset.day; draw(); el.querySelector(`[data-day="${selected}"]`)?.focus(); }
  };
  draw();
}

// ───────── Emergency alerts
const ALERT_TPL = {
  delay: ['Weather delay', 'Retraso por clima', 'Weather delay: schools start two hours late', 'Due to road conditions, {school} starts two hours late today. Buses run two hours later than usual. Morning preschool is canceled.', 'Retraso por clima: las clases comienzan dos horas tarde', 'Por las condiciones de las carreteras, {school} comienza dos horas tarde hoy. Los autobuses pasan dos horas más tarde. El preescolar de la mañana se cancela.'],
  closed: ['Closed for weather', 'Cierre por clima', 'Closed today due to weather', '{school} is closed today because of the weather. All activities and events are canceled. Stay safe.', 'Cerrado hoy por el clima', '{school} está cerrado hoy por el clima. Se cancelan todas las actividades y eventos. Cuídese.'],
  early: ['Early release', 'Salida temprana', 'Early release today', 'Students at {school} will be released [time] today because of [reason]. Buses run on the early schedule.', 'Salida temprana hoy', 'Los estudiantes de {school} saldrán a las [hora] hoy por [motivo]. Los autobuses siguen el horario de salida temprana.'],
  bus: ['Bus delays', 'Retrasos de autobús', 'Bus delays this morning', 'Some buses serving {school} are running up to 30 minutes late because of road conditions. Thank you for your patience.', 'Retrasos de autobuses esta mañana', 'Algunos autobuses de {school} llevan hasta 30 minutos de retraso por las condiciones de las carreteras. Gracias por su paciencia.'],
  building: ['Building closure', 'Cierre de edificio', '{school} is closed today', 'Because of a [power outage / water problem] at {school}, the building is closed today. Other D11 schools are open as usual.', '{school} está cerrado hoy', 'Debido a [un corte de luz / un problema de agua] en {school}, el edificio está cerrado hoy. Las demás escuelas del D11 abren normalmente.'],
  clear: ['All clear', 'Todo normal', 'All clear: normal schedule', 'Normal operations have resumed at {school}. Thank you for your patience.', 'Todo normal: horario regular', 'Las operaciones normales se reanudaron en {school}. Gracias por su paciencia.']
};
async function pAlerts(el, ctx) {
  const pub = ctx.role === 'publisher';
  let tpl = 'delay';
  const items = allContent().filter(x => x.kind === 'alert');
  const active = items.filter(x => statusOf(x) === 'live'), pending = items.filter(x => ['review', 'scheduled', 'draft'].includes(statusOf(x))), ended = items.filter(x => statusOf(x) === 'expired').slice(0, 5);
  const row = (x, actions) => `<li class="ws-alert-row"><div><strong>${esc(titleOf(x))}</strong> ${badge(statusOf(x))}${x.builtin ? ` <span class="badge">${t('Built-in', 'Incluido')}</span>` : ''}<div class="small muted">${esc(ctx.scopeName(x.scope))}${x.expiresAt ? ` · ${statusOf(x) === 'expired' ? t('ended', 'terminó') : t('ends', 'termina')} ${esc(when(x.expiresAt))}` : x.builtin ? ` · ${t('stays up during the demo', 'permanece durante la demo')}` : ''}</div></div><div class="buttons">${actions}</div></li>`;
  el.innerHTML = `<div class="ws-head"><div><h2>${t('Emergency alerts', 'Avisos de emergencia')}</h2><p class="muted">${t('Delays, closures and all-clears appear as a banner at the top of every page of the sites you choose, in both languages, and end on their own.', 'Retrasos, cierres y avisos de normalidad aparecen como un aviso en la parte superior de cada página de los sitios elegidos, en ambos idiomas, y terminan solos.')}</p></div></div>
  <section class="card" aria-labelledby="al-active"><h3 id="al-active">${t('Active now', 'Activos ahora')} (${active.length})</h3>${active.length ? `<ul class="ws-plain">${active.map(x => row(x, `<a class="btn compact" href="${esc(siteURL(x.scope))}">${t('View', 'Ver')}</a>${x.builtin ? '' : `<button type="button" class="btn compact" data-end="${esc(x.id)}">${t('End now', 'Terminar ahora')}</button>`}`)).join('')}</ul>` : `<p class="muted">${t('No active alerts.', 'No hay avisos activos.')}</p>`}</section>
  <form class="card ws-compose" id="al-form" novalidate aria-labelledby="al-new"><h3 id="al-new">${t('Send an alert', 'Enviar un aviso')}</h3>
   <p class="small" id="al-tpl-label"><strong>${t('1. Start from a template', '1. Comience con una plantilla')}</strong></p><div class="buttons" role="group" aria-labelledby="al-tpl-label">${Object.entries(ALERT_TPL).map(([k, v]) => `<button type="button" class="btn compact" data-tpl="${k}">${t(v[0], v[1])}</button>`).join('')}</div>
   <div class="form-grid"><div class="field"><label for="al-scope">${t('2. Which sites?', '2. ¿Qué sitios?')}</label><select id="al-scope">${pub ? `<option value="all">${t('District + all schools', 'Distrito y todas las escuelas')}</option><option value="district">${t('District site only', 'Solo el sitio del distrito')}</option>` : ''}${ctx.schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></div>
   <div class="field"><label for="al-exp">${t('3. End it automatically', '3. Terminar automáticamente')}</label><select id="al-exp"><option value="1">${t('in 1 hour', 'en 1 hora')}</option><option value="4">${t('in 4 hours', 'en 4 horas')}</option><option value="eod" selected>${t('at the end of today', 'al final del día')}</option><option value="24">${t('in 1 day', 'en 1 día')}</option><option value="168">${t('in 1 week', 'en 1 semana')}</option></select></div></div>
   <div class="ws-langs"><fieldset><legend>English</legend><div class="field"><label for="al-t">${t('Headline', 'Titular')} (English)</label><input id="al-t" maxlength="120"></div><div class="field"><label for="al-b">${t('Message', 'Mensaje')} (English)</label><textarea id="al-b" rows="3" maxlength="600"></textarea></div></fieldset>
   <fieldset><legend>Español</legend><div class="field"><label for="al-tEs">${t('Headline', 'Titular')} (Español)</label><input id="al-tEs" maxlength="120"></div><div class="field"><label for="al-bEs">${t('Message', 'Mensaje')} (Español)</label><textarea id="al-bEs" rows="3" maxlength="600"></textarea></div></fieldset></div>
   <h4>${t('Preview', 'Vista previa')}</h4><div id="al-prev" class="ws-langs"></div><div class="checklist" id="al-checks" aria-live="polite"></div>
   <p class="small muted">${t('Phone calls, texts and email still go out through SchoolMessenger. The website banner makes sure anyone visiting any page of these sites sees it too.', 'Las llamadas, textos y correos siguen saliendo por SchoolMessenger. El aviso del sitio web asegura que quien visite cualquier página de estos sitios también lo vea.')}</p>
   <p class="small" id="al-msg" role="status" aria-live="polite"></p><div class="buttons"><button class="btn primary" type="submit" id="al-send"></button></div></form>
  ${pending.length ? `<section class="card" aria-labelledby="al-pending"><h3 id="al-pending">${t('Waiting', 'En espera')}</h3><ul class="ws-plain">${pending.map(x => row(x, `<a class="btn compact" href="#approvals">${t('Review', 'Revisar')}</a>`)).join('')}</ul></section>` : ''}
  ${ended.length ? `<section class="card" aria-labelledby="al-ended"><h3 id="al-ended">${t('Recently ended', 'Terminados recientemente')}</h3><ul class="ws-plain">${ended.map(x => row(x, '')).join('')}</ul></section>` : ''}`;
  const $ = id => el.querySelector('#' + id), val = id => $(id).value.trim();
  const schoolName = () => { const s = ctx.byId[$('al-scope').value]; return s ? s.name : 'District 11'; };
  function apply(k) {
    tpl = k; const v = ALERT_TPL[k], n = schoolName(), nEs = ctx.byId[$('al-scope').value]?.name || 'el Distrito 11';
    $('al-t').value = v[2].replaceAll('{school}', n); $('al-b').value = v[3].replaceAll('{school}', n === 'District 11' ? 'every District 11 school' : n);
    $('al-tEs').value = v[4].replaceAll('{school}', nEs); $('al-bEs').value = v[5].replaceAll('{school}', nEs === 'el Distrito 11' ? 'cada escuela del Distrito 11' : nEs);
    el.querySelectorAll('[data-tpl]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tpl === k))); check();
  }
  function check() {
    const c = [[!!(val('al-t') && val('al-b')), t('English headline and message', 'Titular y mensaje en inglés')], [!!(val('al-tEs') && val('al-bEs')), t('Spanish headline and message', 'Titular y mensaje en español')], [!/\[[^\]]+\]/.test([val('al-t'), val('al-b'), val('al-tEs'), val('al-bEs')].join(' ')), t('All [blanks] filled in', 'Todos los [espacios] completados')]];
    $('al-checks').innerHTML = `<ul>${c.map(([ok, txt]) => `<li class="${ok ? 'ok' : 'no'}"><span aria-hidden="true">${ok ? '✓' : '✗'}</span> ${esc(txt)}</li>`).join('')}</ul>`;
    $('al-prev').innerHTML = [['al-t', 'al-b'], ['al-tEs', 'al-bEs']].map(([a, b]) => `<aside class="alert ws-alert-prev"><strong>${esc(val(a) || '…')}</strong><p class="content-body">${esc(val(b))}</p></aside>`).join('');
    $('al-send').textContent = pub ? t('Publish alert now', 'Publicar aviso ahora') : t('Submit for district approval', 'Enviar para aprobación del distrito');
    $('al-send').disabled = c.some(x => !x[0]); return c.every(x => x[0]);
  }
  ['al-t', 'al-b', 'al-tEs', 'al-bEs'].forEach(id => $(id).addEventListener('input', check));
  $('al-scope').addEventListener('change', () => apply(tpl));
  $('al-form').onsubmit = e => {
    e.preventDefault(); if (!check()) return;
    const v = $('al-exp').value, end = new Date(); if (v === 'eod') end.setHours(23, 59, 0, 0); else end.setTime(Date.now() + +v * 3600e3);
    const x = { id: 'demo-alert-' + Date.now(), kind: 'alert', scope: $('al-scope').value, status: pub ? 'published' : 'review', publishedAt: new Date().toISOString(), publishAt: null, title: val('al-t'), titleEs: val('al-tEs'), body: val('al-b'), bodyEs: val('al-bEs'), image: '', uploaded: false, imageAlt: '', imageAltEs: '', sections: [], expiresAt: end.toISOString(), versions: [] };
    if (!saveDemoItems([x, ...demoItems()])) { $('al-msg').textContent = t('This browser blocked saving.', 'Este navegador bloqueó el guardado.'); return; }
    ctx.changed();
    pAlerts(el, ctx).then(() => el.querySelector('#al-msg').innerHTML = pub ? `${t('Alert is live.', 'El aviso está publicado.')} <a href="${esc(siteURL(x.scope))}">${t('See it on the site', 'Verlo en el sitio')}</a>` : t('Submitted. A district publisher approves it in Approvals.', 'Enviado. Un publicador del distrito lo aprueba en Aprobaciones.'));
  };
  el.onclick = e => {
    const b = e.target.closest('[data-tpl],[data-end]'); if (!b) return;
    if (b.dataset.tpl) { apply(b.dataset.tpl); return; }
    const list = demoItems(), x = list.find(i => i.id === b.dataset.end); if (!x) return;
    x.expiresAt = new Date().toISOString(); saveDemoItems(list); ctx.changed(); pAlerts(el, ctx).then(() => el.querySelector('#al-msg').textContent = t('Alert ended. It is off every site now.', 'Aviso terminado. Ya no aparece en ningún sitio.'));
  };
  apply('delay');
}

function ensureStyles() {
  if (document.querySelector('#ws-styles')) return;
  const st = document.createElement('style'); st.id = 'ws-styles';
  st.textContent = `.ws-bar{display:flex;flex-wrap:wrap;gap:14px 24px;align-items:center;justify-content:space-between;margin-bottom:20px}.ws-sub{margin:4px 0 0}.ws-role{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.ws-bar [data-role][aria-pressed=true],[data-tpl][aria-pressed=true],.ws-cal [aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
.ws-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:24px;align-items:start}
nav.ws-nav{display:block;min-height:0;gap:0;font-size:1rem;font-weight:400;flex-wrap:nowrap}.ws-nav{position:sticky;top:12px;background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:10px 8px;max-height:calc(100vh - 24px);overflow:auto}
.ws-nav ul{list-style:none;margin:0 0 6px;padding:0}.ws-group{font-size:.72rem;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:10px 10px 4px}
.ws-nav a{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;color:var(--ink);text-decoration:none;font-weight:550;font-size:.95rem}
.ws-nav a:hover{background:var(--paper)}.ws-nav a[aria-current=page]{background:var(--navy);color:#fff}.ws-nav a[aria-current=page] .muted{color:#dbe6f0}
.ws-count{background:#b83e35;color:#fff;border-radius:20px;font-size:.75rem;font-weight:700;padding:1px 8px}.ws-nav a[aria-current=page] .ws-count{background:var(--gold);color:var(--navy)}
.ws-main{min-width:0}.ws-panel h2:focus{outline:none}.ws-panel>*+*{margin-top:20px}.ws-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 20px;align-items:flex-end}.ws-head h2{margin:2px 0 6px}.ws-head p{margin:0;max-width:62ch}
.ws-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:12px}.ws-stat{display:flex;flex-direction:column;gap:2px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;color:var(--ink);text-decoration:none}
.ws-stat:hover{border-color:var(--blue)}.ws-stat-n{font-size:1.8rem;font-weight:750;color:var(--navy);line-height:1.1}.ws-stat.gold{border-color:var(--gold);background:#fffaf0}.ws-stat.red .ws-stat-n{color:#a3352c}.ws-stat.green .ws-stat-n{color:#1d6b43}
.ws-cols{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:20px;align-items:start}
.ws-todo,.ws-plain,.ws-agenda,.ws-logs{list-style:none;margin:0 0 12px;padding:0}.ws-todo li{padding:10px 12px;border-radius:10px;background:var(--paper);margin-bottom:8px;border-left:4px solid var(--blue)}.ws-todo li.gold{border-color:var(--gold)}.ws-todo li.red{border-color:#b83e35}
.ws-clear{color:#1d6b43;font-weight:650}.ws-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ws-action{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;text-decoration:none;color:var(--ink)}.ws-action:hover{border-color:var(--blue);background:#f8fbfd}
.ws-agenda li{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--line)}.ws-when{font-weight:700;color:var(--navy);min-width:92px;font-size:.9rem}
.ws-log{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}.ws-log q{font-style:normal;font-weight:600}.ws-log-dot{flex:none;width:10px;height:10px;border-radius:50%;margin-top:7px;background:var(--blue)}.ws-a-approved,.ws-a-published{background:#2a8a57}.ws-a-returned,.ws-a-submitted{background:var(--gold)}.ws-a-removed,.ws-a-ended,.ws-a-media-removed,.ws-a-user-removed{background:#b83e35}
.ws-filters{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end}.ws-filters .buttons{margin:0}.ws-filters .field:not(.grow){flex:0 1 190px}
.ws-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}.ws-table th,.ws-table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}.ws-table th{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);background:var(--paper)}
.ws-row-actions{white-space:nowrap}.ws-row-actions .btn{margin:2px}.btn.danger{background:#b83e35;border-color:#b83e35;color:#fff}.badge.red{background:#fde8e5;color:#8a2a22}
.ws-review-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.ws-review-head h3{margin:4px 0}.ws-review-img{max-width:240px;border-radius:10px;margin:8px 0}
.ws-langs{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ws-lang{background:var(--paper);border-radius:12px;padding:12px 14px}.ws-lang h4{margin:4px 0}
.ws-langs fieldset{border:1px solid var(--line);border-radius:12px;padding:10px 14px}.ws-langs fieldset .field+.field{margin-top:10px}.ws-compose .form-grid{margin:14px 0}.ws-alert-prev{padding:12px 14px;margin:0}
.ws-alert-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 16px;padding:10px 0;border-bottom:1px solid var(--line)}.ws-alert-row .buttons{margin:0}
.ws-site-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}.ws-site{display:flex;flex-direction:column;gap:6px}.ws-site h3{font-size:1.02rem;margin:0}.ws-site p{margin:0}.ws-site-top{display:flex;gap:12px;align-items:center}.ws-site-top img{width:44px;height:44px;object-fit:contain}.ws-site .buttons{margin-top:auto}
.ws-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.ws-wk{font-size:.75rem;font-weight:700;text-transform:uppercase;color:var(--muted);text-align:center;padding:4px 0}
.ws-day{min-height:96px;border:1px solid var(--line);border-radius:10px;padding:4px;background:#fff;min-width:0}.ws-day.ws-blank{border:0;background:transparent}.ws-day.today{border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}.ws-day.sel{background:#eef4fa}
.ws-day button{display:flex;justify-content:space-between;align-items:center;width:100%;border:0;background:transparent;font:inherit;font-weight:700;color:var(--navy);padding:2px 4px;border-radius:6px;cursor:pointer}.ws-day button[aria-pressed=true]{background:var(--navy);color:#fff}
.ws-dots{font-size:.7rem;background:var(--gold);color:var(--navy);border-radius:10px;padding:0 6px}.ws-day ul{list-style:none;margin:2px 0 0;padding:0}.ws-day li{font-size:.7rem;line-height:1.25;padding:1px 4px;margin-top:2px;border-radius:4px;background:#eaf1f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ws-t-athletics{background:#e4effa!important;color:#14467a}.ws-t-board{background:#efe7f7!important;color:#4d2a73}.ws-t-holiday{background:#fff2d5!important;color:#6b4a0e}.ws-t-school{background:#e5f2eb!important;color:#235740}.ws-t-publish{background:#eceff2!important;color:#3d4b58}.ws-day li.more{background:transparent;color:var(--muted)}
.ws-jump{display:none;margin-bottom:16px}
@media (max-width:980px){.ws-layout{grid-template-columns:1fr}nav.ws-nav{display:none!important}.ws-jump{display:flex}.ws-nav ul{display:flex;flex-wrap:wrap;gap:4px}.ws-group{flex-basis:100%}.ws-cols{grid-template-columns:1fr}}
@media (max-width:700px){.ws-langs,.ws-actions{grid-template-columns:1fr}.ws-day{min-height:46px}.ws-day ul{display:none}.ws-cal{gap:2px}.ws-wk{font-size:.62rem}
.ws-table thead{display:none}.ws-table,.ws-table tbody,.ws-table tr,.ws-table td{display:block;width:100%}.ws-table tr{border-bottom:2px solid var(--line);padding:6px 0}.ws-table td{border:0;padding:4px 12px}.ws-table td[data-label]::before{content:attr(data-label);display:block;font-size:.72rem;text-transform:uppercase;color:var(--muted);font-weight:700}.ws-row-actions{white-space:normal}}`;
  document.head.append(st);
}
