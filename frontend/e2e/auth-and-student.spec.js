import { expect, test } from '@playwright/test';
import {
  ADMIN, SECOND_STUDENT, STUDENT, askAssistant, open, signIn,
} from './helpers';

test.describe('Signing in', () => {
  test('TC-E2E-10 a student signs in and reaches the learning dashboard [FR-002][FR-005]', async ({ page }) => {
    await signIn(page, STUDENT);
    await expect(page).not.toHaveURL(/\/login/);

    await open(page, '/dashboard');

    await expect(page.getByRole('heading', { name: 'Welcome back, Nimali.' })).toBeVisible();
    await expect(page.getByText('Courses Enrolled')).toBeVisible();
  });

  test('TC-E2E-11 a wrong password shows an error and keeps the user on the sign-in page [FR-002]', async ({ page }) => {
    await open(page, '/login');
    await page.locator('input[name="email"]').fill(STUDENT);
    await page.locator('input[name="password"]').fill('not-the-password');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-E2E-12 administrators are directed to their own portal [FR-009]', async ({ page }) => {
    await signIn(page, ADMIN);

    await expect(page.getByText(/Admin Access Portal/).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-E2E-13 an administrator signs in through the admin portal [FR-009]', async ({ page }) => {
    await signIn(page, ADMIN, { admin: true });

    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('User Management').first()).toBeVisible();
    await expect(page.getByText('SRI-KO Administrator').first()).toBeVisible();
  });
});

test.describe('Student journeys', () => {
  test('TC-E2E-14 a student sees their enrolled courses with progress [FR-005]', async ({ page }) => {
    await signIn(page, STUDENT);
    await expect(page).not.toHaveURL(/\/login/);

    await open(page, '/my-courses');

    await expect(page.getByText('Korean for Beginners (TOPIK I)').first()).toBeVisible();
    await expect(page.getByText('Korean Culture and Etiquette').first()).toBeVisible();
    await expect(page.getByText('Continue Learning').first()).toBeVisible();
  });

  test('TC-E2E-15 a student enrols in a free course from its course page [FR-004]', async ({ page }) => {
    await signIn(page, SECOND_STUDENT);
    await expect(page).not.toHaveURL(/\/login/);
    await open(page, '/courses');
    await page.getByRole('link', { name: /Korean Culture and Etiquette/ }).first().click();

    await page.getByRole('button', { name: 'Enroll for Free' }).click();

    await expect(page.getByText(/Successfully enrolled/)).toBeVisible();
  });

  test('TC-E2E-16 the profile shows the student\'s attendance history [FR-015]', async ({ page }) => {
    await signIn(page, STUDENT);
    await expect(page).not.toHaveURL(/\/login/);

    await open(page, '/profile');

    await expect(page.getByText(/present out of \d+ total sessions/)).toBeVisible();
    await expect(page.getByText('Medical appointment').first()).toBeVisible();
  });

  test('TC-E2E-17 the assistant reports the signed-in student\'s own attendance [FR-015][FR-021]', async ({ page }) => {
    await signIn(page, STUDENT);
    await expect(page).not.toHaveURL(/\/login/);
    await open(page, '/dashboard');

    const chat = await askAssistant(page, 'My attendance');

    await expect(chat.getByText(/Attendance rate: \d+%/)).toBeVisible();
  });
});
