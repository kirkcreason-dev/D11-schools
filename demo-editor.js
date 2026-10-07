// "Try it yourself" editor for the static demo. Everything is stored only in this visitor's browser.
import {t, esc, es, route, schoolURL} from './common.js';
import {demoItems, saveDemoItems, demoSchools, saveDemoSchools} from './static-api.js';
import {clearMedia} from './blocks.js';

const TEMPLATES = {
  blank: { kind: null, en: ['', ''], es: ['', ''] },
  spotlight: { kind: 'news',
    en: ['Spotlight: what makes {school} special', 'Families who visit {school} see it right away: [describe the program, team or tradition]. Here is what students are doing this month and how you can be part of it.'],
    es: ['Destacado: lo que hace especial a {school}', 'Las familias que visitan {school} lo notan de inmediato: [describa el programa, equipo o tradición]. Esto es lo que hacen los estudiantes este mes y cómo puede participar.'] },
  event: { kind: 'event',
    en: ['Family night at {school}', 'Join us for an evening of [activity]. Everyone is welcome. Interpretation is available in Spanish.'],
    es: ['Noche familiar en {school}', 'Acompáñenos en una noche de [actividad]. Todos son bienvenidos. Hay interpretación en español.'] },
  achievement: { kind: 'news',
    en: ['Congratulations to [student, team or staff member]!', '[Describe the achievement] — a proud moment for the whole {school} community.'],
    es: ['¡Felicidades a [estudiante, equipo o miembro del personal]!', '[Describa el logro]: un momento de orgullo para toda la comunidad de {school}.'] },
  newsletter: { kind: 'news',
    en: ['This week at {school}', 'Dates to remember:\n• [date] – [event]\n• [date] – [event]\n\nReminders:\n• [reminder]'],
    es: ['Esta semana en {school}', 'Fechas importantes:\n• [fecha] – [evento]\n• [fecha] – [evento]\n\nRecordatorios:\n• [recordatorio]'] },
  delay: { kind: 'alert',
    en: ['Weather delay: schools start two hours late', 'Due to road conditions, all District 11 schools start two hours late today. Buses run two hours later than usual.'],
    es: ['Retraso por clima: las escuelas comienzan dos horas tarde', 'Por las condiciones de las carreteras, todas las escuelas del Distrito 11 comienzan dos horas tarde hoy. Los autobuses pasan dos horas más tarde de lo habitual.'] }
};
const KINDS = { page: ['New page', 'Página nueva'], home: ['Homepage headline', 'Titular de inicio'], news: ['News story', 'Noticia'], event: ['Event', 'Evento'], alert: ['Alert banner', 'Aviso destacado'] };
const ROLE_KEY = 'd11-demo-role-v1';
const STYLE = `.demo-role{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;margin-bottom:20px}.demo-role p{flex-basis:100%;margin:0}
[data-role][aria-pressed=true],[data-pv][aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
.demo-lang{margin:16px 0}.demo-preview{margin-top:16px}.demo-preview .published-image,.demo-hero img{width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:12px}
.demo-hero{background:var(--navy);color:#fff;border-radius:14px;padding:18px}.demo-hero h3{color:#fff;margin:6px 0}.demo-hero .eyebrow{color:var(--gold)}
.checklist{background:#f2f6f9;border-radius:12px;padding:12px 16px;margin:16px 0}.checklist h4{margin:0 0 6px}.checklist ul{list-style:none;padding:0;margin:0}.checklist li{margin:4px 0}
.checklist li.ok span{color:#1d7a46;font-weight:700}.checklist li.no span{color:#b3261e;font-weight:700}.checklist li.warn span{color:#8a5a00;font-weight:700}
#d-submit:disabled{opacity:.55;cursor:not-allowed}
.demo-section{border:1px solid #dde6ee;border-radius:12px;padding:12px 14px;margin:12px 0}.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.new-school{margin-top:28px}aside>.card+.card{margin-top:20px}`;


export async function renderEditor(root) {
  if (!document.querySelector('#demo-editor-style')) { const st = document.createElement('style'); st.id = 'demo-editor-style'; st.textContent = STYLE; document.head.append(st); }
  let schools = [];
  try { schools = await (await fetch('schools-data.json')).json(); } catch {}
  let role = (() => { try { return localStorage.getItem(ROLE_KEY) || 'editor'; } catch { return 'editor'; } })();
  let editingId = null, image = '', pv = es ? 'es' : 'en', sections = [], nsLogo = '';

  const scopeName = s => s === 'all' ? t('District + all 58 schools', 'Distrito y las 58 escuelas') : s === 'district' ? t('District site', 'Sitio del distrito') : (schools.find(x => x.id === s)?.name || s);
  const siteURL = s => s === 'district' || s === 'all' ? route('index') : schoolURL(s);
  const viewURL = x => x.kind === 'home' || x.kind === 'alert' ? siteURL(x.scope) : `page.html?id=${encodeURIComponent(x.id)}${es ? '&lang=es' : ''}`;
  const now = () => new Date();
  const statusOf = x => x.status === 'draft' ? 'draft' : x.status === 'review' ? 'review' : x.expiresAt && new Date(x.expiresAt) <= now() ? 'expired' : x.publishAt && new Date(x.publishAt) > now() ? 'scheduled' : 'live';
  const badge = st => ({ live: `<span class="badge green">${t('Live', 'Publicado')}</span>`, review: `<span class="badge gold">${t('Awaiting approval', 'Pendiente de aprobación')}</span>`, scheduled: `<span class="badge">${t('Scheduled', 'Programado')}</span>`, expired: `<span class="badge">${t('Expired', 'Vencido')}</span>`, draft: `<span class="badge">${t('Draft', 'Borrador')}</span>` }[st]);
  const toLocal = v => { if (!v) return ''; const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

  root.innerHTML = `<div class="section-title"><div><div class="eyebrow">${t('Try it yourself', 'Pruébelo usted mismo')}</div><h2>${t('Update a school site in under a minute.', 'Actualice un sitio escolar en menos de un minuto.')}</h2><p class="muted">${t('Pick a school, start from a template, add a photo, and publish in both languages. Switch roles to see how district approval works. Edits stay only in this browser.', 'Elija una escuela, comience con una plantilla, agregue una foto y publique en ambos idiomas. Cambie de rol para ver cómo funciona la aprobación del distrito. Las ediciones se guardan solo en este navegador.')}</p></div></div>
  <div class="card demo-role"><span id="role-label"><strong>${t('You are signed in as:', 'Usted ha iniciado sesión como:')}</strong></span><div class="buttons" role="group" aria-labelledby="role-label"><button type="button" class="btn compact" data-role="editor">${t('School editor', 'Editor escolar')}</button><button type="button" class="btn compact" data-role="publisher">${t('District publisher', 'Publicador del distrito')}</button></div><p class="small muted" id="role-help"></p></div>
  <div class="split"><form id="demo-form" class="card" novalidate>
   <h3 id="form-heading"></h3>
   <div class="form-grid">
    <div class="field"><label for="d-scope">${t('1. Which site?', '1. ¿Qué sitio?')}</label><select id="d-scope"></select></div>
    <div class="field"><label for="d-kind">${t('2. What are you publishing?', '2. ¿Qué va a publicar?')}</label><select id="d-kind">${Object.entries(KINDS).map(([k, [en, sp]]) => `<option value="${k}">${t(en, sp)}</option>`).join('')}</select></div>
    <div class="field full"><label for="d-template">${t('3. Start from a template (optional)', '3. Comience con una plantilla (opcional)')}</label><select id="d-template">
      <option value="blank">${t('Blank', 'En blanco')}</option><option value="spotlight">${t('School spotlight', 'Escuela destacada')}</option><option value="event">${t('Family event', 'Evento familiar')}</option><option value="achievement">${t('Achievement', 'Logro')}</option><option value="newsletter">${t('Weekly newsletter', 'Boletín semanal')}</option><option value="delay">${t('Weather delay (alert)', 'Retraso por clima (aviso)')}</option></select></div>
   </div>
   <fieldset class="card demo-lang"><legend>English</legend>
    <div class="field"><label for="d-title">${t('Title', 'Título')} (English)</label><input id="d-title" maxlength="120"></div>
    <div class="field"><label for="d-body">${t('Text', 'Texto')} (English)</label><textarea id="d-body" rows="5" maxlength="2000"></textarea></div></fieldset>
   <fieldset class="card demo-lang"><legend>Español</legend>
    <div class="field"><label for="d-titleEs">${t('Title', 'Título')} (Español)</label><input id="d-titleEs" maxlength="120"></div>
    <div class="field"><label for="d-bodyEs">${t('Text', 'Texto')} (Español)</label><textarea id="d-bodyEs" rows="5" maxlength="2000"></textarea></div></fieldset>
   <fieldset class="card demo-lang" id="sections-set" hidden><legend>${t('Page sections', 'Secciones de la página')}</legend><p class="small muted">${t('Add as many sections as you need. Each one gets a heading and text in both languages.', 'Agregue las secciones que necesite. Cada una lleva título y texto en ambos idiomas.')}</p><div id="d-sections"></div><button type="button" class="btn compact" id="d-add-section">+ ${t('Add a section', 'Agregar una sección')}</button></fieldset>
   <fieldset class="card demo-lang" id="photo-set"><legend>${t('Photo (optional)', 'Foto (opcional)')}</legend>
    <div class="field"><label for="d-photo">${t('Upload a photo (JPG, PNG or WebP)', 'Suba una foto (JPG, PNG o WebP)')}</label><input id="d-photo" type="file" accept="image/jpeg,image/png,image/webp"></div>
    <div id="photo-thumb"></div>
    <div class="form-grid"><div class="field"><label for="d-alt">${t('Photo description (English)', 'Descripción de la foto (inglés)')}</label><input id="d-alt" maxlength="200"></div>
    <div class="field"><label for="d-altEs">${t('Photo description (Spanish)', 'Descripción de la foto (español)')}</label><input id="d-altEs" maxlength="200"></div></div></fieldset>
   <div class="form-grid">
    <div class="field" id="d-when-wrap" hidden><label for="d-when">${t('Event date & time', 'Fecha y hora del evento')}</label><input id="d-when" type="datetime-local"></div>
    <div class="field" id="d-where-wrap" hidden><label for="d-where">${t('Location', 'Lugar')}</label><input id="d-where" maxlength="120"></div>
    <div class="field" id="d-etype-wrap" hidden><label for="d-etype">${t('Event type (shows in the district events hub)', 'Tipo de evento (aparece en el calendario del distrito)')}</label><select id="d-etype"><option value="school">${t('School event', 'Evento escolar')}</option><option value="athletics">${t('Athletics', 'Deportes')}</option><option value="board">${t('Board meeting', 'Junta escolar')}</option><option value="holiday">${t('Holiday or no school', 'Feriado o sin clases')}</option></select></div>
    <div class="field" id="d-expire-wrap" hidden><label for="d-expire">${t('Remove alert automatically after', 'Quitar el aviso automáticamente después de')}</label><select id="d-expire"><option value="1">${t('1 hour', '1 hora')}</option><option value="24" selected>${t('1 day', '1 día')}</option><option value="168">${t('1 week', '1 semana')}</option></select></div>
    <div class="field"><label for="d-schedule">${t('When should it go live?', '¿Cuándo debe publicarse?')}</label><select id="d-schedule"><option value="now">${t('Right away', 'De inmediato')}</option><option value="later">${t('Schedule for later', 'Programar para después')}</option></select></div>
    <div class="field" id="d-at-wrap" hidden><label for="d-at">${t('Go-live date & time', 'Fecha y hora de publicación')}</label><input id="d-at" type="datetime-local"></div>
   </div>
   <div class="checklist" id="d-checks" aria-live="polite"></div>
   <p id="d-msg" class="small" role="status" aria-live="polite"></p>
   <div class="buttons"><button class="btn primary" type="submit" id="d-submit"></button><button class="btn" type="button" id="d-cancel" hidden>${t('Cancel edit', 'Cancelar edición')}</button><button class="btn" type="button" id="d-reset">${t('Reset demo', 'Restablecer demo')}</button></div>
  </form>
  <aside><div class="card"><h3>${t('Preview', 'Vista previa')}</h3><div class="buttons" role="group" aria-label="${t('Preview language', 'Idioma de la vista previa')}"><button type="button" class="btn compact" data-pv="en">English</button><button type="button" class="btn compact" data-pv="es">Español</button></div><div id="d-preview" class="demo-preview"></div></div>
  <div class="card" id="d-queue" hidden></div>
  <div class="card" id="d-list"></div></aside></div>
  <div class="card new-school" id="new-school"><div class="eyebrow">${t('Add new', 'Agregar nuevo')}</div><h3>${t('Add a new school site', 'Agregar un sitio escolar nuevo')}</h3>
   <p class="small muted">${t('A new school, program or campus? A district publisher can add its site in a minute. It appears in the directory, search and the editor right away. Each added site is $1,000 per year under the flat rate.', '¿Una escuela, programa o campus nuevo? Un publicador del distrito puede agregar su sitio en un minuto. Aparece de inmediato en el directorio, la búsqueda y el editor. Cada sitio agregado cuesta $1,000 al año con la tarifa fija.')}</p>
   <p class="notice" id="ns-locked" hidden>${t('Switch to “District publisher” above to add a school site.', 'Cambie a “Publicador del distrito” arriba para agregar un sitio escolar.')}</p>
   <form id="ns-form" novalidate><div class="form-grid">
    <div class="field"><label for="ns-name">${t('School name', 'Nombre de la escuela')}</label><input id="ns-name" maxlength="80"></div>
    <div class="field"><label for="ns-level">${t('Level', 'Nivel')}</label><select id="ns-level"><option value="Elementary">${t('Elementary', 'Primaria')}</option><option value="Middle">${t('Middle', 'Secundaria')}</option><option value="High">${t('High', 'Preparatoria')}</option><option value="Program">${t('Program', 'Programa')}</option><option value="Preschool">${t('Preschool', 'Preescolar')}</option></select></div>
    <div class="field"><label for="ns-address">${t('Street address', 'Dirección')}</label><input id="ns-address" maxlength="120"></div>
    <div class="field"><label for="ns-phone">${t('Office phone', 'Teléfono de la oficina')}</label><input id="ns-phone" maxlength="20" inputmode="tel"></div>
    <div class="field full"><label for="ns-intro">${t('Short introduction (English)', 'Introducción breve (inglés)')}</label><textarea id="ns-intro" rows="2" maxlength="300"></textarea></div>
    <div class="field full"><label for="ns-introEs">${t('Short introduction (Spanish)', 'Introducción breve (español)')}</label><textarea id="ns-introEs" rows="2" maxlength="300"></textarea></div>
    <div class="field"><label for="ns-tags">${t('Highlights, separated by commas (English)', 'Aspectos destacados, separados por comas (inglés)')}</label><input id="ns-tags" maxlength="120" placeholder="STEM, Arts"></div>
    <div class="field"><label for="ns-tagsEs">${t('Highlights, separated by commas (Spanish)', 'Aspectos destacados, separados por comas (español)')}</label><input id="ns-tagsEs" maxlength="120" placeholder="STEM, Artes"></div>
    <div class="field full"><label for="ns-logo">${t('School logo (optional)', 'Logotipo de la escuela (opcional)')}</label><input id="ns-logo" type="file" accept="image/png,image/jpeg,image/webp"><div id="ns-thumb"></div></div>
   </div><p class="small" id="ns-msg" role="status" aria-live="polite"></p><div class="buttons"><button class="btn primary" type="submit" id="ns-submit">${t('Add school site', 'Agregar sitio escolar')}</button></div></form>
   <div id="ns-list"></div></div>`;

  const $ = id => root.querySelector('#' + id);
  function renderSections() {
    $('d-sections').innerHTML = sections.map((sec, i) => `<div class="demo-section" data-i="${i}"><div class="section-head"><strong>${t('Section', 'Sección')} ${i + 1}</strong><button type="button" class="btn compact" data-del-section="${i}">${t('Remove', 'Quitar')}</button></div><div class="form-grid">
      <div class="field"><label for="sec-${i}-title">${t('Heading (English)', 'Título (inglés)')}</label><input id="sec-${i}-title" data-sec="${i}" data-f="title" maxlength="100" value="${esc(sec.title)}"></div>
      <div class="field"><label for="sec-${i}-titleEs">${t('Heading (Spanish)', 'Título (español)')}</label><input id="sec-${i}-titleEs" data-sec="${i}" data-f="titleEs" maxlength="100" value="${esc(sec.titleEs)}"></div>
      <div class="field"><label for="sec-${i}-body">${t('Text (English)', 'Texto (inglés)')}</label><textarea id="sec-${i}-body" data-sec="${i}" data-f="body" rows="3" maxlength="2000">${esc(sec.body)}</textarea></div>
      <div class="field"><label for="sec-${i}-bodyEs">${t('Text (Spanish)', 'Texto (español)')}</label><textarea id="sec-${i}-bodyEs" data-sec="${i}" data-f="bodyEs" rows="3" maxlength="2000">${esc(sec.bodyEs)}</textarea></div></div></div>`).join('');
  }
  const val = id => $(id).value.trim();
  $('d-scope').innerHTML = `<option value="district">${t('District site', 'Sitio del distrito')}</option>` + schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');

  function setRole(r) {
    role = r; try { localStorage.setItem(ROLE_KEY, r); } catch {}
    root.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === r)));
    $('role-help').textContent = r === 'editor'
      ? t('School editors write and submit. A district publisher approves before anything goes live, so branding and accuracy stay consistent.', 'Los editores escolares redactan y envían. Un publicador del distrito aprueba antes de publicar, para mantener la marca y la precisión.')
      : t('District publishers can publish directly, approve school submissions, and send districtwide alerts to all 58 sites.', 'Los publicadores del distrito pueden publicar directamente, aprobar envíos escolares y enviar avisos a los 58 sitios.');
    updateSchoolLock(); refresh();
  }
  function syncKind() {
    const k = $('d-kind').value;
    $('d-when-wrap').hidden = $('d-where-wrap').hidden = $('d-etype-wrap').hidden = k !== 'event';
    $('d-expire-wrap').hidden = k !== 'alert';
    $('photo-set').hidden = k === 'alert';
    $('sections-set').hidden = k !== 'page';
    if (k === 'page' && !sections.length) { sections = [{ title: '', titleEs: '', body: '', bodyEs: '' }]; renderSections(); }
    const allOpt = $('d-scope').querySelector('option[value="all"]');
    if (k === 'alert' && role === 'publisher' && !allOpt) $('d-scope').insertAdjacentHTML('afterbegin', `<option value="all">${t('District + all 58 schools', 'Distrito y las 58 escuelas')}</option>`);
    if ((k !== 'alert' || role !== 'publisher') && allOpt) { if ($('d-scope').value === 'all') $('d-scope').value = 'district'; allOpt.remove(); }
  }
  function applyTemplate() {
    const tp = TEMPLATES[$('d-template').value]; if (!tp) return;
    const s = schools.find(x => x.id === $('d-scope').value), name = s ? s.name : 'District 11';
    if (tp.kind) { $('d-kind').value = tp.kind; syncKind(); }
    if ($('d-template').value === 'delay' && role === 'publisher') { syncKind(); $('d-scope').value = 'all'; }
    [['d-title', tp.en[0]], ['d-body', tp.en[1]], ['d-titleEs', tp.es[0]], ['d-bodyEs', tp.es[1]]].forEach(([id, v]) => $(id).value = v.replaceAll('{school}', name));
    refresh();
  }
  function prefillHome() {
    if ($('d-kind').value !== 'home' || editingId || val('d-title')) return;
    const s = schools.find(x => x.id === $('d-scope').value);
    $('d-title').value = s ? s.name : 'A world of possibility. Right here.';
    $('d-titleEs').value = s ? s.name : 'Un mundo de posibilidades. Aquí mismo.';
    $('d-body').value = s ? s.intro : 'Find your school. Discover your path. Connect with the people and resources that help your family thrive.';
    $('d-bodyEs').value = s ? s.introEs : 'Encuentre su escuela. Descubra su camino. Conéctese con las personas y los recursos que ayudan a su familia a prosperar.';
  }

  function checks() {
    const k = $('d-kind').value, list = [];
    const add = (ok, en, sp, required = true) => list.push({ ok, required, text: t(en, sp) });
    add(!!(val('d-title') && val('d-body')), 'English title and text', 'Título y texto en inglés');
    add(!!(val('d-titleEs') && val('d-bodyEs')), 'Spanish title and text', 'Título y texto en español');
    if (image) add(!!(val('d-alt') && val('d-altEs')), 'Photo described in both languages (screen readers)', 'Foto descrita en ambos idiomas (lectores de pantalla)');
    if (k === 'event') add(!!val('d-when'), 'Event date and time', 'Fecha y hora del evento');
    if (k === 'page') add(sections.length > 0 && sections.every(x => x.title.trim() && x.titleEs.trim() && x.body.trim() && x.bodyEs.trim()), 'Every section has a heading and text in both languages', 'Cada sección tiene título y texto en ambos idiomas');
    if ($('d-schedule').value === 'later') add(!!val('d-at') && new Date(val('d-at')) > now(), 'Go-live time is in the future', 'La hora de publicación es futura');
    const placeholders = /\[[^\]]+\]/.test([val('d-title'), val('d-body'), val('d-titleEs'), val('d-bodyEs'), ...(k === 'page' ? sections.flatMap(x => [x.title, x.titleEs, x.body, x.bodyEs]) : [])].join(' '));
    add(!placeholders, 'All [template prompts] replaced', 'Todas las [indicaciones] reemplazadas');
    const title = val('d-title');
    add(title.length <= 80, 'Title is short enough to read on a phone', 'El título es corto para leerse en el teléfono', false);
    add(!(title.length > 6 && title === title.toUpperCase() && /[A-Z]/.test(title)), 'Title is not all capital letters', 'El título no está todo en mayúsculas', false);
    return list;
  }
  function preview() {
    const k = $('d-kind').value, en = pv === 'en';
    const title = en ? val('d-title') : val('d-titleEs'), body = en ? val('d-body') : val('d-bodyEs'), alt = en ? val('d-alt') : val('d-altEs');
    const img = image ? `<img class="published-image" src="${image}" alt="${esc(alt)}">` : '';
    let html;
    if (k === 'alert') html = `<aside class="alert" style="padding:14px"><strong>${esc(title || '…')}</strong><p class="content-body">${esc(body)}</p></aside>`;
    else if (k === 'page') html = `<article class="card">${img}<span class="eyebrow">${esc(scopeName($('d-scope').value))}</span><h3>${esc(title || '…')}</h3><p class="content-body">${esc(body)}</p>${sections.map(x => `<h4>${esc((en ? x.title : x.titleEs) || '…')}</h4><p class="content-body">${esc(en ? x.body : x.bodyEs)}</p>`).join('')}</article>`;
    else if (k === 'home') html = `<div class="demo-hero">${img}<div class="eyebrow">${esc(scopeName($('d-scope').value))}</div><h3>${esc(title || '…')}</h3><p>${esc(body)}</p></div>`;
    else html = `<article class="card">${img}<span class="eyebrow">${t(KINDS[k][0], KINDS[k][1])}</span><h3>${esc(title || '…')}</h3><p class="content-body">${esc(body)}</p>${k === 'event' && val('d-when') ? `<p class="small muted">${esc(new Date(val('d-when')).toLocaleString(en ? 'en-US' : 'es-US', { dateStyle: 'medium', timeStyle: 'short' }))}${val('d-where') ? ' · ' + esc(val('d-where')) : ''}</p>` : ''}</article>`;
    $('d-preview').innerHTML = html;
    root.querySelectorAll('[data-pv]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pv === pv)));
  }
  function refresh() {
    const list = checks(), blocking = list.filter(c => c.required && !c.ok);
    $('d-checks').innerHTML = `<h4>${t('Ready to publish?', '¿Listo para publicar?')}</h4><ul>${list.map(c => `<li class="${c.ok ? 'ok' : c.required ? 'no' : 'warn'}"><span aria-hidden="true">${c.ok ? '✓' : c.required ? '✗' : '!'}</span> ${esc(c.text)}${!c.ok && !c.required ? ` <span class="small muted">(${t('suggestion', 'sugerencia')})</span>` : ''}</li>`).join('')}</ul>`;
    $('d-submit').textContent = role === 'editor' ? t('Submit for approval', 'Enviar para aprobación') : $('d-schedule').value === 'later' ? t('Schedule', 'Programar') : t('Publish', 'Publicar');
    $('d-submit').disabled = blocking.length > 0;
    $('form-heading').textContent = editingId ? t('Editing', 'Editando') : t('New content', 'Contenido nuevo');
    $('d-cancel').hidden = !editingId;
    $('d-at-wrap').hidden = $('d-schedule').value !== 'later';
    preview(); lists();
  }
  function itemRow(x, actions) {
    const st = statusOf(x);
    return `<div class="listline"><div style="width:100%"><span class="small muted">${t(KINDS[x.kind][0], KINDS[x.kind][1])} · ${esc(scopeName(x.scope))}</span> ${badge(st)}${st === 'scheduled' ? ` <span class="small muted">${esc(new Date(x.publishAt).toLocaleString(es ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }))}</span>` : ''}
      <h4 style="margin:4px 0">${esc(es ? x.titleEs : x.title)}</h4><div class="buttons">${actions}</div></div></div>`;
  }
  function lists() {
    const items = demoItems();
    const queue = items.filter(x => x.status === 'review');
    $('d-queue').hidden = role !== 'publisher' || !queue.length;
    $('d-queue').innerHTML = `<h3>${t('Awaiting your approval', 'Pendiente de su aprobación')} (${queue.length})</h3>` + queue.map(x => itemRow(x,
      `<button type="button" class="btn compact primary" data-approve="${x.id}">${t('Approve & publish', 'Aprobar y publicar')}</button><button type="button" class="btn compact" data-return="${x.id}">${t('Send back', 'Devolver')}</button>`)).join('');
    $('d-list').innerHTML = items.length ? `<h3>${t('Your content', 'Su contenido')}</h3>` + items.map(x => itemRow(x,
      `${statusOf(x) === 'live' ? `<a class="btn compact" href="${esc(viewURL(x))}">${t('View on site', 'Ver en el sitio')}</a>` : ''}<button type="button" class="btn compact" data-edit="${x.id}">${t('Edit', 'Editar')}</button>${(x.versions || []).length ? `<button type="button" class="btn compact" data-restore="${x.id}">${t('Undo last change', 'Deshacer último cambio')} (${x.versions.length})</button>` : ''}<button type="button" class="btn compact" data-remove="${x.id}">${t('Unpublish', 'Despublicar')}</button>`)).join('')
      : `<h3>${t('Your content', 'Su contenido')}</h3><p class="small muted">${t('Nothing yet. Publish something and it appears here.', 'Nada todavía. Publique algo y aparecerá aquí.')}</p>`;
  }
  function message(text, isError) { $('d-msg').innerHTML = text; $('d-msg').className = 'small' + (isError ? ' notice error' : ''); }
  function clearForm() {
    editingId = null; image = ''; sections = []; renderSections();
    ['d-title', 'd-body', 'd-titleEs', 'd-bodyEs', 'd-alt', 'd-altEs', 'd-when', 'd-where', 'd-at'].forEach(id => $(id).value = '');
    $('d-photo').value = ''; $('d-etype').value = 'school'; $('photo-thumb').innerHTML = ''; $('d-schedule').value = 'now'; $('d-template').value = 'blank';
  }
  function loadItem(x) {
    editingId = x.id; sections = (x.sections || []).map(y => ({ title: y.title || '', titleEs: y.titleEs || '', body: y.body || '', bodyEs: y.bodyEs || '' })); renderSections(); $('d-kind').value = x.kind; syncKind(); $('d-scope').value = x.scope;
    $('d-title').value = x.title; $('d-titleEs').value = x.titleEs; $('d-body').value = x.body; $('d-bodyEs').value = x.bodyEs;
    image = x.uploaded ? x.image : ''; $('d-alt').value = x.imageAlt || ''; $('d-altEs').value = x.imageAltEs || '';
    $('photo-thumb').innerHTML = image ? `<img src="${image}" alt="" style="max-width:160px;border-radius:10px;margin:8px 0">` : '';
    $('d-when').value = toLocal(x.eventAt); $('d-where').value = x.location || ''; $('d-etype').value = x.eventType || 'school';
    $('d-schedule').value = x.publishAt && new Date(x.publishAt) > now() ? 'later' : 'now'; $('d-at').value = toLocal(x.publishAt);
    refresh(); root.querySelector('#demo-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Photo upload: resized in the browser so it fits in local storage
  $('d-photo').addEventListener('change', () => {
    const f = $('d-photo').files[0]; if (!f) return;
    if (f.size > 8e6) { message(t('Choose a photo smaller than 8 MB.', 'Elija una foto de menos de 8 MB.'), true); $('d-photo').value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => {
      const scale = Math.min(1, 1100 / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); image = c.toDataURL('image/jpeg', 0.8);
      $('photo-thumb').innerHTML = `<img src="${image}" alt="" style="max-width:160px;border-radius:10px;margin:8px 0">`; refresh();
    }; img.src = reader.result; };
    reader.readAsDataURL(f);
  });

  root.querySelectorAll('[data-role]').forEach(b => b.onclick = () => { setRole(b.dataset.role); syncKind(); refresh(); });
  root.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => { pv = b.dataset.pv; preview(); });
  ['d-title', 'd-body', 'd-titleEs', 'd-bodyEs', 'd-alt', 'd-altEs', 'd-when', 'd-where', 'd-at'].forEach(id => $(id).addEventListener('input', refresh));
  $('d-kind').addEventListener('change', () => { syncKind(); prefillHome(); refresh(); });
  $('d-scope').addEventListener('change', () => { prefillHome(); refresh(); });
  $('d-template').addEventListener('change', applyTemplate);
  $('d-schedule').addEventListener('change', refresh);
  $('d-cancel').onclick = () => { clearForm(); refresh(); };
  $('d-reset').onclick = () => { saveDemoItems([]); saveDemoSchools([]); clearMedia(); try { localStorage.removeItem('d11-builder-working-v1'); } catch {} schools = schools.filter(x => !x.demo); rebuildScopes(); listSchools(); clearForm(); refresh(); message(t('Demo reset. All your edits were removed from this browser.', 'Demo restablecida. Se quitaron sus ediciones de este navegador.')); };

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-approve],[data-return],[data-edit],[data-restore],[data-remove]'); if (!b) return;
    const items = demoItems(), id = b.dataset.approve || b.dataset.return || b.dataset.edit || b.dataset.restore || b.dataset.remove, x = items.find(i => i.id === id); if (!x) return;
    if (b.dataset.approve) { x.status = 'published'; x.approvedAt = now().toISOString(); saveDemoItems(items); message(`${t('Approved.', 'Aprobado.')} <a href="${esc(viewURL(x))}">${t('See it on the site', 'Verlo en el sitio')}</a>`); }
    if (b.dataset.return) { saveDemoItems(items.filter(i => i.id !== id)); message(t('Sent back to the school editor.', 'Devuelto al editor escolar.')); }
    if (b.dataset.edit) { if (x.blocks) { location.href = `builder.html?id=${encodeURIComponent(x.id)}${es ? '&lang=es' : ''}`; return; } loadItem(x); return; }
    if (b.dataset.restore) { const prev = x.versions.shift(); Object.assign(x, prev, { versions: x.versions }); saveDemoItems(items); message(t('Previous version restored.', 'Versión anterior restaurada.')); }
    if (b.dataset.remove) { saveDemoItems(items.filter(i => i.id !== id)); if (editingId === id) clearForm(); message(t('Unpublished. It no longer appears on the site.', 'Despublicado. Ya no aparece en el sitio.')); }
    refresh();
  });

  root.querySelector('#demo-form').onsubmit = e => {
    e.preventDefault();
    if (checks().some(c => c.required && !c.ok)) return;
    const kind = $('d-kind').value, scope = $('d-scope').value, items = demoItems();
    const old = editingId ? items.find(i => i.id === editingId) : null;
    const s = schools.find(x => x.id === scope);
    const item = {
      id: old ? old.id : kind === 'home' ? 'demo-home-' + scope : `demo-${kind}-${Date.now()}`, kind, scope,
      status: role === 'editor' ? 'review' : 'published', publishedAt: now().toISOString(),
      publishAt: $('d-schedule').value === 'later' ? new Date(val('d-at')).toISOString() : null,
      title: val('d-title'), titleEs: val('d-titleEs'), body: val('d-body'), bodyEs: val('d-bodyEs'), sections: kind === 'page' ? sections.map(x => ({ type: 'text', title: x.title.trim(), titleEs: x.titleEs.trim(), body: x.body.trim(), bodyEs: x.bodyEs.trim() })) : [],
      image: image || (kind === 'home' ? (s ? s.image : 'assets/d11.png') : ''), uploaded: !!image,
      imageAlt: image ? val('d-alt') : kind === 'home' ? (s ? s.name : 'District 11') + ' identity' : '',
      imageAltEs: image ? val('d-altEs') : kind === 'home' ? 'Identidad de ' + (s ? s.name : 'Distrito 11') : '',
      eventAt: kind === 'event' ? new Date(val('d-when')).toISOString() : undefined, location: kind === 'event' ? val('d-where') : undefined, eventType: kind === 'event' ? $('d-etype').value : undefined,
      expiresAt: kind === 'alert' ? new Date(now().getTime() + Number($('d-expire').value) * 3600e3).toISOString() : undefined,
      versions: old ? [(({ versions, ...rest }) => rest)(old), ...(old.versions || [])].slice(0, 5) : []
    };
    const next = [item, ...items.filter(i => i.id !== item.id && !(kind === 'home' && i.kind === 'home' && i.scope === scope))];
    if (!saveDemoItems(next)) { message(t('This browser blocked saving (it may be private browsing, or the photo is too large). Try a smaller photo or a regular window.', 'Este navegador bloqueó el guardado (puede ser navegación privada o la foto es muy grande). Pruebe una foto más pequeña o una ventana normal.'), true); return; }
    const st = statusOf(item);
    message(st === 'review' ? t('Submitted. Switch to “District publisher” to approve it.', 'Enviado. Cambie a “Publicador del distrito” para aprobarlo.')
      : st === 'scheduled' ? t('Scheduled. It will appear on the site at the time you chose.', 'Programado. Aparecerá en el sitio a la hora elegida.')
      : `${t('Published.', 'Publicado.')} <a href="${esc(viewURL(item))}">${t('Open the site to see it', 'Abra el sitio para verlo')}</a>`);
    clearForm(); syncKind(); refresh();
  };

  // ── Page sections
  $('d-add-section').onclick = () => { sections.push({ title: '', titleEs: '', body: '', bodyEs: '' }); renderSections(); refresh(); root.querySelector(`#sec-${sections.length - 1}-title`)?.focus(); };
  root.addEventListener('input', e => { const f = e.target.closest('[data-sec]'); if (!f) return; sections[+f.dataset.sec][f.dataset.f] = f.value; refresh(); });
  root.addEventListener('click', e => { const d = e.target.closest('[data-del-section]'); if (!d) return; sections.splice(+d.dataset.delSection, 1); renderSections(); refresh(); });

  // ── Add a new school site
  function rebuildScopes() {
    const cur = $('d-scope').value;
    $('d-scope').innerHTML = `<option value="district">${t('District site', 'Sitio del distrito')}</option>` + schools.map(x => `<option value="${esc(x.id)}">${esc(x.name)}${x.demo ? ' ' + t('(new)', '(nuevo)') : ''}</option>`).join('');
    if ([...$('d-scope').options].some(o => o.value === cur)) $('d-scope').value = cur;
    syncKind();
  }
  function updateSchoolLock() {
    const locked = role !== 'publisher';
    $('ns-locked').hidden = !locked;
    root.querySelectorAll('#ns-form input, #ns-form select, #ns-form textarea, #ns-form button').forEach(el => el.disabled = locked);
  }
  function listSchools() {
    const list = demoSchools();
    $('ns-list').innerHTML = list.length ? `<h4 style="margin-top:20px">${t('Sites you added', 'Sitios que agregó')} · ${t('adds', 'agrega')} $${(list.length * 1000).toLocaleString('en-US')} ${t('per year', 'al año')}</h4>` + list.map(x => `<div class="listline"><div style="width:100%"><strong>${esc(x.name)}</strong> <span class="small muted">${esc(x.address || '')}</span><div class="buttons"><a class="btn compact" href="${esc(schoolURL(x.id))}">${t('View site', 'Ver sitio')}</a><a class="btn compact" href="${esc(route('schools'))}">${t('See it in the directory', 'Verlo en el directorio')}</a><button type="button" class="btn compact" data-del-school="${esc(x.id)}">${t('Remove', 'Quitar')}</button></div></div></div>`).join('') : '';
  }
  $('ns-logo').addEventListener('change', () => {
    const f = $('ns-logo').files[0]; if (!f) return;
    if (f.size > 5e6) { $('ns-msg').textContent = t('Choose a logo smaller than 5 MB.', 'Elija un logotipo de menos de 5 MB.'); $('ns-logo').value = ''; return; }
    const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => {
      const sc = Math.min(1, 420 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); nsLogo = c.toDataURL('image/png');
      $('ns-thumb').innerHTML = `<img src="${nsLogo}" alt="" style="max-width:110px;margin-top:8px">`;
    }; img.src = r.result; }; r.readAsDataURL(f);
  });
  $('ns-form').onsubmit = e => {
    e.preventDefault(); if (role !== 'publisher') return;
    const name = $('ns-name').value.trim(), intro = $('ns-intro').value.trim(), introEs = $('ns-introEs').value.trim();
    if (!name || !intro || !introEs) { $('ns-msg').className = 'small notice error'; $('ns-msg').textContent = t('Add the school name and an introduction in both languages.', 'Agregue el nombre de la escuela y una introducción en ambos idiomas.'); return; }
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = 'new-' + slug, list = demoSchools().filter(x => x.id !== id);
    const tags = $('ns-tags').value.split(',').map(x => x.trim()).filter(Boolean), tagsEs = $('ns-tagsEs').value.split(',').map(x => x.trim()).filter(Boolean);
    const school = { id, demo: true, name, level: $('ns-level').value, address: $('ns-address').value.trim(), phone: $('ns-phone').value.trim(), source: '',
      image: nsLogo || 'assets/d11.png', identity: nsLogo ? 'school' : 'district', intro, introEs, tags: tags.length ? tags : ['New site'], tagsEs: tagsEs.length ? tagsEs : (tags.length ? tags : ['Sitio nuevo']),
      checkedAt: new Date().toISOString().slice(0, 10), addressVerified: !!$('ns-address').value.trim() };
    if (!saveDemoSchools([...list, school])) { $('ns-msg').className = 'small notice error'; $('ns-msg').textContent = t('This browser blocked saving. Try a smaller logo or a regular window.', 'Este navegador bloqueó el guardado. Pruebe un logotipo más pequeño o una ventana normal.'); return; }
    schools = [...schools.filter(x => x.id !== id), school]; rebuildScopes(); $('d-scope').value = id; syncKind();
    $('ns-msg').className = 'small'; $('ns-msg').innerHTML = `${t('Added.', 'Agregado.')} <a href="${esc(schoolURL(id))}">${t('Open the new school site', 'Abrir el nuevo sitio escolar')}</a>. ${t('It is now selected above, so you can publish to it right away.', 'Ya está seleccionado arriba para que pueda publicar en él de inmediato.')}`;
    ['ns-name', 'ns-address', 'ns-phone', 'ns-intro', 'ns-introEs', 'ns-tags', 'ns-tagsEs'].forEach(x => $(x).value = ''); $('ns-logo').value = ''; $('ns-thumb').innerHTML = ''; nsLogo = '';
    listSchools(); refresh();
  };
  root.addEventListener('click', e => { const d = e.target.closest('[data-del-school]'); if (!d) return;
    saveDemoSchools(demoSchools().filter(x => x.id !== d.dataset.delSchool)); schools = schools.filter(x => x.id !== d.dataset.delSchool); rebuildScopes(); listSchools(); refresh(); });

  setRole(role); syncKind(); prefillHome(); listSchools(); refresh();
}
