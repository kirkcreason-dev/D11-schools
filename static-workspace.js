// Static stand-in for the staff workspace and family messages pages (the live versions need the platform's server).
import {shell, t, icon, route, esc, es, schoolURL} from './common.js';
import {demoItems, saveDemoItems} from './static-api.js';
const page = document.body.dataset.page;
shell(page);
const main = document.querySelector('#main');
const card = (i, en, es, bodyEn, bodyEs) => `<article class="card"><div class="eyebrow">${icon(i)}</div><h3>${t(en, es)}</h3><p class="muted">${t(bodyEn, bodyEs)}</p></article>`;

if (page === 'staff') {
  document.title = t('Staff workspace · D11', 'Espacio del personal · D11');
  main.innerHTML = `<section class="hero schoolhero"><div class="wrap hero-inner"><div><div class="eyebrow">${t('For school & district staff', 'Para el personal escolar y del distrito')}</div><h1>${t('Publish in minutes.<br><em>No webmaster required.</em>', 'Publique en minutos.<br><em>Sin depender de un técnico.</em>')}</h1><p>${t('A school secretary can update a homepage, post an event or share a story in English and Spanish, while the district keeps control of branding, accessibility and critical alerts.', 'Una secretaria escolar puede actualizar la página de inicio, publicar un evento o compartir una historia en inglés y español, mientras el distrito controla la marca, la accesibilidad y los avisos críticos.')}</p><div class="buttons"><a class="btn gold" href="#try">${t('Try the editor now', 'Pruebe el editor ahora')}</a><a class="btn ghost" href="page.html?id=about-this-demo${t('', '&lang=es')}">${t('About this demonstration', 'Acerca de esta demostración')}</a></div></div></div></section>
  <section class="section wrap" id="try"><div class="section-title"><div><div class="eyebrow">${t('Try it yourself', 'Pruébelo usted mismo')}</div><h2>${t('Update a school site in under a minute.', 'Actualice un sitio escolar en menos de un minuto.')}</h2><p class="muted">${t('Pick a school, write in both languages, publish, then open the site to see your change. Edits stay only in this browser.', 'Elija una escuela, escriba en ambos idiomas, publique y abra el sitio para ver su cambio. Las ediciones se guardan solo en este navegador.')}</p></div></div>
  <div class="split"><form id="demo-form" class="card" novalidate>
   <div class="form-grid">
    <div class="field"><label for="d-scope">${t('1. Which site?', '1. ¿Qué sitio?')}</label><select id="d-scope"></select></div>
    <div class="field"><label for="d-kind">${t('2. What are you publishing?', '2. ¿Qué va a publicar?')}</label><select id="d-kind">
      <option value="home">${t('Homepage headline & introduction', 'Titular e introducción de inicio')}</option>
      <option value="news">${t('News story', 'Noticia')}</option>
      <option value="event">${t('Event', 'Evento')}</option>
      <option value="alert">${t('Alert banner', 'Aviso destacado')}</option></select></div>
   </div>
   <fieldset class="card" style="margin:16px 0"><legend>English</legend>
    <div class="field"><label for="d-title">${t('Title', 'Título')} (English)</label><input id="d-title" maxlength="120"></div>
    <div class="field"><label for="d-body">${t('Text', 'Texto')} (English)</label><textarea id="d-body" rows="4" maxlength="1200"></textarea></div></fieldset>
   <fieldset class="card" style="margin:16px 0"><legend>Español</legend>
    <div class="field"><label for="d-titleEs">${t('Title', 'Título')} (Español)</label><input id="d-titleEs" maxlength="120"></div>
    <div class="field"><label for="d-bodyEs">${t('Text', 'Texto')} (Español)</label><textarea id="d-bodyEs" rows="4" maxlength="1200"></textarea></div></fieldset>
   <div class="form-grid">
    <div class="field" id="d-when-wrap" hidden><label for="d-when">${t('Event date & time', 'Fecha y hora del evento')}</label><input id="d-when" type="datetime-local"></div>
    <div class="field" id="d-where-wrap" hidden><label for="d-where">${t('Location', 'Lugar')}</label><input id="d-where" maxlength="120"></div>
    <div class="field" id="d-expire-wrap" hidden><label for="d-expire">${t('Remove alert automatically after', 'Quitar el aviso automáticamente después de')}</label><select id="d-expire"><option value="1">${t('1 hour', '1 hora')}</option><option value="24" selected>${t('1 day', '1 día')}</option><option value="168">${t('1 week', '1 semana')}</option></select></div>
   </div>
   <p id="d-check" class="small" role="status" aria-live="polite"></p>
   <div class="buttons"><button class="btn primary" type="submit">${t('Publish', 'Publicar')}</button><button class="btn" type="button" id="d-reset">${t('Reset demo', 'Restablecer demo')}</button></div>
  </form>
  <aside class="card"><h3>${t('Preview', 'Vista previa')}</h3><div class="buttons" role="group" aria-label="${t('Preview language', 'Idioma de la vista previa')}"><button type="button" class="btn compact" data-pv="en" aria-pressed="true">English</button><button type="button" class="btn compact" data-pv="es" aria-pressed="false">Español</button></div><div id="d-preview" style="margin-top:16px"></div><div id="d-published"></div></aside></div></section>
  <section class="section wrap"><div class="section-title"><div><div class="eyebrow">${t('What staff get', 'Lo que recibe el personal')}</div><h2>${t('Everything in one workspace.', 'Todo en un solo espacio.')}</h2></div></div><div class="grid">
  ${card('edit', 'Bilingual editor', 'Editor bilingüe', 'English and Spanish side by side. Nothing publishes until both languages and image descriptions are complete.', 'Inglés y español lado a lado. Nada se publica hasta completar ambos idiomas y las descripciones de imágenes.')}
  ${card('check', 'Draft, review, publish', 'Borrador, revisión, publicación', 'Editors save drafts and submit for review. Publishers approve. Every saved version can be restored.', 'Los editores guardan borradores y los envían a revisión. Los publicadores aprueban. Cada versión puede restaurarse.')}
  ${card('school', '58 school sites, one login', '58 sitios, un acceso', 'Each editor sees only the schools assigned to them. Shared templates keep every site consistent.', 'Cada editor ve solo sus escuelas asignadas. Las plantillas compartidas mantienen la coherencia.')}
  ${card('clock', 'Districtwide alerts', 'Avisos para todo el distrito', 'One notice reaches the district site and all 58 school homepages, and expires on its own.', 'Un aviso llega al sitio del distrito y a las 58 páginas escolares, y vence automáticamente.')}
  ${card('image', 'Media library & templates', 'Biblioteca y plantillas', 'Upload photos once and reuse them. Start from ready-made bilingual templates: spotlights, events, newsletters, achievements.', 'Suba fotos una vez y reutilícelas. Comience con plantillas bilingües: escuelas destacadas, eventos, boletines y logros.')}
  ${card('book', 'Migration & redirects', 'Migración y redirecciones', 'Bulk page import, redirect mapping from old addresses and a broken-link report before launch.', 'Importación masiva, redirecciones desde direcciones antiguas e informe de enlaces rotos antes del lanzamiento.')}
  ${card('user', 'Permissions', 'Permisos', 'District owner, publishers and school editors, assigned per school.', 'Propietario del distrito, publicadores y editores escolares, asignados por escuela.')}
  ${card('clock', 'Content recovery', 'Recuperación de contenido', 'Checkpoints of the whole site, verified backups and one-click restore of any entry.', 'Copias de todo el sitio, respaldos verificados y restauración de cualquier entrada con un clic.')}
  ${card('help', 'Visitor analytics', 'Estadísticas de visitas', 'Privacy-respecting, first-party measurement of what families look for, by school and language.', 'Medición propia y respetuosa de la privacidad de lo que buscan las familias, por escuela e idioma.')}
  </div><p class="source">${t('The working editor is shown live during the informational demonstration. This page summarizes its capabilities.', 'El editor se muestra en vivo durante la demostración informativa. Esta página resume sus funciones.')}</p></section>`;
  wireEditor();
} else {
  document.title = t('Family messages · D11', 'Mensajes familiares · D11');
  main.innerHTML = `<section class="hero schoolhero"><div class="wrap hero-inner"><div><div class="eyebrow">${t('Family messages', 'Mensajes familiares')}</div><h1>${t('A direct line to your school.', 'Comunicación directa con su escuela.')}</h1><p>${t('Optional two-way messaging between families and school staff, in English or Spanish. SchoolMessenger remains the district’s tool for calls, texts and mass email.', 'Mensajería opcional entre familias y personal escolar, en inglés o español. SchoolMessenger sigue siendo la herramienta del distrito para llamadas, textos y correos masivos.')}</p><div class="buttons"><a class="btn gold" href="page.html?id=powerschool${t('', '&lang=es')}">${t('How it fits with SchoolMessenger', 'Cómo se integra con SchoolMessenger')}</a></div></div></div></section>
  <section class="section wrap"><h2 class="sr-only">${t('Features', 'Funciones')}</h2><div class="grid">
  ${card('user', 'Conversations by school', 'Conversaciones por escuela', 'Families see one inbox; each school sees only its own conversations.', 'Las familias ven una bandeja; cada escuela ve solo sus conversaciones.')}
  ${card('check', 'Read receipts', 'Confirmación de lectura', 'Staff know when a message has been seen.', 'El personal sabe cuándo se leyó un mensaje.')}
  ${card('help', 'District controls', 'Control del distrito', 'Administrators decide who can message whom and can switch access off at any time.', 'Los administradores deciden quién puede escribir a quién y pueden desactivar el acceso en cualquier momento.')}
  </div><p class="source">${t('An optional service, included in the flat rate. Shown live during the demonstration.', 'Un servicio opcional, incluido en la tarifa fija. Se muestra en vivo durante la demostración.')}</p><a class="btn" href="${route('index')}">${t('District home', 'Inicio del distrito')}</a></section>`;
}

async function wireEditor() {
  const $ = id => document.querySelector('#' + id);
  let schools = [];
  try { schools = await (await fetch('schools-data.json')).json(); } catch {}
  $('d-scope').innerHTML = `<option value="district">${t('District site', 'Sitio del distrito')}</option>` + schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  let pv = es ? 'es' : 'en';
  const siteURL = scope => scope === 'district' || scope === 'all' ? route('index') : schoolURL(scope);
  const val = id => $(id).value.trim();

  const kindChanged = () => {
    const k = $('d-kind').value;
    $('d-when-wrap').hidden = $('d-where-wrap').hidden = k !== 'event';
    $('d-expire-wrap').hidden = k !== 'alert';
    const scopeAll = $('d-scope').querySelector('option[value="all"]');
    if (k === 'alert' && !scopeAll) $('d-scope').insertAdjacentHTML('afterbegin', `<option value="all">${t('District + all 58 schools', 'Distrito y las 58 escuelas')}</option>`);
    if (k !== 'alert' && scopeAll) { if ($('d-scope').value === 'all') $('d-scope').value = 'district'; scopeAll.remove(); }
    if (k === 'home' && !val('d-title')) prefillHome();
    preview();
  };
  const prefillHome = () => {
    const s = schools.find(x => x.id === $('d-scope').value);
    $('d-title').value = s ? s.name : 'A world of possibility. Right here.';
    $('d-titleEs').value = s ? s.name : 'Un mundo de posibilidades. Aquí mismo.';
    $('d-body').value = s ? s.intro : 'Find your school. Discover your path. Connect with the people and resources that help your family thrive.';
    $('d-bodyEs').value = s ? s.introEs : 'Encuentre su escuela. Descubra su camino. Conéctese con las personas y los recursos que ayudan a su familia a prosperar.';
  };
  const problems = () => {
    const p = [];
    if (!val('d-title') || !val('d-body')) p.push(t('Add the English title and text.', 'Agregue el título y el texto en inglés.'));
    if (!val('d-titleEs') || !val('d-bodyEs')) p.push(t('Add the Spanish title and text. Both languages are required.', 'Agregue el título y el texto en español. Ambos idiomas son obligatorios.'));
    if ($('d-kind').value === 'event' && !val('d-when')) p.push(t('Choose the event date and time.', 'Elija la fecha y hora del evento.'));
    return p;
  };
  const kindLabel = k => ({ home: t('Homepage', 'Inicio'), news: t('News', 'Noticia'), event: t('Event', 'Evento'), alert: t('Alert', 'Aviso') }[k]);
  function preview() {
    const title = pv === 'es' ? val('d-titleEs') : val('d-title'), body = pv === 'es' ? val('d-bodyEs') : val('d-body');
    const k = $('d-kind').value;
    $('d-preview').innerHTML = k === 'alert'
      ? `<aside class="alert" style="padding:14px"><strong>${esc(title || '…')}</strong><p class="content-body">${esc(body)}</p></aside>`
      : `<div class="eyebrow">${kindLabel(k)}</div><h3>${esc(title || '…')}</h3><p class="content-body">${esc(body)}</p>${k === 'event' && val('d-when') ? `<p class="small muted">${esc(new Date(val('d-when')).toLocaleString(pv === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }))}${val('d-where') ? ' · ' + esc(val('d-where')) : ''}</p>` : ''}`;
    const p = problems();
    $('d-check').textContent = p.length ? p.join(' ') : t('Ready to publish.', 'Listo para publicar.');
  }
  function listPublished() {
    const items = demoItems();
    $('d-published').innerHTML = items.length ? `<h3 style="margin-top:24px">${t('Published in this demo', 'Publicado en esta demo')}</h3>${items.map(x => {
      const scopeName = x.scope === 'all' ? t('District + all 58 schools', 'Distrito y las 58 escuelas') : x.scope === 'district' ? t('District site', 'Sitio del distrito') : (schools.find(s => s.id === x.scope)?.name || x.scope);
      const href = x.kind === 'home' || x.kind === 'alert' ? siteURL(x.scope === 'all' ? 'district' : x.scope) : `page.html?id=${encodeURIComponent(x.id)}${es ? '&lang=es' : ''}`;
      return `<div class="listline"><div><span class="small muted">${kindLabel(x.kind)} · ${esc(scopeName)}</span><h4 style="margin:4px 0">${esc(es ? x.titleEs : x.title)}</h4><a class="arrow" href="${esc(href)}">${t('See it on the site', 'Verlo en el sitio')}</a></div></div>`;
    }).join('')}` : '';
  }

  ['d-title', 'd-body', 'd-titleEs', 'd-bodyEs', 'd-when', 'd-where'].forEach(id => $(id).addEventListener('input', preview));
  $('d-kind').addEventListener('change', kindChanged);
  $('d-scope').addEventListener('change', () => { if ($('d-kind').value === 'home') prefillHome(); preview(); });
  document.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => { pv = b.dataset.pv; document.querySelectorAll('[data-pv]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); preview(); });
  $('d-reset').onclick = () => { saveDemoItems([]); listPublished(); $('d-check').textContent = t('Demo reset. All your edits were removed from this browser.', 'Demo restablecida. Se quitaron sus ediciones de este navegador.'); };
  $('demo-form').onsubmit = e => {
    e.preventDefault();
    const p = problems();
    if (p.length) { $('d-check').textContent = p.join(' '); $('d-check').className = 'small notice error'; return; }
    $('d-check').className = 'small';
    const kind = $('d-kind').value, scope = $('d-scope').value, now = new Date();
    const item = { id: kind === 'home' ? 'demo-home-' + scope : 'demo-' + kind + '-' + now.getTime(), kind, scope, publishedAt: now.toISOString(),
      title: val('d-title'), titleEs: val('d-titleEs'), body: val('d-body'), bodyEs: val('d-bodyEs'), sections: [] };
    if (kind === 'home') { const s = schools.find(x => x.id === scope); item.image = s ? s.image : 'assets/d11.png'; item.imageAlt = (s ? s.name : 'District 11') + ' identity'; item.imageAltEs = 'Identidad de ' + (s ? s.name : 'Distrito 11'); }
    if (kind === 'event') { item.eventAt = new Date(val('d-when')).toISOString(); item.location = val('d-where'); }
    if (kind === 'alert') item.expiresAt = new Date(now.getTime() + Number($('d-expire').value) * 3600e3).toISOString();
    const items = demoItems().filter(x => x.id !== item.id);
    if (!saveDemoItems([item, ...items])) { $('d-check').textContent = t('This browser blocked saving. Try a regular (not private) window.', 'Este navegador bloqueó el guardado. Pruebe una ventana normal (no privada).'); return; }
    const href = kind === 'home' || kind === 'alert' ? siteURL(scope === 'all' ? 'district' : scope) : `page.html?id=${encodeURIComponent(item.id)}${es ? '&lang=es' : ''}`;
    $('d-check').innerHTML = `${t('Published.', 'Publicado.')} <a href="${esc(href)}">${t('Open the site to see it', 'Abra el sitio para verlo')}</a>`;
    listPublished();
  };
  kindChanged(); listPublished();
}
