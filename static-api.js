// Browser-only stand-in for the concept's server API, so the public site runs on any static host.
import {staticItems as baseItems, staticResources} from './static-content.js';
import {moreItems} from './static-content-more.js';
const staticItems = [...baseItems, ...moreItems];
import {resources, sourceEvents} from './resources.js';

const spanish = () => document.documentElement.lang === 'es' || new URLSearchParams(location.search).get('lang') === 'es';
const norm = s => String(s || '').toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let schoolsCache = null;
const schools = async () => schoolsCache || (schoolsCache = await (await fetch('schools-data.json')).json());
const lang = () => spanish() ? '&lang=es' : '';
const pageHref = id => `page.html?id=${encodeURIComponent(id)}${lang()}`;
const snippet = s => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > 180 ? s.slice(0, 177) + '…' : s; };

// Edits made in the "Try the editor" demo live only in this visitor's browser.
export const DEMO_KEY = 'd11-demo-content-v1';
export function demoItems() { try { const v = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
export function saveDemoItems(items) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(items)); return true; } catch { return false; } }
const allItems = () => {
  const local = demoItems().filter(x => !x.expiresAt || new Date(x.expiresAt) > new Date());
  return [...local, ...staticItems];
};

export async function staticApi(path, body) {
  if (!path.startsWith('/api/')) return undefined;
  const url = new URL(path, location.origin);
  const route = url.pathname;

  if (route === '/api/published') {
    const scope = url.searchParams.get('scope') || 'district';
    const items = allItems().filter(x => x.scope === scope || x.scope === 'all');
    const home = items.find(x => x.kind === 'home');
    return { items: items.filter(x => x.kind !== 'home' || x === home) };
  }

  if (route === '/api/page') {
    const item = allItems().find(x => x.id === url.searchParams.get('id'));
    if (!item) throw new Error('Not found');
    return { item };
  }

  if (route === '/api/search') {
    const q = norm(url.searchParams.get('q')), type = url.searchParams.get('type') || 'all', scope = url.searchParams.get('scope') || 'all';
    const es = spanish(), words = q.split(/\s+/).filter(Boolean);
    const list = await schools();
    const all = [
      ...list.map(s => ({ type: 'school', scope: s.id, title: s.name, school: '', href: `school.html?school=${encodeURIComponent(s.id)}${lang()}`,
        text: [s.name, s.address, s.phone, s.level, ...(s.tags || []), ...(s.tagsEs || []), es ? s.introEs : s.intro].join(' '), snippet: `${s.address} · ${s.phone} · ${es ? s.introEs : s.intro}` })),
      ...resources.map(r => ({ type: 'resource', scope: 'district', title: es ? r.titleEs : r.title, href: 'families.html' + (es ? '?lang=es' : '') + '#' + r.id,
        text: [r.title, r.titleEs, r.body, r.bodyEs, r.contact].join(' '), snippet: es ? r.bodyEs : r.body })),
      ...staticResources.map(r => ({ type: 'resource', scope: 'district', title: es ? r.titleEs : r.title, href: r.href + (es ? '?lang=es' : ''),
        text: [r.title, r.titleEs, r.body, r.bodyEs].join(' '), snippet: es ? r.bodyEs : r.body })),
      ...allItems().filter(x => x.kind !== 'home').map(x => ({ type: x.kind, scope: x.scope, title: es ? x.titleEs : x.title, href: pageHref(x.id),
        text: [x.title, x.titleEs, x.body, x.bodyEs, ...(x.sections || []).flatMap(s => [s.title, s.titleEs, s.body, s.bodyEs])].join(' '), snippet: es ? x.bodyEs : x.body })),
      ...sourceEvents.map(e => ({ type: 'event', scope: 'district', title: es ? e.titleEs : e.title, href: 'calendar.html' + (es ? '?lang=es' : ''),
        text: [e.title, e.titleEs, e.body, e.bodyEs, e.eventAt].join(' '), snippet: es ? e.bodyEs : e.body }))
    ];
    const found = all.filter(r => (type === 'all' || r.type === type) && (scope === 'all' || r.scope === scope || r.scope === 'all') && words.every(w => norm(r.text).includes(w)));
    const size = 10, pages = Math.max(1, Math.ceil(found.length / size)), page = Math.min(pages, Math.max(1, Number(url.searchParams.get('page')) || 1));
    return { total: found.length, page, pages, items: found.slice((page - 1) * size, page * size).map(r => ({ type: r.type, title: r.title, href: r.href, snippet: snippet(r.snippet), school: r.school || '' })) };
  }

  throw new Error(spanish() ? 'Esta función se muestra en la demostración en vivo.' : 'This feature is shown during the live demonstration.');
}
