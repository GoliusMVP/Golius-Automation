import { translate } from './locale.mjs';
import { SKILLS, DEFAULT_GOAL, DEFAULT_SKILLS, createPlan } from './plan.mjs';
import { DemoRunner } from './runner.mjs';
import { WorkflowCanvas } from './flow.mjs';
import { icon } from './icons.mjs';

export function mountBuilder(root, language = 'en') {
  const t = (source, values) => translate(source, language, values);
  const get = id => root.querySelector(`#${id}`);
  const form = get('builder-form'), goal = get('agent-goal'), options = get('skill-options');
  const workspace = root.querySelector('.builder-workspace');
  const completion = document.querySelector('#builder-completion');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = new Set(DEFAULT_SKILLS), plan = null, playback = false;
  const canvas = new WorkflowCanvas({ canvas: get('flow-canvas'), list: get('flow-nodes'), connections: get('flow-connections'), language, onInspect(step) {
    if (playback) return;
    setSample(step.title, step.blocked ? step.limitation : step.output);
  } });
  const runner = new DemoRunner({ duration: () => reducedMotion.matches ? 180 : 1250, onChange: renderPlayback });
  function setSample(label, output) {
    get('sample-label').textContent = label.toUpperCase();
    get('sample-output').textContent = output;
  }
  function setStage(stage, label) {
    workspace.dataset.stage = stage;
    get('workflow-state').dataset.stage = stage;
    get('workflow-state').textContent = label;
  }
  function clearError() { get('config-error').hidden = true;goal.removeAttribute('aria-invalid'); }
  function showSkills() {
    options.replaceChildren(...SKILLS.map(skill => {
      const button = document.createElement('button');button.type = 'button';button.className = 'skill-card';button.dataset.skill = skill.id;
      button.setAttribute('aria-pressed', String(selected.has(skill.id)));
      button.setAttribute('aria-label', t(skill.title));
      const check = document.createElement('span');check.className = 'skill-check';check.textContent = '✓';check.setAttribute('aria-hidden', 'true');
      const title = document.createElement('strong');title.textContent = t(skill.title);
      const description = document.createElement('small');description.id = `skill-description-${skill.id}`;description.textContent = t(skill.description);
      button.setAttribute('aria-describedby', description.id);
      button.append(icon(skill.icon), check, title, description);
      button.addEventListener('click', () => {
        if (selected.has(skill.id)) selected.delete(skill.id); else selected.add(skill.id);
        button.setAttribute('aria-pressed', String(selected.has(skill.id)));
        get('selection-count').textContent = t('{count} selected', { count: selected.size });
        preview();
      });return button;
    }));
    get('selection-count').textContent = t('{count} selected', { count: selected.size });
  }
  function preview() {
    runner.cancel();playback = false;plan = null;
    clearError();completion.hidden = true;get('approval-controls').hidden = true;
    get('run-animation').disabled = true;get('run-button-label').textContent = t('Run animation');
    get('workflow-title').textContent = t('A customer email. A clear next step.');
    get('plan-notice').hidden = true;
    setStage('preview', t('Example preview'));
    if (selected.size) {
      const example = createPlan(selected, t(DEFAULT_GOAL), language);
      canvas.render(example.steps, { preview: true });
      setSample(t('A look inside'), t('Select a step to explore its sample output, or generate your own illustrative plan.'));
    } else {
      canvas.render([], { preview: true });
      get('flow-connections').replaceChildren();
      setSample(t('Your next move'), t('Choose at least one skill to start your example workflow.'));
    }
    get('run-status').textContent = t('Choose your skills, then generate a plan.');
  }
  function generate(event) {
    event.preventDefault();runner.cancel();playback = false;
    try { plan = createPlan(selected, goal.value, language); }
    catch (error) {
      get('config-error').textContent = t(error.message);get('config-error').hidden = false;
      if (!goal.value.trim()) {goal.setAttribute('aria-invalid', 'true');goal.focus();} else options.querySelector('button')?.focus();
      return;
    }
    clearError();completion.hidden = true;get('approval-controls').hidden = true;
    get('workflow-title').textContent = plan.goal;
    setStage('ready', t('{count} steps · ready', { count: plan.steps.length }));
    const notice = get('plan-notice');notice.hidden = plan.limitations.length === 0;
    notice.textContent = plan.limitations.join(' ');
    canvas.render(plan.steps, { animate: true });
    get('run-animation').disabled = false;get('run-button-label').textContent = t('Run animation');
    setSample(t('Plan prepared'), t('This is a curated illustration using fictional sample data. Run the animation to follow the selected steps.'));
    get('run-status').textContent = plan.incomplete ? t('Ready to illustrate. Missing dependencies will be clearly marked.') : t('Your sample workflow is ready. Nothing has run yet.');
    if (matchMedia('(max-width: 650px)').matches) workspace.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    get('run-animation').focus({ preventScroll: true });
  }
  function renderPlayback({ stage, index, statuses, step }) {
    canvas.update(statuses, index);
    const approval = stage === 'approval';get('approval-controls').hidden = !approval;
    if (stage === 'complete') {
      playback = false;get('run-animation').disabled = false;get('run-button-label').textContent = t('Replay animation');
      setStage('complete', plan.incomplete ? t('Finished · review gaps') : t('Illustration complete'));
      setSample(t('Example finished'), step.output);
      get('run-status').textContent = plan.incomplete ? t('Animation finished. Blocked steps were not simulated.') : t('Example complete. No real actions were taken.');
      completion.hidden = false;return;
    }
    if (approval) {
      setStage('approval', t('Human approval needed'));setSample(t('Your decision'), step.output);
      get('run-status').textContent = t('Paused for human approval. Review the sample and choose Approve example to continue.');
      get('approve-example').focus({ preventScroll: true });
      return;
    }
    setStage('running', t('Animation running'));
    setSample(step.blocked ? t('Dependency missing') : t('Sample output · {title}', { title: step.title }), step.blocked ? step.limitation : step.output);
    get('run-status').textContent = step.blocked ? t('{title} is blocked. {limitation}', { title: step.title, limitation: step.limitation }) : t('Step {number} of {total}: {title}. {status}', { number: index + 1, total: plan.steps.length, title: step.title, status: statuses[index] === 'complete' ? t('Complete.') : t('Simulating with sample data.') });
  }
  get('run-animation').addEventListener('click', () => {
    if (!plan || playback) return;
    playback = true;completion.hidden = true;get('run-animation').disabled = true;get('run-button-label').textContent = t('Animating…');
    runner.run(plan);
  });
  get('approve-example').addEventListener('click', () => {
    if (!playback || workspace.dataset.stage !== 'approval') return;
    get('approval-controls').hidden = true;
    get('run-animation').focus({ preventScroll: true });
    runner.approve();
  });
  get('reset-builder').addEventListener('click', () => {
    goal.value = t(DEFAULT_GOAL);selected = new Set(DEFAULT_SKILLS);showSkills();preview();
    get('reset-builder').focus({ preventScroll: true });
  });
  goal.addEventListener('input', preview);
  form.addEventListener('submit', generate);
  // Stop suspended timers when the page leaves, including at an approval pause.
  window.addEventListener('pagehide', () => runner.cancel());
  reducedMotion.addEventListener('change', () => canvas.draw());
  showSkills();preview();
}
