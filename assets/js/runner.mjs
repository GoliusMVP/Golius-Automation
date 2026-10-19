/** Cancellable local playback. The caller owns rendering, never production I/O. */
export class DemoRunner {
  #controller = null;
  #approve = null;
  constructor({ onChange, duration = () => 1250 } = {}) {
    this.onChange = onChange ?? (() => {});
    this.duration = duration;
  }
  cancel() {
    this.#controller?.abort();
    this.#controller = null;
    this.#approve = null;
  }
  approve() { this.#approve?.(); }
  async run(plan) {
    this.cancel();
    const controller = new AbortController();
    this.#controller = controller;
    const { signal } = controller;
    const statuses = plan.steps.map(() => 'ready');
    const notify = (stage, index) => {
      if (!signal.aborted) this.onChange({ stage, index, statuses: [...statuses], step: plan.steps[index] });
    };
    const wait = milliseconds => new Promise(resolve => {
      if (signal.aborted) return resolve();
      const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
      const timer = setTimeout(finish, milliseconds);
      signal.addEventListener('abort', finish, { once: true });
    });
    for (let index = 0; index < plan.steps.length; index++) {
      if (signal.aborted) return;
      const step = plan.steps[index];
      if (step.blocked) {
        statuses[index] = 'blocked';
        notify('running', index);
        await wait(this.duration() / 2);
        continue;
      }
      statuses[index] = 'active';
      notify('running', index);
      await wait(this.duration());
      if (signal.aborted) return;
      if (step.id === 'approval') {
        statuses[index] = 'approval';
        // Establish the continuation before notifying so synchronous consumers
        // can approve too; cancellation always releases this suspended run.
        await new Promise(resolve => {
          const resume = () => { this.#approve = null; signal.removeEventListener('abort', resume); resolve(); };
          this.#approve = resume;
          signal.addEventListener('abort', resume, { once: true });
          notify('approval', index);
        });
        if (signal.aborted) return;
      }
      statuses[index] = 'complete';
      notify('running', index);
    }
    if (!signal.aborted) notify('complete', plan.steps.length - 1);
    if (this.#controller === controller) this.#controller = null;
  }
}
