import { icon } from './icons.mjs';
import { mountBuilder } from './builder.mjs';
for (const placeholder of document.querySelectorAll('[data-icon]')) placeholder.append(icon(placeholder.dataset.icon));
const builder = document.querySelector('[data-builder]');
if (builder) mountBuilder(builder);
for (const link of document.querySelectorAll('[data-build-link]')) {
  link.addEventListener('click', () => document.querySelector('#agent-goal')?.focus({ preventScroll: true }));
}
