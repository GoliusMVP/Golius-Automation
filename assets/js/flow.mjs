import { icon } from './icons.mjs';
const SVG = 'http://www.w3.org/2000/svg';
const statusLabels = { ready: 'Ready', active: 'In progress', complete: 'Complete', approval: 'Awaiting approval', blocked: 'Dependency missing' };

export class WorkflowCanvas {
  constructor({ canvas, list, connections, onInspect }) {
    Object.assign(this, { canvas, list, connections, onInspect });
    this.steps = [];
    this.statuses = [];
    this.index = -1;
    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(canvas);
  }
  render(steps, { preview = false, animate = false } = {}) {
    this.steps = steps;
    this.preview = preview;
    this.canvas.dataset.preview = String(preview);
    this.canvas.dataset.entering = String(animate);
    this.list.replaceChildren(...steps.map((step, index) => {
      const item = document.createElement('li');
      item.className = 'flow-item';
      item.style.setProperty('--index', String(index));
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'flow-node'; button.dataset.step = step.id;
      const top = document.createElement('span');top.className = 'node-top';
      const graphic = document.createElement('span');graphic.className = 'node-icon';graphic.append(icon(step.icon));
      const number = document.createElement('span');number.className = 'node-number';number.textContent = String(index + 1).padStart(2, '0');
      top.append(graphic, number);
      const title = document.createElement('span');title.className = 'node-title';title.textContent = step.title;
      const description = document.createElement('span');description.className = 'node-description';description.textContent = step.description;
      const status = document.createElement('span');status.className = 'node-status';
      button.append(top, title, description, status);
      button.addEventListener('click', () => this.onInspect(step, index));
      item.append(button);return item;
    }));
    this.update(steps.map(step => step.blocked ? 'blocked' : 'ready'), -1);
    this.layout();
  }
  update(statuses, index) {
    this.statuses = statuses;
    this.index = index;
    this.list.querySelectorAll('.flow-node').forEach((node, position) => {
      const status = statuses[position] ?? 'ready';
      node.dataset.status = status;
      node.querySelector('.node-status').textContent = this.preview && status === 'ready' ? 'Example step' : statusLabels[status];
      node.setAttribute('aria-label', `Step ${position + 1}: ${this.steps[position].title}. ${statusLabels[status]}. Inspect sample output.`);
      if (index === position) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
      node.querySelector('.node-number').textContent = status === 'complete' ? '✓' : String(position + 1).padStart(2, '0');
    });
    this.draw();
  }
  layout() {
    if (!this.steps.length) return;
    const columns = getComputedStyle(this.list).gridTemplateColumns.split(' ').filter(Boolean).length;
    [...this.list.children].forEach((item, index) => {
      const row = Math.floor(index / columns);
      const column = row % 2 === 0 ? index % columns : columns - 1 - index % columns;
      item.style.gridRow = String(row + 1);
      item.style.gridColumn = String(column + 1);
    });
    this.draw();
  }
  draw() {
    if (!this.steps.length) return;
    const box = this.canvas.getBoundingClientRect();
    this.connections.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const buttons = [...this.list.querySelectorAll('.flow-node')];
    const definitions = document.createElementNS(SVG, 'defs');
    const arrow = document.createElementNS(SVG, 'marker');
    for (const [name, value] of Object.entries({ id: 'golius-flow-arrow', viewBox: '0 -4 8 8', refX: '7', refY: '0', markerWidth: '5', markerHeight: '5', orient: 'auto' })) arrow.setAttribute(name, value);
    const triangle = document.createElementNS(SVG, 'path');triangle.setAttribute('d', 'M 0 -3 L 7 0 L 0 3 Z');triangle.setAttribute('fill', '#a7b99f');
    arrow.append(triangle);definitions.append(arrow);
    const lines = [definitions];
    for (let index = 0; index < buttons.length - 1; index++) {
      const a = buttons[index].getBoundingClientRect(), b = buttons[index + 1].getBoundingClientRect();
      const vertical = Math.abs(a.top - b.top) > 15;
      let path;
      if (vertical) {
        const x1 = a.left + a.width / 2 - box.left, x2 = b.left + b.width / 2 - box.left;
        const y1 = a.bottom - box.top, y2 = b.top - box.top, middle = (y1 + y2) / 2;
        path = `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`;
      } else {
        const forward = b.left > a.left;
        const x1 = (forward ? a.right : a.left) - box.left, x2 = (forward ? b.left : b.right) - box.left;
        const y = a.top + a.height / 2 - box.top;
        path = `M ${x1} ${y} L ${x2} ${y}`;
      }
      const line = document.createElementNS(SVG, 'path');
      line.setAttribute('d', path);line.setAttribute('marker-end', 'url(#golius-flow-arrow)');line.classList.add('flow-path');
      if (this.statuses[index] === 'complete') line.classList.add('is-complete');
      const active = !this.preview && this.index === index + 1 && this.statuses[index + 1] === 'active' && this.statuses[index] === 'complete';
      if (active) line.classList.add('is-active');
      lines.push(line);
      if (active && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const pulse = document.createElementNS(SVG, 'circle');pulse.setAttribute('r', '3.3');pulse.classList.add('flow-pulse');
        const motion = document.createElementNS(SVG, 'animateMotion');motion.setAttribute('path', path);motion.setAttribute('dur', '1.1s');motion.setAttribute('repeatCount', 'indefinite');pulse.append(motion);lines.push(pulse);
      }
    }
    this.connections.replaceChildren(...lines);
  }
}
