import { resolveLanguage, localizeDocument } from './locale.mjs';
import { icon } from './icons.mjs';
import { mountBuilder } from './builder.mjs';
const language = await resolveLanguage({ search: location.search, languages: navigator.languages });
localizeDocument(document, language);
for (const placeholder of document.querySelectorAll('[data-icon]')) placeholder.append(icon(placeholder.dataset.icon));
const builder = document.querySelector('[data-builder]');
if (builder) mountBuilder(builder, language);
for (const link of document.querySelectorAll('[data-build-link]')) {
  link.addEventListener('click', () => document.querySelector('#agent-goal')?.focus({ preventScroll: true }));
}
