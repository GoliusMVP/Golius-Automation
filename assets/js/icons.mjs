const paths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  classify: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h4"/>',
  crm: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M9 9v11M13 13h4M13 16h3"/>',
  approval: '<path d="M12 3 4 6v6c0 4 8 9 8 9s8-5 8-9V6zM8.5 12l2.5 2.5 4.5-5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  draft: '<path d="M12 4H5v16h15v-8M14 5l4-3 4 4-12 12-4 1 1-4z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  play: '<path fill="currentColor" stroke="none" d="m8 5 11 7-11 7z"/>',
  shield: '<path d="m12 3-8 3v6c0 5 8 9 8 9s8-4 8-9V6zM8 12l3 3 5-6"/>',
  connect: '<rect x="2" y="3" width="7" height="7" rx="2"/><rect x="15" y="14" width="7" height="7" rx="2"/><path d="M9 6h6a3 3 0 0 1 3 3v5M6 10v8h9"/>',
  workflow: '<rect x="2" y="8" width="6" height="7" rx="2"/><rect x="16" y="2" width="6" height="7" rx="2"/><rect x="16" y="15" width="6" height="7" rx="2"/><path d="M8 11.5h4V5.5h4M12 11.5v7H16"/>',
  spark: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  goal: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  warning: '<path d="m12 3 10 18H2zM12 9v5M12 17v.5"/>'
};
export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // All SVG fragments are fixed local constants; visitor text is never HTML.
  svg.innerHTML = paths[name] ?? paths.goal;
  return svg;
}
