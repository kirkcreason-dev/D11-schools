// Built-in translator: English and Spanish are written by staff; every other language is machine-translated on request.
const LANGS = [['vi', 'Tiếng Việt'], ['zh-CN', '中文'], ['ko', '한국어'], ['ar', 'العربية'], ['ru', 'Русский'], ['uk', 'Українська'], ['tl', 'Tagalog'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['ja', '日本語'], ['so', 'Soomaali'], ['am', 'አማርኛ'], ['ne', 'नेपाली'], ['sw', 'Kiswahili'], ['hi', 'हिन्दी'], ['fa', 'فارسی'], ['ps', 'پښتو']];
const cookieLang = () => (document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/) || [])[1] || '';
function setCookie(v) {
  const exp = v ? '' : ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=${v}${exp};path=/`;
  const host = location.hostname; if (host.includes('.')) document.cookie = `googtrans=${v}${exp};path=/;domain=.${host}`;
}
function load(onFail) {
  if (document.querySelector('#gt-script')) return;
  const box = document.createElement('div'); box.id = 'gt-el'; box.hidden = true; document.body.append(box);
  window.googleTranslateElementInit = () => { try { new window.google.translate.TranslateElement({ pageLanguage: document.documentElement.lang === 'es' ? 'es' : 'en', autoDisplay: false }, 'gt-el'); } catch { onFail?.(); } };
  const s = document.createElement('script'); s.id = 'gt-script'; s.async = true;
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.onerror = () => onFail?.();
  document.head.append(s);
}
export function addTranslator() {
  const toggle = document.querySelector('a.language'); if (!toggle || document.querySelector('#gt-lang')) return;
  const es = document.documentElement.lang === 'es', cur = cookieLang();
  if (!document.querySelector('#gt-style')) {
    const st = document.createElement('style'); st.id = 'gt-style';
    st.textContent = `.translate{display:inline-flex;align-items:center}.translate select{font:inherit;font-size:.85rem;font-weight:650;color:var(--navy);border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:#fff;max-width:150px}
iframe.skiptranslate,.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame,#gt-el{display:none!important}body{top:0!important}.goog-text-highlight{background:none!important;box-shadow:none!important}
.gt-note{position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:560px;margin:0 auto;background:var(--navy);color:#fff;border-radius:12px;padding:12px 16px;font-size:.9rem;box-shadow:0 8px 24px rgba(0,0,0,.25)}.gt-note button{margin-left:10px;font:inherit;font-weight:700;color:var(--navy);background:var(--gold);border:0;border-radius:6px;padding:4px 10px;cursor:pointer}`;
    document.head.append(st);
  }
  const wrap = document.createElement('span'); wrap.className = 'translate notranslate'; wrap.setAttribute('translate', 'no');
  wrap.innerHTML = `<label class="sr-only" for="gt-lang">${es ? 'Traducir esta página a otro idioma' : 'Translate this page into another language'}</label><select id="gt-lang"><option value="">🌐 ${es ? 'Otro idioma' : 'Translate'}</option>${LANGS.map(([c, n]) => `<option value="${c}" ${cur === c ? 'selected' : ''}>${n}</option>`).join('')}${cur ? `<option value="off">${es ? 'Original (español)' : 'Original (English)'}</option>` : ''}</select>`;
  toggle.after(wrap);
  const fail = () => { setCookie(''); const n = document.createElement('div'); n.className = 'gt-note'; n.setAttribute('role', 'status'); n.innerHTML = `${es ? 'La traducción no pudo cargarse en este navegador.' : 'Translation could not load in this browser.'}<button type="button">OK</button>`; n.querySelector('button').onclick = () => n.remove(); document.body.append(n); };
  if (cur) {
    load(fail);
    const n = document.createElement('div'); n.className = 'gt-note notranslate'; n.setAttribute('translate', 'no'); n.setAttribute('role', 'status');
    n.innerHTML = `${es ? 'Traducción automática. El inglés y el español los escribe el personal.' : 'Machine translation. English and Spanish are written by staff.'}<button type="button">${es ? 'Ver original' : 'Show original'}</button>`;
    n.querySelector('button').onclick = () => { setCookie(''); location.reload(); };
    document.body.append(n);
  }
  wrap.querySelector('select').addEventListener('change', e => {
    const v = e.target.value; if (!v) return;
    if (v === 'off') { setCookie(''); location.reload(); return; }
    setCookie(`/${es ? 'es' : 'en'}/${v}`); location.reload();
  });
}
