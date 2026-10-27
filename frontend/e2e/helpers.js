// Demo accounts created by backend/tests/fixtures/seedDemoData.js.
export const DEMO_PASSWORD = 'Demo@1234';
export const STUDENT = 'student@sriko.demo';
export const SECOND_STUDENT = 'kasun@sriko.demo';
export const ADMIN = 'admin@sriko.demo';

// Pages load third-party fonts and scripts; waiting for the DOM is enough for the app.
export const open = (page, path) => page.goto(path, { waitUntil: 'domcontentloaded' });

export async function signIn(page, email, { admin = false } = {}) {
  await open(page, admin ? '/admin/login' : '/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
}

export async function askAssistant(page, question) {
  await page.getByRole('button', { name: 'Chat with AI' }).click();
  await page.getByLabel('Message SRI-KO AI Support').fill(question);
  await page.getByRole('button', { name: 'Send message' }).click();
  return page.getByLabel('SRI-KO AI Support chat');
}
