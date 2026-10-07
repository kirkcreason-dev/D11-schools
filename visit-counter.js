// Visit log for the site owner: each page view is written to the owner's own Firebase database.
// No cookies, no IP addresses, nothing that identifies a person. Off until VISIT_DB is set in site-config.js.
import {VISIT_DB} from './site-config.js';
(() => {
  if (typeof window === 'undefined' || window.__d11Counter) return;
  window.__d11Counter = true;
  // Open any page with #skip-counting once in each of your own browsers so your own visits are not logged.
  try { if (location.hash === '#skip-counting') { localStorage.setItem('d11-skip', '1'); history.replaceState(null, '', location.pathname + location.search); } } catch {}
  let skip = false; try { skip = localStorage.getItem('d11-skip') === '1'; } catch {}
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const optedOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  if (!VISIT_DB || local || optedOut || skip) return;
  const cut = (v, n = 180) => String(v || '').slice(0, n);
  let visit = ''; try { visit = sessionStorage.getItem('d11-visit') || Math.random().toString(36).slice(2, 10); sessionStorage.setItem('d11-visit', visit); } catch {}
  const base = { r: cut(document.referrer ? new URL(document.referrer).hostname : ''), l: cut(navigator.language, 20), tz: cut(Intl.DateTimeFormat().resolvedOptions().timeZone, 60), s: `${screen.width}x${screen.height}`, v: visit };
  const send = path => { try { fetch(`${VISIT_DB.replace(/\/$/, '')}/d11visits.json`, { method: 'POST', keepalive: true, headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ ...base, p: cut(path), t: { '.sv': 'timestamp' } }) }).catch(() => {}); } catch {} };
  const page = () => location.pathname.replace(/^.*\//, '/') + location.search;
  send(page());
  // Staff workspace sections live after the # in the address; log each one the visitor opens.
  if (/staff(-es)?\.html$/.test(location.pathname)) window.addEventListener('hashchange', () => send(page() + location.hash.split('?')[0]));
})();
