import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLanguage, countryLanguage, translate } from '../assets/js/locale.mjs';
import { createPlan, DEFAULT_SKILLS, DEFAULT_GOAL } from '../assets/js/plan.mjs';

const response = body => async () => ({ ok: true, text: async () => body });
test('country selects language even when browser preference differs', async () => {
  assert.equal(await resolveLanguage({ languages: ['en-US'], fetcher: response('colo=FRA\nloc=DE\n') }), 'de');
  for (const country of ['US', 'AT', 'CH', 'GB', 'FR']) {
    assert.equal(await resolveLanguage({ languages: ['de-DE'], fetcher: response(`loc=${country}\n`) }), 'en');
  }
  assert.equal(countryLanguage('loc=DE\r\n'), 'de');
  assert.equal(countryLanguage('<html>login</html>'), null);
  assert.equal(countryLanguage('loc=XX\n'), null);
});
test('explicit language wins and skips country lookup', async () => {
  for (const language of ['de', 'en']) {
    assert.equal(await resolveLanguage({ search: `?lang=${language}`, fetcher: () => { throw new Error('Must not fetch'); } }), language);
  }
  assert.equal(await resolveLanguage({ search: '?lang=fr', fetcher: response('loc=DE\n') }), 'de');
});
test('failed, invalid and stalled country lookup fall back without blocking the page', async () => {
  for (const fetcher of [async () => { throw new Error('Offline'); }, response('loc=XX\n'), response('<html>login</html>'), async () => ({ ok: false })]) {
    assert.equal(await resolveLanguage({ languages: ['de-DE'], fetcher }), 'de');
    assert.equal(await resolveLanguage({ languages: ['en-US', 'de-DE'], fetcher }), 'en');
  }
  assert.equal(await resolveLanguage({ languages: ['de'], timeout: 10, fetcher: () => new Promise(() => {}) }), 'de');
  assert.equal(await resolveLanguage({ timeout: 10, fetcher: async () => ({ ok: true, text: () => new Promise(() => {}) }) }), 'en');
});
test('German plans preserve goals, dependencies and approval behavior', () => {
  const plan = createPlan(DEFAULT_SKILLS, '<custom goal>', 'de');
  assert.equal(plan.goal, '<custom goal>');
  assert.equal(plan.steps[0].title, 'Eingehende E-Mail');
  assert.match(plan.steps.find(s => s.id === 'approval').output, /Freigabe/);
  const incomplete = createPlan(['crm'], DEFAULT_GOAL, 'de');
  assert.equal(incomplete.steps[0].blocked, true);
  assert.match(incomplete.steps[0].limitation, /E-Mails lesen \+ Datensätze suchen \+ Freigabe anfordern/);
  assert.match(incomplete.steps.at(-1).output, /Blockierte Schritte/);
  assert.throws(() => createPlan([], DEFAULT_GOAL, 'de'), /mindestens eine Fähigkeit/);
  assert.equal(translate('{count} selected', 'de', { count: 3 }), '3 ausgewählt');
});
