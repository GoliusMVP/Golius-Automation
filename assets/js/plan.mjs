import { translate } from './locale.mjs';
export const DEFAULT_GOAL = 'Process incoming customer emails';
export const SKILLS = Object.freeze([
  { id: 'search', title: 'Search records', description: 'Find the right context.', icon: 'search' },
  { id: 'classify', title: 'Classify documents', description: 'Sort relevant attachments.', icon: 'classify' },
  { id: 'crm', title: 'Update CRM', description: 'Keep customer records current.', icon: 'crm' },
  { id: 'approval', title: 'Request approval', description: 'Put a person in the loop.', icon: 'approval' },
  { id: 'mail', title: 'Read emails', description: 'Understand the incoming request.', icon: 'mail' },
  { id: 'draft', title: 'Draft replies', description: 'Prepare a response to review.', icon: 'draft' }
]);
export const DEFAULT_SKILLS = Object.freeze(['mail', 'search', 'classify', 'approval', 'crm']);
const ORDER = ['mail', 'search', 'classify', 'draft', 'approval', 'crm'];
const requirements = {
  mail: [], search: ['mail'], classify: ['mail'], draft: ['mail'], approval: ['mail'], crm: ['mail', 'search', 'approval']
};
const samples = {
  mail: { title: 'Incoming email', description: 'A new customer enquiry', output: 'Fictional customer: Alex at Northstar Studio. “Could you update our billing contact? I’ve attached the details.”', detail: 'Read the prepared customer email. The demo does not access a mailbox.' },
  search: { title: 'Search records', description: 'Find the customer context', output: 'Sample match: Northstar Studio · Record C-1042. Current billing contact found. Proposed change ready to review.', detail: 'Look up the fictional customer record using the incoming email.' },
  classify: { title: 'Classify attachments', description: 'Identify relevant documents', output: 'Sample attachment: billing-details.pdf → Customer information update. Relevant to the request; queued for review.', detail: 'Classify the prepared example attachment. No document is uploaded or analysed.' },
  draft: { title: 'Draft a reply', description: 'Prepare, don’t send', output: 'Sample draft: “Thanks, Alex. We’ve received your request and will confirm once it has been reviewed.” Nothing is sent.', detail: 'Prepare a fictional acknowledgement. A draft is not a sent message.' },
  approval: { title: 'Request approval', description: 'A human makes the decision', output: 'Example review: change the billing contact on record C-1042 using the fictional attachment. Waiting for your approval.', detail: 'Pause the animation so you can explicitly approve the fictional next step.' },
  crm: { title: 'Update CRM', description: 'Only after approval', output: 'Simulated result: the billing contact on sample record C-1042 is updated after your approval. No CRM is connected.', detail: 'Show a simulated record change only when email, record lookup and approval are present.' }
};

/** Curated planning only: no network, model calls, random outcomes or side effects. */
export function createPlan(selected, goal, language = 'en') {
  const t = (source, values) => translate(source, language, values);
  const known = new Set(SKILLS.map(skill => skill.id));
  const chosen = new Set([...selected].filter(id => known.has(id)));
  const title = typeof goal === 'string' ? goal.trim() : '';
  if (!title || title.length > 160) throw new Error(t('Give your agent a goal of 1–160 characters.'));
  if (chosen.size === 0) throw new Error(t('Choose at least one skill to explore a workflow.'));
  const steps = ORDER.filter(id => chosen.has(id)).map(id => {
    const missing = requirements[id].filter(dependency => !chosen.has(dependency));
    const missingNames = missing.map(dependency => t(SKILLS.find(skill => skill.id === dependency).title));
    const limitation = missingNames.length ? t('Add {skills} to make this step possible.', { skills: missingNames.join(' + ') }) : '';
    const step = { id, icon: SKILLS.find(skill => skill.id === id).icon, ...samples[id], missing, blocked: missing.length > 0, limitation };
    if (id === 'approval' && !chosen.has('crm')) step.output = chosen.has('draft')
      ? 'Example review: check the fictional acknowledgement draft. Approving continues this illustration; no message will be sent.'
      : 'Example review: check the fictional customer request. Approving continues this local illustration; no live action follows.';
    for (const field of ['title', 'description', 'output', 'detail']) step[field] = t(step[field]);
    return step;
  });
  const limitations = steps.filter(step => step.blocked).map(step => `${step.title}: ${step.limitation}`);
  if (!chosen.has('mail')) limitations.unshift(t('No email source is selected. This email example cannot receive customer requests.'));
  if (chosen.has('draft') && !chosen.has('search')) limitations.push(t('Without Search records, the draft is a general acknowledgement, with no customer-record context.'));
  const incomplete = steps.some(step => step.blocked);
  steps.push({ id: 'complete', icon: incomplete ? 'warning' : 'check', title: incomplete ? 'Review the gaps' : 'Task completed', description: incomplete ? 'Some skills need dependencies' : 'The example has finished', blocked: false, missing: [], limitation: '', detail: 'A summary of this local illustration, not evidence of a live execution.', output: incomplete ? 'Illustration finished with missing dependencies. Blocked steps were not simulated. Adjust your skills and generate a new plan.' : 'Illustration complete. Your selected sample steps are finished. No accounts were connected and no real actions were taken.' });
  for (const field of ['title', 'description', 'output', 'detail']) steps.at(-1)[field] = t(steps.at(-1)[field]);
  // This short line remains true for arbitrary goal labels: the sample is always
  // an email workflow, never an invented general-purpose AI-generated plan.
  return { goal: title, selected: ORDER.filter(id => chosen.has(id)), steps, limitations, incomplete };
}
