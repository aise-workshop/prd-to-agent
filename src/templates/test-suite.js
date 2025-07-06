const { test, expect } = require('@playwright/test');
{{imports}}

test.describe('{{testSuiteName}}', () => {
  let browser;
  let page;
  {{pageObjects}}

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    {{pageObjectInitializations}}
  });

  test.afterEach(async () => {
    await page.close();
  });

  {{testCases}}
});

// Helper functions
async function waitForElement(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
}

async function fillForm(page, formData) {
  for (const [selector, value] of Object.entries(formData)) {
    await page.fill(selector, value);
  }
}

async function assertPageTitle(page, expectedTitle) {
  const title = await page.title();
  expect(title).toContain(expectedTitle);
}

async function assertElementVisible(page, selector) {
  const element = await page.locator(selector);
  await expect(element).toBeVisible();
}

async function assertElementText(page, selector, expectedText) {
  const element = await page.locator(selector);
  await expect(element).toContainText(expectedText);
}