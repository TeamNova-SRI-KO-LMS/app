import { expect, test } from '@playwright/test';
import { ADMIN, open, signIn } from './helpers';

test.describe('Administrator journeys', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ADMIN, { admin: true });
    // /admin/login also matches /admin, so wait until the sign-in page is left.
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText('User Management').first()).toBeVisible();
  });

  test('TC-E2E-18 the attendance dashboard shows totals, the daily chart and per-course rates [FR-015][FR-008]', async ({ page }) => {
    await open(page, '/admin/attendance');

    await expect(page.getByText('Attendance rate')).toBeVisible();
    await expect(page.getByText('Sessions recorded')).toBeVisible();
    await expect(page.getByText('Status breakdown')).toBeVisible();
    await expect(page.getByText('Daily attendance')).toBeVisible();
    await expect(page.getByText('By course')).toBeVisible();
    // The course filter <select> holds the same title in a hidden <option>.
    await expect(page.getByText('Korean for Beginners (TOPIK I)').filter({ visible: true }).first()).toBeVisible();
  });

  test('TC-E2E-19 attendance records are exported as a CSV download [FR-015]', async ({ page }) => {
    await open(page, '/admin/attendance');
    await expect(page.getByText('Sessions recorded')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export CSV' }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^attendance.*\.csv$/);
  });

  test('TC-E2E-20 user management lists and searches accounts [FR-009]', async ({ page }) => {
    await open(page, '/admin/users');
    await expect(page.getByText('Nimali Perera').first()).toBeVisible();

    await page.getByPlaceholder('Search by name or email...').fill('Kasun');

    await expect(page.getByText('Kasun Silva').first()).toBeVisible();
    await expect(page.getByText('Nimali Perera')).toHaveCount(0);
  });

  test('TC-E2E-21 course management lists courses with LKR prices [FR-006]', async ({ page }) => {
    await open(page, '/admin/courses');

    await expect(page.getByText('Business Korean').first()).toBeVisible();
    await expect(page.getByText(/LKR\s?45,000/).first()).toBeVisible();
  });

  test('TC-E2E-22 analytics shows totals, user growth and revenue trends [FR-010]', async ({ page }) => {
    await open(page, '/admin/analytics');

    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('User Growth')).toBeVisible();
    await expect(page.getByText('Revenue Trends')).toBeVisible();
  });
});
