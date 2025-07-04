const puppeteer = require('puppeteer');
const TestHelpers = require('./test-helpers');

describe('Sample UI Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should load the homepage', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Take screenshot for reference
    await TestHelpers.takeScreenshot(page, 'homepage');
  });

  test('should navigate to login page', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Look for login link/button
    const loginSelector = 'a[href*="login"], button:contains("Login"), [data-testid="login-button"]';
    const loginExists = await TestHelpers.elementExists(page, loginSelector);
    
    if (loginExists) {
      await TestHelpers.clickAndWait(page, loginSelector);
      
      // Verify we're on login page
      const url = page.url();
      expect(url).toContain('login');
    }
  });

  test('should perform login', async () => {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Sample login flow
    const usernameSelector = 'input[name="username"], input[type="email"], #username';
    const passwordSelector = 'input[name="password"], input[type="password"], #password';
    const submitSelector = 'button[type="submit"], button:contains("Sign In")';
    
    if (await TestHelpers.elementExists(page, usernameSelector)) {
      await TestHelpers.typeText(page, usernameSelector, 'testuser@example.com');
      await TestHelpers.typeText(page, passwordSelector, 'Test123!');
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click(submitSelector)
      ]);
      
      // Verify successful login (adjust based on your app)
      const dashboardElement = await page.$('[data-testid="dashboard"], .dashboard, #dashboard');
      expect(dashboardElement).toBeTruthy();
    }
  });
});