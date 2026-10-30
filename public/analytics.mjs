import { MIXPANEL_TOKEN } from './analytics-config.mjs';

const CONSENT_KEY = 'rf-games-analytics-consent';
let mixpanel = null;
let loading = null;
let pending = [];

function choice() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

function clearMixpanelStorage() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`mp_${MIXPANEL_TOKEN}_`)) localStorage.removeItem(key);
    }
  } catch { /* Storage can be unavailable. */ }
  const host = location.hostname;
  const root = host.split('.').slice(-2).join('.');
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith(`mp_${MIXPANEL_TOKEN}_`)) {
      for (const domain of ['', `; domain=${host}`, `; domain=.${host}`, `; domain=.${root}`]) {
        document.cookie = `${name}=; path=/; max-age=0${domain}`;
      }
    }
  }
}

function start() {
  if (!MIXPANEL_TOKEN || choice() !== 'granted' || loading) return;
  loading = import('https://cdn.mxpnl.com/libs/mixpanel-js/dist/mixpanel.module.js')
    .then(({ default: sdk }) => {
      if (choice() !== 'granted') return;
      sdk.init(MIXPANEL_TOKEN, { track_pageview: false, persistence: 'localStorage', autocapture: false });
      sdk.register({ surface: 'games', site: 'games.rapidflare.ai' });
      mixpanel = sdk;
      sdk.track('Game Site Viewed', { path: location.pathname });
      for (const [event, properties] of pending) sdk.track(event, properties);
      pending = [];
    })
    .catch(() => { pending = []; loading = null; });
}

export function track(event, properties = {}) {
  if (!MIXPANEL_TOKEN || choice() !== 'granted') return;
  const data = { ...properties, path: location.pathname };
  if (mixpanel) mixpanel.track(event, data);
  else { pending.push([event, data]); start(); }
}

export function setupAnalytics() {
  if (!MIXPANEL_TOKEN) return;
  const wrap = document.createElement('div');
  wrap.className = 'analytics-consent';
  wrap.innerHTML = `<section class="analytics-banner" role="dialog" aria-labelledby="analytics-title" aria-describedby="analytics-desc" hidden>
    <h2 id="analytics-title">OPTIONAL ANALYTICS</h2>
    <p id="analytics-desc">If you accept, Mixpanel helps us see which games people play and whether they visit About. It may process technical data such as your IP address. No analytics loads before you accept.</p>
    <p><a href="https://mixpanel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Mixpanel privacy</a> · <a href="https://www.rapidflare.ai/privacy" target="_blank" rel="noopener noreferrer">Rapidflare privacy</a></p>
    <div class="analytics-actions"><button type="button" data-choice="denied">DECLINE</button><button type="button" data-choice="granted">ACCEPT</button></div>
  </section><button class="analytics-preferences" type="button" hidden>ANALYTICS SETTINGS</button>`;
  document.body.append(wrap);
  const banner = wrap.querySelector('.analytics-banner');
  const preferences = wrap.querySelector('.analytics-preferences');
  const sync = (showBanner = false) => {
    banner.hidden = !showBanner && Boolean(choice());
    preferences.hidden = !banner.hidden;
  };
  preferences.addEventListener('click', () => sync(true));
  wrap.addEventListener('click', (event) => {
    const value = event.target.closest('[data-choice]')?.dataset.choice;
    if (!value) return;
    const prior = choice();
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* Leave analytics off. */ }
    if (value === 'granted') start();
    else {
      pending = [];
      clearMixpanelStorage();
      if (prior === 'granted') { location.reload(); return; }
    }
    sync();
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href="/about.html"]')) track('About Link Clicked', { from: location.pathname });
  });
  sync();
  start();
}
