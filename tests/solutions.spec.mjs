import { test, expect } from '@playwright/test';
for (const language of ['de', 'en']) {
  for (const width of [320, 390, 768, 1440]) {
    test(`solutions ${language} at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/solutions.html?lang=${language}`);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('h1')).toContainText(language === 'de' ? 'Deine Software bleibt.' : 'Keep your software.');
      await expect(page.locator('.solution-card')).toHaveCount(6);
      await expect(page.locator('.process-list li')).toHaveCount(5);
      await expect(page.locator('.solution-card').last()).toContainText(language === 'de' ? 'KI-Assistenten' : 'AI assistants');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const download = page.locator('a[download]');
      await expect(download).toHaveAttribute('href', 'assets/handouts/Golius_Automation_Handout.pdf');
      const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
      expect(file.suggestedFilename()).toBe('Golius_Automation_Handout.pdf');
      expect(await file.failure()).toBeNull();
      for (const link of await page.locator('a[href*="calendly.com"]').all()) {
        await expect(link).toHaveAttribute('href', 'https://calendly.com/gorovoy-golius/30min');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      expect(errors).toEqual([]);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: `test-results/solutions-${language}-${width}.png`, fullPage: true });
    });
  }
}
test('homepage navigation and language choice reach the solutions page', async ({ page }) => {
  await page.goto('/?lang=de');
  await page.locator('.nav-links').getByRole('link', { name: 'Leistungen', exact: true }).click();
  await expect(page).toHaveURL(/solutions.html\?lang=de/);
  await expect(page.locator('h1')).toContainText('Deine Software bleibt.');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('h1')).toContainText('Keep your software.');
  await page.locator('.site-header .brand').click();
  await expect(page).toHaveURL(/index.html\?lang=en/);
});
test('static content and handout are available without JavaScript', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/solutions.html');
    await expect(page.locator('.solution-card')).toHaveCount(6);
    await expect(page.locator('a[download]')).toBeVisible();
    const response = await request.get('/assets/handouts/Golius_Automation_Handout.pdf');
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  } finally { await context.close(); }
});
