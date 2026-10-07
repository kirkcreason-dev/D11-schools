// Districtwide events hub: one feed built from every school site, filterable by school level and event type.
import {t, esc, es, schoolURL, dateText, download} from './common.js';
import {demoItems} from './static-api.js';
import {sourceEvents} from './resources.js';
import {calendarICS} from './calendar-utils.js';

const TIERS = [['all', 'All schools', 'Todas las escuelas'], ['High', 'High School', 'Preparatoria'], ['Middle', 'Middle School', 'Secundaria'], ['Elementary', 'Elementary', 'Primaria']];
const TYPES = [['all', 'All events', 'Todos'], ['athletics', 'Athletics', 'Deportes'], ['board', 'Board meetings', 'Junta escolar'], ['holiday', 'Holidays & no school', 'Feriados y sin clases'], ['school', 'School events', 'Eventos escolares']];
const TYPE_LABEL = Object.fromEntries(TYPES.map(([k, en, sp]) => [k, [en, sp]]));
const SPORTS = [['Varsity volleyball', 'Voleibol varsity'], ['Varsity football', 'Fútbol americano varsity'], ['Boys soccer', 'Fútbol varonil'], ['Cross country meet', 'Competencia de campo traviesa'], ['Girls basketball', 'Básquetbol femenil'], ['Softball', 'Sóftbol']];
const MS_SPORTS = [['Volleyball', 'Voleibol'], ['Cross country', 'Campo traviesa'], ['Flag football', 'Fútbol de bandera'], ['Basketball', 'Básquetbol']];
const SCHOOL_EVENTS = [['Family literacy night', 'Noche familiar de lectura'], ['Book fair', 'Feria del libro'], ['Fall festival', 'Festival de otoño'], ['Picture day', 'Día de fotos'], ['Science night', 'Noche de ciencias'], ['Art show', 'Exposición de arte']];

// Small deterministic random so sample events stay the same within a day
function rng(seed) { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = x * 16807 % 2147483647) / 2147483647; }
const at = (base, days, hour, min = 0) => { const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(hour, min, 0, 0); return d.toISOString(); };

function sampleEvents(schools) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rand = rng(Math.floor(today.getTime() / 864e5)), pick = a => a[Math.floor(rand() * a.length)];
  const out = [], hs = schools.filter(s => s.level === 'High'), ms = schools.filter(s => s.level === 'Middle'), el = schools.filter(s => s.level === 'Elementary');
  hs.forEach((s, i) => [0, 1].forEach(k => { const opp = hs[(i + 1 + k) % hs.length], sp = SPORTS[(i * 2 + k) % SPORTS.length], home = k === 0;
    out.push({ id: `s-hs-${s.id}-${k}`, sample: true, type: 'athletics', school: s, eventAt: at(today, 2 + i * 3 + k * 9, 18), title: `${sp[0]}: ${s.name} vs. ${opp.name}`, titleEs: `${sp[1]}: ${s.name} vs. ${opp.name}`, location: home ? s.name : opp.name }); }));
  ms.forEach((s, i) => { const opp = ms[(i + 1) % ms.length], sp = MS_SPORTS[i % MS_SPORTS.length];
    out.push({ id: `s-ms-${s.id}`, sample: true, type: 'athletics', school: s, eventAt: at(today, 1 + (i * 2) % 21, 16), title: `${sp[0]}: ${s.name} vs. ${opp.name}`, titleEs: `${sp[1]}: ${s.name} vs. ${opp.name}`, location: s.name }); });
  el.forEach((s, i) => { if (i % 2) return; const ev = SCHOOL_EVENTS[i % SCHOOL_EVENTS.length];
    out.push({ id: `s-el-${s.id}`, sample: true, type: 'school', school: s, eventAt: at(today, 2 + (i * 3) % 26, 17, 30), title: `${ev[0]} at ${s.name}`, titleEs: `${ev[1]} en ${s.name}`, location: s.name }); });
  // Two sample board meetings on upcoming Wednesdays
  let d = new Date(today), n = 0; while (n < 2) { d.setDate(d.getDate() + 1); if (d.getDay() === 3 && d - today > 3 * 864e5) { out.push({ id: `s-board-${n}`, sample: true, type: 'board', school: null, eventAt: at(d, 0, 18), title: 'Board of Education regular meeting (sample date)', titleEs: 'Reunión ordinaria de la Junta de Educación (fecha de muestra)', location: '1115 N. El Paso St.' }); n++; d.setDate(d.getDate() + 10); } }
  return out;
}

export async function renderEventsHub(root) {
  if (!root) return;
  let schools = [];
  try { schools = await (await fetch('schools-data.json')).json(); } catch {}
  const byId = Object.fromEntries(schools.map(s => [s.id, s]));
  // 1) real district calendar dates, 2) every event published on any school site, 3) labeled sample events
  const holidays = sourceEvents.map(e => ({ ...e, type: 'holiday', school: null, official: true }));
  const published = demoItems().filter(x => x.kind === 'event' && x.status !== 'review' && x.status !== 'draft' && (!x.publishAt || new Date(x.publishAt) <= new Date()) && x.eventAt)
    .map(x => ({ id: x.id, type: x.eventType || 'school', school: byId[x.scope] || null, eventAt: x.eventAt, eventEnd: x.eventEnd, title: x.title, titleEs: x.titleEs, body: x.body, bodyEs: x.bodyEs, location: x.location, published: true, href: `page.html?id=${encodeURIComponent(x.id)}${es ? '&lang=es' : ''}` }));
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const all = [...holidays, ...published, ...sampleEvents(schools)].filter(e => new Date(e.eventEnd || e.eventAt) >= now).sort((a, b) => a.eventAt.localeCompare(b.eventAt));
  let tier = 'all', type = 'all', shown = 10;

  const matches = (e, tr = tier, ty = type) => (ty === 'all' || e.type === ty) && (tr === 'all' || !e.school || e.school.level === tr);
  const chip = (group, [k, en, sp], active, count) => `<button type="button" class="hub-chip" data-${group}="${k}" aria-pressed="${active === k}">${esc(t(en, sp))}<span class="hub-count">${count}</span></button>`;

  function draw() {
    const list = all.filter(e => matches(e)), sitesCount = new Set(list.filter(e => e.school).map(e => e.school.id)).size;
    root.innerHTML = `<div class="section-title"><div><div class="eyebrow">${t('One calendar · every school', 'Un calendario · todas las escuelas')}</div><h2 id="hub-title">${t('What’s happening across D11', 'Lo que pasa en todo D11')}</h2><p class="muted">${t('Events from every school site, gathered in one place automatically. When a school publishes an event, it appears here too.', 'Eventos de cada sitio escolar, reunidos automáticamente en un solo lugar. Cuando una escuela publica un evento, también aparece aquí.')}</p></div></div>
    <div class="hub-filters card"><div class="hub-row" role="group" aria-label="${t('School level', 'Nivel escolar')}"><span class="hub-label">${t('School level', 'Nivel escolar')}</span>${TIERS.map(x => chip('tier', x, tier, all.filter(e => matches(e, x[0], type)).length)).join('')}</div>
     <div class="hub-row" role="group" aria-label="${t('Event type', 'Tipo de evento')}"><span class="hub-label">${t('Event type', 'Tipo de evento')}</span>${TYPES.map(x => chip('type', x, type, all.filter(e => matches(e, tier, x[0])).length)).join('')}</div></div>
    <div class="hub-summary" role="status" aria-live="polite"><span>${t(`Showing ${list.length} upcoming events from ${sitesCount} school sites${list.some(e => !e.school) ? ' plus districtwide dates' : ''}`, `Mostrando ${list.length} eventos próximos de ${sitesCount} sitios escolares${list.some(e => !e.school) ? ' y fechas de todo el distrito' : ''}`)}</span>${list.length ? `<button type="button" class="btn compact" id="hub-ics">${t('Add these to my calendar (.ics)', 'Agregar a mi calendario (.ics)')}</button>` : ''}</div>
    <div class="hub-list">${list.length ? list.slice(0, shown).map(row).join('') : `<div class="empty">${t('No upcoming events match these filters.', 'No hay eventos próximos con estos filtros.')}</div>`}</div>
    ${list.length > shown ? `<button type="button" class="btn" id="hub-more">${t(`Show more (${list.length - shown})`, `Ver más (${list.length - shown})`)}</button>` : ''}
    <p class="source">${t('Holiday and no-school dates come from the district calendar. Athletics, school and board events marked “Sample” are demonstration data; on the live platform they flow in from each school’s own calendar.', 'Las fechas de feriados y días sin clases provienen del calendario del distrito. Los eventos deportivos, escolares y de la junta marcados “Muestra” son datos de demostración; en la plataforma real llegan del calendario de cada escuela.')}</p>`;
    root.querySelector('#hub-ics')?.addEventListener('click', () => download('d11-events.ics', calendarICS(list.map(toICS), es), 'text/calendar;charset=utf-8'));
    root.querySelector('#hub-more')?.addEventListener('click', () => { shown += 10; draw(); });
  }
  function toICS(e) { return { id: e.id, title: e.title, titleEs: e.titleEs, body: e.body || '', bodyEs: e.bodyEs || '', eventAt: e.eventAt, eventEnd: e.eventEnd, allDay: e.allDay, location: e.location }; }
  function row(e) {
    const s = e.school, d = e.eventAt, label = TYPE_LABEL[e.type] || TYPE_LABEL.school;
    const when = e.allDay ? t('All day', 'Todo el día') : dateText(d, { month: undefined, day: undefined, year: undefined, hour: 'numeric', minute: '2-digit' }) + ' MT';
    const title = es ? e.titleEs || e.title : e.title;
    return `<article class="hub-event"><div class="datebox">${dateText(d, { month: 'short', day: undefined, year: undefined })}<strong>${dateText(d, { day: 'numeric', month: undefined, year: undefined })}</strong></div>
      <div class="hub-main"><div class="hub-tags"><span class="hub-type hub-${e.type}">${esc(t(label[0], label[1]))}</span>${e.sample ? `<span class="hub-tag">${t('Sample', 'Muestra')}</span>` : ''}${e.published ? `<span class="hub-tag hub-new">${t('Published by the school', 'Publicado por la escuela')}</span>` : ''}${e.official ? `<span class="hub-tag">${t('District calendar', 'Calendario del distrito')}</span>` : ''}</div>
       <h3>${e.href ? `<a href="${esc(e.href)}">${esc(title)}</a>` : esc(title)}</h3>
       <p class="small muted">${esc(when)}${e.location ? ' · ' + esc(e.location) : ''}</p>
       ${s ? `<a class="hub-school" href="${esc(schoolURL(s.id))}"><img src="${esc(s.image)}" alt="" loading="lazy">${esc(s.name)}</a>` : `<span class="hub-school">${t('Districtwide', 'Todo el distrito')}</span>`}</div>
      <button type="button" class="btn compact hub-add" data-ics="${esc(e.id)}" aria-label="${esc(t('Add to calendar: ', 'Agregar al calendario: ') + title)}">${t('+ Calendar', '+ Calendario')}</button></article>`;
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-tier],[data-type],[data-ics]'); if (!b) return;
    if (b.dataset.tier) { tier = b.dataset.tier; shown = 10; draw(); root.querySelector(`[data-tier="${tier}"]`)?.focus(); }
    else if (b.dataset.type) { type = b.dataset.type; shown = 10; draw(); root.querySelector(`[data-type="${type}"]`)?.focus(); }
    else { const ev = all.find(x => x.id === b.dataset.ics); if (ev) download('d11-event.ics', calendarICS([toICS(ev)], es), 'text/calendar;charset=utf-8'); }
  });
  if (!document.querySelector('#hub-styles')) { const st = document.createElement('style'); st.id = 'hub-styles'; st.textContent = `
.hub-filters{display:grid;gap:12px;margin-bottom:14px}.hub-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.hub-label{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#41505f;min-width:110px}
.hub-chip{border:1px solid #c8d6e3;background:#fff;border-radius:999px;padding:7px 14px;font-weight:600;cursor:pointer;color:#0b2545;display:inline-flex;gap:8px;align-items:center}.hub-chip[aria-pressed=true]{background:#0b2545;color:#fff;border-color:#0b2545}.hub-count{font-size:.78rem;background:rgba(11,37,69,.08);border-radius:999px;padding:1px 7px}.hub-chip[aria-pressed=true] .hub-count{background:rgba(255,255,255,.2)}
.hub-summary{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin:8px 0 14px;font-weight:600}
.hub-list{display:grid;gap:10px;margin-bottom:14px}.hub-event{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;background:#fff;border:1px solid #dde6ee;border-radius:14px;padding:14px 16px}.hub-event h3{margin:4px 0;font-size:1.05rem}.hub-event p{margin:0 0 6px}
.hub-tags{display:flex;flex-wrap:wrap;gap:6px}.hub-type,.hub-tag{font-size:.72rem;font-weight:700;border-radius:999px;padding:2px 9px}.hub-tag{background:#eef2f6;color:#41505f}.hub-new{background:#e9f6ee;color:#1d6b45}
.hub-athletics{background:#e7f0fa;color:#145f9f}.hub-board{background:#f1e9fb;color:#4b2a7b}.hub-holiday{background:#fff1d1;color:#7a4a00}.hub-school{background:#e9f6ee;color:#1d6b45}
a.hub-school,span.hub-school{display:inline-flex;gap:8px;align-items:center;font-size:.88rem;font-weight:600}a.hub-school img{width:24px;height:24px;object-fit:contain}
@media (max-width:640px){.hub-event{grid-template-columns:auto 1fr}.hub-add{grid-column:1/-1;justify-self:start}.hub-label{min-width:100%}}`; document.head.append(st); }
  draw();
}
