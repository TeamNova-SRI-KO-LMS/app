import { expect, test } from '@playwright/test';
import { open } from './helpers';

test.describe('Phone layout', () => {
  test('TC-E2E-23 the mobile menu opens from the header and closes with Escape [NFR-007]', async ({ page }) => {
    await open(page, '/');
    const toggle = page.getByRole('button', { name: 'Toggle menu' });

    await toggle.click();
    await expect(page.getByRole('link', { name: 'About Us' }).last()).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  for (const path of ['/', '/courses', '/about', '/events', '/join']) {
    test(`TC-E2E-24 ${path} fits a phone screen without horizontal scrolling [NFR-007]`, async ({ page }) => {
      await open(page, path);
      await page.waitForLoadState('domcontentloaded');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
