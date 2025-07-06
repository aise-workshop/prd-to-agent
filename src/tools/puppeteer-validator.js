const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');
const chalk = require('chalk');
const ora = require('ora');

class PuppeteerValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.serverProcess = null;
    this.retryCount = 0;
    this.maxRetries = config.test.retries;
  }

  async initialize() {
    this.browser = await puppeteer.launch(config.test.puppeteerOptions);
    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // Set default timeout
    this.page.setDefaultTimeout(config.test.timeout);
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(chalk.red(`Page Error: ${msg.text()}`));
      }
    });
  }

  async startDevServer(projectPath) {
    const spinner = ora('Starting development server...').start();
    
    try {
      // Detect package manager and start command
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      const startScript = packageJson.scripts?.start || packageJson.scripts?.dev || 'npm start';
      
      // Start the server
      this.serverProcess = spawn('npm', ['run', startScript.replace('npm run ', '')], {
        cwd: projectPath,
        stdio: 'pipe'
      });

      // Wait for server to be ready
      await this.waitForServer();
      
      spinner.succeed('Development server started');
      return true;
    } catch (error) {
      spinner.fail('Failed to start development server');
      throw error;
    }
  }

  async waitForServer(maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(config.test.baseUrl);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server not ready after ${maxWaitTime}ms`);
  }

  async validateRoutes(routes) {
    const validatedRoutes = [];
    const spinner = ora('Validating routes...').start();
    
    for (const route of routes) {
      spinner.text = `Validating route: ${route.path}`;
      
      try {
        const validation = await this.validateSingleRoute(route);
        validatedRoutes.push(validation);
      } catch (error) {
        validatedRoutes.push({
          ...route,
          valid: false,
          error: error.message,
          selectors: []
        });
      }
    }
    
    spinner.succeed(`Validated ${validatedRoutes.length} routes`);
    return validatedRoutes;
  }

  async validateSingleRoute(route) {
    const url = `${config.test.baseUrl}${route.path}`;
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      
      // Check if page loaded successfully
      const title = await this.page.title();
      const isErrorPage = await this.page.$('body') && !await this.page.$('[data-testid="error-page"]');
      
      if (!isErrorPage) {
        // Extract selectors from the page
        const selectors = await this.extractSelectorsFromPage();
        
        // Capture screenshot
        await this.captureScreenshot(route.path);
        
        return {
          ...route,
          valid: true,
          title,
          selectors,
          loadTime: Date.now() - this.startTime
        };
      } else {
        throw new Error('Page appears to be an error page');
      }
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(chalk.yellow(`Retrying route ${route.path} (${this.retryCount}/${this.maxRetries})`));
        return await this.validateSingleRoute(route);
      }
      
      throw error;
    }
  }

  async extractSelectorsFromPage() {
    return await this.page.evaluate(() => {
      const selectors = [];
      
      // Extract IDs
      const elementsWithId = document.querySelectorAll('[id]');
      elementsWithId.forEach(el => {
        if (el.id && !el.id.startsWith('__')) {
          selectors.push(`#${el.id}`);
        }
      });
      
      // Extract classes (common UI elements)
      const commonSelectors = [
        'button', 'input', 'form', 'nav', 'header', 'footer', 'main',
        '.btn', '.button', '.form', '.input', '.nav', '.header', '.footer',
        '[data-testid]', '[data-cy]', '[aria-label]'
      ];
      
      commonSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el, index) => {
            if (el.getAttribute('data-testid')) {
              selectors.push(`[data-testid="${el.getAttribute('data-testid')}"]`);
            } else if (el.getAttribute('data-cy')) {
              selectors.push(`[data-cy="${el.getAttribute('data-cy')}"]`);
            } else if (el.getAttribute('aria-label')) {
              selectors.push(`[aria-label="${el.getAttribute('aria-label')}"]`);
            } else if (selector.startsWith('.') || selector.startsWith('[')) {
              selectors.push(selector);
            } else {
              selectors.push(`${selector}:nth-child(${index + 1})`);
            }
          });
        }
      });
      
      return [...new Set(selectors)];
    });
  }

  async captureScreenshot(routePath) {
    const screenshotDir = config.output.screenshotDir;
    await fs.ensureDir(screenshotDir);
    
    const fileName = routePath.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '') + '.png';
    const filePath = path.join(screenshotDir, fileName);
    
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }

  async generateTestScenarios(validatedRoutes, userRequirement) {
    const scenarios = [];
    
    // Basic navigation scenarios
    for (const route of validatedRoutes.filter(r => r.valid)) {
      scenarios.push({
        name: `Navigate to ${route.path}`,
        steps: [
          { action: 'navigate', url: route.path },
          { action: 'waitForSelector', selector: 'body' },
          { action: 'screenshot', name: `${route.path}_loaded` }
        ],
        validated: true,
        route: route.path
      });
    }
    
    // User flow scenarios based on common patterns
    const loginRoute = validatedRoutes.find(r => r.path.includes('login'));
    const dashboardRoute = validatedRoutes.find(r => r.path.includes('dashboard') || r.path === '/');
    
    if (loginRoute && dashboardRoute) {
      scenarios.push({
        name: 'User Login Flow',
        steps: [
          { action: 'navigate', url: loginRoute.path },
          { action: 'waitForSelector', selector: 'input[type="email"], input[name="username"], #username' },
          { action: 'type', selector: 'input[type="email"], input[name="username"], #username', value: 'testuser@example.com' },
          { action: 'type', selector: 'input[type="password"], input[name="password"], #password', value: 'password123' },
          { action: 'click', selector: 'button[type="submit"], .btn-login, .login-btn' },
          { action: 'waitForNavigation', expectedUrl: dashboardRoute.path }
        ],
        validated: false,
        route: loginRoute.path
      });
    }
    
    return scenarios;
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

module.exports = PuppeteerValidator;