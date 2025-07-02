
const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('Product Browsing Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: process.env.HEADLESS !== 'false',
      devtools: process.env.DEBUG === 'true'
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('User can login successfully', async () => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('#username');

    // Fill in login form
    await page.type('#username', 'testuser@example.com');
    await page.type('#password', 'testpassword');

    // Submit form
    await page.click('#login-submit');

    // Wait for navigation and verify
    await page.waitForNavigation();
    const currentUrl = page.url();
    expect(currentUrl).toContain('/products');

    // Verify page content
    const pageTitle = await page.title();
    expect(pageTitle).toContain('商品列表');
  });
});
