import { test, expect } from '@playwright/test';

async function country(page, code) {
  await page.route('**/cdn-cgi/trace', route => route.fulfill({ contentType: 'text/plain', body: `loc=${code}\n` }));
}

for (const width of [320, 390, 768, 1440]) test(`German country: translated site and full demo at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await country(page, 'DE');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('h1')).toHaveText('KI-Agenten, dieArbeit erledigen.');
  await expect(page).toHaveTitle('Golius — KI-Agenten, die Arbeit erledigen');
  await expect(page.locator('#agent-goal')).toHaveValue('Eingehende Kunden-E-Mails bearbeiten');
  await expect(page.locator('#selection-count')).toHaveText('5 ausgewählt');
  await expect(page.locator('.skill-card[data-skill=approval]')).toHaveAccessibleName('Freigabe anfordern');
  await page.getByRole('button', { name: 'Ablauf erstellen' }).click();
  await expect(page.locator('#workflow-state')).toHaveText('6 Schritte · bereit');
  await expect(page.locator('.flow-node[data-step=mail]')).toHaveAccessibleName(/Schritt 1: Eingehende E-Mail/);
  await page.clock.install();
  await page.getByRole('button', { name: 'Animation starten' }).click();
  await page.clock.runFor(6500);
  await expect(page.locator('#workflow-state')).toHaveText('Menschliche Freigabe erforderlich');
  await expect(page.locator('#sample-output')).toContainText('Wartet auf deine Freigabe');
  await page.getByRole('button', { name: 'Beispiel freigeben' }).click();
  await page.clock.runFor(4000);
  await expect(page.locator('#run-status')).toHaveText('Beispiel abgeschlossen. Es wurden keine echten Aktionen ausgeführt.');
  await page.getByRole('button', { name: 'Zurücksetzen' }).click();
  await expect(page.locator('#workflow-state')).toHaveText('Beispielvorschau');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/german-${width}.png`, fullPage: true });
});

test('outside Germany shows English even with a German browser', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  try {
    await country(page, 'AT'); await page.goto('/');
    await expect(page.locator('.skill-card')).toHaveCount(6);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('AI agents thatget work done.');
  } finally { await context.close(); }
});

test('manual switch overrides country and survives navigation to legal and back', async ({ page }) => {
  await country(page, 'US'); await page.goto('/');
  await page.getByRole('link', { name: 'Deutsch', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('link', { name: 'Deutsch', exact: true })).toHaveAttribute('aria-current', 'true');
  await page.getByRole('link', { name: 'Datenschutz', exact: true }).click();
  await expect(page).toHaveURL(/legal.html\?lang=de#datenschutz/);
  await expect(page.getByRole('link', { name: 'Zurück zur Website' })).toBeVisible();
  await expect(page.locator('.legal-warning')).toContainText('geprüften Rechtstexte');
  await page.getByRole('link', { name: 'Zurück zur Website' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.skill-card[data-skill=approval]')).toHaveAccessibleName('Request approval');
});

test('unavailable location falls back to browser language without external requests or storage', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  try {
    await page.route('**/cdn-cgi/trace', route => route.abort());
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('.skill-card')).toHaveCount(6);
    expect(requests.every(url => url.startsWith('http://127.0.0.1:4173/'))).toBe(true);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  } finally { await context.close(); }
});
