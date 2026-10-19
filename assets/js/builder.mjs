import { SKILLS, DEFAULT_GOAL, DEFAULT_SKILLS, createPlan } from './plan.mjs';
import { DemoRunner } from './runner.mjs';
import { WorkflowCanvas } from './flow.mjs';
import { icon } from './icons.mjs';

export function mountBuilder(root) {
  const get = id => root.querySelector(`#${id}`);
  const form = get('builder-form'), goal = get('agent-goal'), options = get('skill-options');
  const workspace = root.querySelector('.builder-workspace');
  const completion = document.querySelector('#builder-completion');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = new Set(DEFAULT_SKILLS), plan = null, playback = false;
  const canvas = new WorkflowCanvas({ canvas: get('flow-canvas'), list: get('flow-nodes'), connections: get('flow-connections'), onInspect(step) {
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
      button.setAttribute('aria-label', skill.title);
      const check = document.createElement('span');check.className = 'skill-check';check.textContent = '✓';check.setAttribute('aria-hidden', 'true');
      const title = document.createElement('strong');title.textContent = skill.title;
      const description = document.createElement('small');description.id = `skill-description-${skill.id}`;description.textContent = skill.description;
      button.setAttribute('aria-describedby', description.id);
      button.append(icon(skill.icon), check, title, description);
      button.addEventListener('click', () => {
        if (selected.has(skill.id)) selected.delete(skill.id); else selected.add(skill.id);
        button.setAttribute('aria-pressed', String(selected.has(skill.id)));
        get('selection-count').textContent = `${selected.size} selected`;
        preview();
      });return button;
    }));
    get('selection-count').textContent = `${selected.size} selected`;
  }
  function preview() {
    runner.cancel();playback = false;plan = null;
    clearError();completion.hidden = true;get('approval-controls').hidden = true;
    get('run-animation').disabled = true;get('run-button-label').textContent = 'Run animation';
    get('workflow-title').textContent = 'A customer email. A clear next step.';
    get('plan-notice').hidden = true;
    setStage('preview', 'Example preview');
    if (selected.size) {
      const example = createPlan(selected, DEFAULT_GOAL);
      canvas.render(example.steps, { preview: true });
      setSample('A look inside', 'Select a step to explore its sample output, or generate your own illustrative plan.');
    } else {
      canvas.render([], { preview: true });
      get('flow-connections').replaceChildren();
      setSample('Your next move', 'Choose at least one skill to start your example workflow.');
    }
    get('run-status').textContent = 'Choose your skills, then generate a plan.';
  }
  function generate(event) {
    event.preventDefault();runner.cancel();playback = false;
    try { plan = createPlan(selected, goal.value); }
    catch (error) {
      get('config-error').textContent = error.message;get('config-error').hidden = false;
      if (!goal.value.trim()) {goal.setAttribute('aria-invalid', 'true');goal.focus();} else options.querySelector('button')?.focus();
      return;
    }
    clearError();completion.hidden = true;get('approval-controls').hidden = true;
    get('workflow-title').textContent = plan.goal;
    setStage('ready', `${plan.steps.length} steps · ready`);
    const notice = get('plan-notice');notice.hidden = plan.limitations.length === 0;
    notice.textContent = plan.limitations.join(' ');
    canvas.render(plan.steps, { animate: true });
    get('run-animation').disabled = false;get('run-button-label').textContent = 'Run animation';
    setSample('Plan prepared', 'This is a curated illustration using fictional sample data. Run the animation to follow the selected steps.');
    get('run-status').textContent = plan.incomplete ? 'Ready to illustrate. Missing dependencies will be clearly marked.' : 'Your sample workflow is ready. Nothing has run yet.';
    if (matchMedia('(max-width: 650px)').matches) workspace.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    get('run-animation').focus({ preventScroll: true });
  }
  function renderPlayback({ stage, index, statuses, step }) {
    canvas.update(statuses, index);
    const approval = stage === 'approval';get('approval-controls').hidden = !approval;
    if (stage === 'complete') {
      playback = false;get('run-animation').disabled = false;get('run-button-label').textContent = 'Replay animation';
      setStage('complete', plan.incomplete ? 'Finished · review gaps' : 'Illustration complete');
      setSample('Example finished', step.output);
      get('run-status').textContent = plan.incomplete ? 'Animation finished. Blocked steps were not simulated.' : 'Example complete. No real actions were taken.';
      completion.hidden = false;return;
    }
    if (approval) {
      setStage('approval', 'Human approval needed');setSample('Your decision', step.output);
      get('run-status').textContent = 'Paused for human approval. Review the sample and choose Approve example to continue.';
      get('approve-example').focus({ preventScroll: true });
      return;
    }
    setStage('running', 'Animation running');
    setSample(step.blocked ? 'Dependency missing' : `Sample output · ${step.title}`, step.blocked ? step.limitation : step.output);
    get('run-status').textContent = step.blocked ? `${step.title} is blocked. ${step.limitation}` : `Step ${index + 1} of ${plan.steps.length}: ${step.title}. ${statuses[index] === 'complete' ? 'Complete.' : 'Simulating with sample data.'}`;
  }
  get('run-animation').addEventListener('click', () => {
    if (!plan || playback) return;
    playback = true;completion.hidden = true;get('run-animation').disabled = true;get('run-button-label').textContent = 'Animating…';
    runner.run(plan);
  });
  get('approve-example').addEventListener('click', () => {
    if (!playback || workspace.dataset.stage !== 'approval') return;
    get('approval-controls').hidden = true;
    get('run-animation').focus({ preventScroll: true });
    runner.approve();
  });
  get('reset-builder').addEventListener('click', () => {
    goal.value = DEFAULT_GOAL;selected = new Set(DEFAULT_SKILLS);showSkills();preview();
    get('reset-builder').focus({ preventScroll: true });
  });
  goal.addEventListener('input', preview);
  form.addEventListener('submit', generate);
  // Stop suspended timers when the page leaves, including at an approval pause.
  window.addEventListener('pagehide', () => runner.cancel());
  reducedMotion.addEventListener('change', () => canvas.draw());
  showSkills();preview();
}
