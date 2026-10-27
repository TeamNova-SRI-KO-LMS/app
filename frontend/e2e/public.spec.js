import { expect, test } from '@playwright/test';
import { askAssistant, open } from './helpers';

test.describe('Visitor journeys', () => {
  test('TC-E2E-01 the landing page shows the institute, navigation and calls to action [FR-003]', async ({ page }) => {
    await open(page, '/');

    await expect(page.getByRole('heading', { name: /Welcome to\s*SRI-KO/ })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Courses' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore Courses' })).toBeVisible();
  });

  test('TC-E2E-02 the catalogue lists published courses with LKR fees and hides drafts [FR-003]', async ({ page }) => {
    await open(page, '/courses');

    await expect(page.getByText('Korean for Beginners (TOPIK I)')).toBeVisible();
    await expect(page.getByText('LKR 15,000').first()).toBeVisible();
    await expect(page.getByText('TOPIK II Intensive')).toHaveCount(0);
  });

  test('TC-E2E-03 searching the catalogue narrows the list [FR-003]', async ({ page }) => {
    await open(page, '/courses');
    await expect(page.getByText('Korean for Beginners (TOPIK I)')).toBeVisible();

    await page.getByPlaceholder('Search courses, topics, or tags...').fill('Business');

    await expect(page.getByText('Business Korean', { exact: true })).toBeVisible();
    await expect(page.getByText('Korean for Beginners (TOPIK I)')).toHaveCount(0);
  });

  test('TC-E2E-04 a paid course page shows its fee and the card checkout [FR-003][FR-011]', async ({ page }) => {
    await open(page, '/courses');
    await page.getByRole('link', { name: /Korean for Beginners \(TOPIK I\)/ }).first().click();

    await expect(page).toHaveURL(/\/courses\/[a-f0-9]{24}$/);
    await expect(page.getByRole('button', { name: 'Buy Course (LKR 15,000)' })).toBeVisible();
    await expect(page.getByText('Secured by Stripe')).toBeVisible();
  });

  test('TC-E2E-05 every image on the About page loads (production regression) [NFR-007]', async ({ page }) => {
    await open(page, '/about');
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    });

    await expect.poll(() => page.evaluate(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0)), { timeout: 30_000 }).toBe(true);
    expect(await page.locator('img').count()).toBeGreaterThanOrEqual(3);
  });

  test('TC-E2E-06 the events page lists upcoming events [FR-018]', async ({ page }) => {
    await open(page, '/events');

    await expect(page.getByText('Chuseok Cultural Celebration').first()).toBeVisible();
  });

  test('TC-E2E-07 a visitor submits a Join Us application [FR-022]', async ({ page }) => {
    await open(page, '/join');

    await page.locator('input[name="name"]').fill('E2E Applicant');
    await page.locator('input[name="email"]').fill(`e2e.applicant+${Date.now()}@example.com`);
    await page.locator('input[name="phone"]').fill('0771234567');
    await page.locator('select[name="currentLevel"]').selectOption({ index: 1 });
    await page.locator('textarea[name="message"]').fill('I would like to join the next EPS-TOPIK batch.');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Thank you for reaching out! We will get back to you shortly.')).toBeVisible();
  });

  test('TC-E2E-08 the support assistant answers a visitor from live course data [FR-021]', async ({ page }) => {
    await open(page, '/');

    const chat = await askAssistant(page, 'What courses do you offer?');

    await expect(chat.getByText(/Korean for Beginners \(TOPIK I\) — Beginner · 12 weeks · LKR 15,000/)).toBeVisible();
  });

  test('TC-E2E-09 protected pages send a visitor to the sign-in page [FR-002]', async ({ page }) => {
    await open(page, '/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });
});
