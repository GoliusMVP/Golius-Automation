import { german } from './translations.mjs';

export function translate(source, language = 'en', values = {}) {
  const template = language === 'de' ? (german[source] ?? source) : source;
  return template.replace(/\{(\w+)\}/g, (token, key) => String(values[key] ?? token));
}

export function browserLanguage(languages = []) {
  return languages[0]?.toLowerCase().split('-')[0] === 'de' ? 'de' : 'en';
}

export function countryLanguage(trace) {
  const country = /^loc=([A-Z]{2})\r?$/m.exec(trace)?.[1];
  return !country || country === 'XX' ? null : country === 'DE' ? 'de' : 'en';
}

export async function resolveLanguage({ search = '', languages = [], fetcher = globalThis.fetch, timeout = 1500 } = {}) {
  const requested = new URLSearchParams(search).get('lang');
  if (requested === 'de' || requested === 'en') return requested;
  const fallback = browserLanguage(languages);
  const controller = new AbortController();
  let timer;
  try {
    // Same origin: no third-party geo service, API key, location permission or storage.
    // A hard deadline also bounds reading the response body, not just the headers.
    return await Promise.race([
      (async () => {
        const response = await fetcher('/cdn-cgi/trace', {
          signal: controller.signal, cache: 'no-store', redirect: 'error'
        });
        return response.ok ? countryLanguage(await response.text()) ?? fallback : fallback;
      })(),
      new Promise(resolve => { timer = setTimeout(() => { controller.abort(); resolve(fallback); }, timeout); })
    ]);
  } catch { return fallback; }
  finally { clearTimeout(timer); controller.abort(); }
}

export function localizeDocument(document, language) {
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.documentElement, 4);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement.closest('script, style, noscript, [data-language-switch]')) continue;
    const source = node.textContent.trim();
    if (source) node.textContent = node.textContent.replace(source, translate(source, language));
  }
  for (const element of document.querySelectorAll('[aria-label], [placeholder], meta[name="description"]')) {
    for (const attribute of ['aria-label', 'placeholder', 'content']) {
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, translate(element.getAttribute(attribute), language));
    }
  }
  const goal = document.querySelector('#agent-goal');
  if (goal) goal.value = translate(goal.defaultValue.trim(), language);
  // Preserve an explicit language choice when navigating between local pages.
  const explicit = new URLSearchParams(location.search).get('lang');
  if (explicit === 'de' || explicit === 'en') {
    for (const link of document.querySelectorAll('a[href]')) {
      const url = new URL(link.href);
      if (url.origin === location.origin && url.pathname !== location.pathname) {
        url.searchParams.set('lang', explicit); link.href = url.href;
      }
    }
  }
  for (const switcher of document.querySelectorAll('[data-language-switch]')) {
    switcher.setAttribute('aria-label', translate('Language', language));
    for (const link of switcher.querySelectorAll('a')) {
      const url = new URL(location.href);
      url.searchParams.set('lang', link.hreflang);
      link.href = url.href;
      if (link.hreflang === language) link.setAttribute('aria-current', 'true');
    }
  }
}
