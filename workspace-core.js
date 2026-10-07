// Shared helpers for the staff workspace: content inventory, status, health checks, formatting.
import {t, esc, es, route, schoolURL} from './common.js';
import {demoItems, staticItems} from './static-api.js';
import {blockIssues} from './blocks.js';

export const KIND = { page: ['Page', 'Página'], home: ['Homepage headline', 'Titular de inicio'], news: ['News', 'Noticia'], event: ['Event', 'Evento'], alert: ['Alert', 'Aviso'] };
export const kindName = k => t(...(KIND[k] || [k, k]));
export const STATUS = { live: ['Live', 'Publicado', 'green'], review: ['Awaiting approval', 'Pendiente de aprobación', 'gold'], scheduled: ['Scheduled', 'Programado', ''], draft: ['Draft', 'Borrador', ''], expired: ['Expired', 'Vencido', ''] };
export const statusOf = x => x.builtin ? 'live' : x.status === 'draft' ? 'draft' : x.status === 'review' ? 'review' : x.expiresAt && new Date(x.expiresAt) <= new Date() ? 'expired' : x.publishAt && new Date(x.publishAt) > new Date() ? 'scheduled' : 'live';
export const badge = st => `<span class="badge ${STATUS[st][2]}">${t(STATUS[st][0], STATUS[st][1])}</span>`;
export const allContent = () => [...demoItems().map(x => ({ ...x, builtin: false })), ...staticItems.map(x => ({ ...x, builtin: true }))];
export const titleOf = x => (es ? x.titleEs || x.title : x.title || x.titleEs) || t('(untitled)', '(sin título)');
export const siteURL = s => s === 'district' || s === 'all' || !s ? route('index') : schoolURL(s);
export const viewURL = x => x.kind === 'home' || x.kind === 'alert' ? siteURL(x.scope) : `page.html?id=${encodeURIComponent(x.id)}${es ? '&lang=es' : ''}`;
export const when = v => v ? new Date(v).toLocaleString(es ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '';
export const day = v => new Date(v).toLocaleDateString(es ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
export function ago(v) {
  const s = Math.round((Date.now() - new Date(v)) / 1000), rtf = new Intl.RelativeTimeFormat(es ? 'es' : 'en', { numeric: 'auto' });
  if (Math.abs(s) < 60) return t('just now', 'justo ahora');
  const a = Math.abs(s);
  if (a < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  if (a < 7 * 86400) return rtf.format(-Math.round(s / 86400), 'day');
  return new Date(v).toLocaleDateString(es ? 'es-US' : 'en-US', { dateStyle: 'medium' });
}
export const fmtBytes = n => n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
export const csv = rows => rows.map(r => r.map(c => /[",\n]/.test(String(c ?? '')) ? `"${String(c).replace(/"/g, '""')}"` : String(c ?? '')).join(',')).join('\n');
export const ROLES = {
  owner: ['District owner', 'Propietario del distrito'],
  publisher: ['District publisher', 'Publicador del distrito'],
  editor: ['School editor', 'Editor escolar'],
  teacher: ['Teacher', 'Docente']
};
export const roleName = r => t(...(ROLES[r] || [r, r]));

// Every public page that exists in this build, so links can be checked
export const KNOWN_PAGES = new Set(['index', 'index-es', 'schools', 'schools-es', 'school', 'families', 'calendar', 'search', 'sources', 'privacy', 'staff', 'staff-es', 'messages', 'page', 'proposal', 'builder']);

// Health checks for one content item. ids = every page id that exists.
export function issuesOf(x, ids) {
  const out = [], err = (en, sp) => out.push({ level: 'error', en, es: sp }), warn = (en, sp) => out.push({ level: 'warn', en, es: sp });
  const has = v => !!String(v || '').trim();
  if (!has(x.title)) err('English title is missing', 'Falta el título en inglés');
  if (!has(x.titleEs)) err('Spanish title is missing', 'Falta el título en español');
  if (has(x.body) !== has(x.bodyEs)) err(has(x.body) ? 'Spanish text is missing' : 'English text is missing', has(x.body) ? 'Falta el texto en español' : 'Falta el texto en inglés');
  if (!x.blocks && !has(x.body) && !has(x.bodyEs) && !(x.sections || []).length) err('The page has no text', 'La página no tiene texto');
  (x.sections || []).forEach((s, i) => {
    if (has(s.title) !== has(s.titleEs) || has(s.body) !== has(s.bodyEs) || has(s.linkLabel) !== has(s.linkLabelEs)) err(`Section ${i + 1} is not in both languages`, `La sección ${i + 1} no está en ambos idiomas`);
  });
  if (x.uploaded && !(has(x.imageAlt) && has(x.imageAltEs))) err('Photo is not described in both languages', 'La foto no está descrita en ambos idiomas');
  const seen = new Set();
  (x.blocks || []).forEach(b => blockIssues(b).forEach(i => { if (!seen.has(i.en)) { seen.add(i.en); err(i.en, i.es); } }));
  (x.blocks || []).forEach(b => { if (b.type === 'button' && /^https?:/i.test(b.href || '')) warn('A button opens an outside website: check it still works', 'Un botón abre un sitio externo: verifique que funcione'); });
  const str = JSON.stringify(x);
  for (const m of new Set([...str.matchAll(/page\.html\?id=([\w-]+)/g)].map(m => m[1]))) if (!ids.has(m)) err(`Link to a page that no longer exists (${m})`, `Enlace a una página que ya no existe (${m})`);
  for (const m of new Set([...str.matchAll(/(?:^|["'\s(=])([a-z][\w-]*)\.html/gi)].map(m => m[1]))) if (!KNOWN_PAGES.has(m)) err(`Link to a missing page (${m}.html)`, `Enlace a una página inexistente (${m}.html)`);
  if (/\[[^\]]{2,}\]/.test([x.title, x.titleEs, x.body, x.bodyEs].join(' '))) err('Template prompts [like this] still need replacing', 'Hay [indicaciones] de plantilla sin reemplazar');
  if (x.kind === 'event' && !x.eventAt) err('Event has no date', 'El evento no tiene fecha');
  if (x.kind === 'event' && x.eventAt && statusOf(x) === 'live' && new Date(x.eventEnd || x.eventAt) < new Date(Date.now() - 864e5)) warn('The event date has passed: update or unpublish it', 'La fecha del evento ya pasó: actualícelo o despublíquelo');
  if (String(x.title || '').length > 80) warn('Title is long for phones (over 80 characters)', 'El título es largo para teléfonos (más de 80 caracteres)');
  if (has(x.title) && x.title.length > 6 && x.title === x.title.toUpperCase() && /[A-Z]/.test(x.title)) warn('Title is in all capital letters', 'El título está todo en mayúsculas');
  return out;
}
export function healthReport() {
  const items = allContent().filter(x => !['expired', 'draft'].includes(statusOf(x))), ids = new Set(items.map(x => x.id));
  const rows = items.map(x => ({ item: x, issues: issuesOf(x, ids) }));
  const errors = rows.filter(r => r.issues.some(i => i.level === 'error')), warnings = rows.filter(r => r.issues.some(i => i.level === 'warn'));
  return { rows, errors, warnings, score: rows.length ? Math.round(100 * (rows.length - errors.length) / rows.length) : 100 };
}
export const ACTIONS = {
  published: ['Published', 'Publicó'], submitted: ['Submitted for approval', 'Envió para aprobación'], drafted: ['Saved a draft', 'Guardó un borrador'],
  scheduled: ['Scheduled', 'Programó'], approved: ['Approved', 'Aprobó'], returned: ['Sent back with a note', 'Devolvió con una nota'], updated: ['Updated', 'Actualizó'],
  restored: ['Restored an earlier version of', 'Restauró una versión anterior de'], removed: ['Removed', 'Eliminó'], ended: ['Ended the alert', 'Terminó el aviso'],
  'site-added': ['Added a school site', 'Agregó un sitio escolar'], 'media-added': ['Uploaded', 'Subió'], 'media-removed': ['Deleted media', 'Eliminó un archivo'],
  'user-added': ['Added a person', 'Agregó a una persona'], 'user-changed': ['Changed the role of', 'Cambió el rol de'], 'user-removed': ['Removed a person', 'Quitó a una persona'],
  'redirect-added': ['Added a redirect', 'Agregó una redirección'], 'redirect-removed': ['Removed a redirect', 'Quitó una redirección'],
  checkpoint: ['Created a checkpoint', 'Creó un punto de restauración'], restore: ['Restored the site to a checkpoint', 'Restauró el sitio a un punto de restauración'],
  import: ['Imported a backup', 'Importó un respaldo'], request: ['Sent a change request', 'Envió una solicitud de cambio']
};
export const actionName = a => t(...(ACTIONS[a] || [a, a]));
export function logLine(e, scopeName) {
  const title = es ? e.titleEs || e.title : e.title || e.titleEs;
  return `<li class="ws-log"><span class="ws-log-dot ws-a-${esc(e.action)}" aria-hidden="true"></span><div><div><strong>${esc(roleName(e.role))}</strong> ${esc(actionName(e.action).toLowerCase())}${title ? ` <q>${esc(title)}</q>` : ''}${e.kind ? ` <span class="small muted">· ${esc(kindName(e.kind))}</span>` : ''}</div><div class="small muted">${e.scope ? esc(scopeName(e.scope)) + ' · ' : ''}<time datetime="${esc(e.at)}" title="${esc(when(e.at))}">${esc(ago(e.at))}</time>${e.note ? ` · ${t('Note:', 'Nota:')} ${esc(e.note)}` : ''}</div></div></li>`;
}
export { t, esc, es };
