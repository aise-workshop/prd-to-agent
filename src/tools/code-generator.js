const fs = require('fs-extra');
const path = require('path');
const { generateText } = require('ai');
const { configureLLMProvider } = require('../config/llm');
const config = require('../config');

class CodeGenerator {
  constructor() {
    this.llmConfig = configureLLMProvider();
  }

  async generateTestSuite(validationResult, analysis, userRequirement = '') {
    const testSuite = {
      pageObjects: await this.generatePageObjects(validationResult.validatedRoutes),
      testCases: await this.generateTestCases(validationResult.scenarios),
      helpers: await this.generateHelperFunctions(validationResult.scenarios),
      config: await this.generateTestConfig(analysis.framework)
    };

    return testSuite;
  }

  async generatePageObjects(validatedRoutes) {
    const pageObjects = [];
    
    for (const route of validatedRoutes.filter(r => r.valid)) {
      const pageObject = await this.generateSinglePageObject(route);
      pageObjects.push(pageObject);
    }
    
    return pageObjects;
  }

  async generateSinglePageObject(route) {
    const className = this.generateClassName(route.path);
    const template = await fs.readFile(path.join(__dirname, '../templates/page-object.js'), 'utf-8');
    
    // Generate selectors object
    const selectorsObj = route.selectors.map(selector => {
      const name = this.generateSelectorName(selector);
      return `${name}: '${selector}'`;
    }).join(',\n      ');
    
    // Generate methods based on selectors
    const methods = await this.generatePageObjectMethods(route.selectors);
    
    return {
      className,
      filePath: `pages/${className}.js`,
      content: template
        .replace(/{{PageName}}/g, className)
        .replace(/{{pageUrl}}/g, route.path)
        .replace(/{{selectors}}/g, selectorsObj)
        .replace(/{{methods}}/g, methods)
    };
  }

  async generatePageObjectMethods(selectors) {
    const methods = [];
    
    for (const selector of selectors) {
      const name = this.generateSelectorName(selector);
      
      if (selector.includes('input')) {
        methods.push(`
  async fill${this.capitalize(name)}(value) {
    await this.fillInput('${selector}', value);
  }

  async get${this.capitalize(name)}Value() {
    return await this.page.inputValue('${selector}');
  }`);
      } else if (selector.includes('button') || selector.includes('btn')) {
        methods.push(`
  async click${this.capitalize(name)}() {
    await this.clickElement('${selector}');
  }`);
      } else {
        methods.push(`
  async get${this.capitalize(name)}Text() {
    return await this.getText('${selector}');
  }

  async is${this.capitalize(name)}Visible() {
    return await this.isElementVisible('${selector}');
  }`);
      }
    }
    
    return methods.join('\n');
  }

  async generateTestCases(scenarios) {
    const testCases = [];
    
    for (const scenario of scenarios) {
      const testCase = await this.generateSingleTestCase(scenario);
      testCases.push(testCase);
    }
    
    return testCases;
  }

  async generateSingleTestCase(scenario) {
    const steps = scenario.steps.map(step => this.generateTestStep(step)).join('\n    ');
    
    return {
      name: scenario.name,
      content: `
  test('${scenario.name}', async () => {
    ${steps}
  });`
    };
  }

  generateTestStep(step) {
    switch (step.action) {
      case 'navigate':
        return `await page.goto('${step.url}');`;
      case 'waitForSelector':
        return `await waitForElement(page, '${step.selector}');`;
      case 'type':
        return `await page.fill('${step.selector}', '${step.value}');`;
      case 'click':
        return `await page.click('${step.selector}');`;
      case 'waitForNavigation':
        return `await page.waitForURL('${step.expectedUrl}');`;
      case 'screenshot':
        return `await page.screenshot({ path: 'screenshots/${step.name}.png' });`;
      case 'assert':
        return `await expect(page.locator('${step.selector}')).${step.assertion};`;
      default:
        return `// Unknown action: ${step.action}`;
    }
  }

  async generateHelperFunctions(scenarios) {
    const helpers = [];
    
    // Generate common helper functions based on scenarios
    const hasLogin = scenarios.some(s => s.name.toLowerCase().includes('login'));
    const hasForm = scenarios.some(s => s.steps.some(step => step.action === 'type'));
    
    if (hasLogin) {
      helpers.push(`
async function login(page, username, password) {
  await page.fill('input[name="username"], input[type="email"], #username', username);
  await page.fill('input[name="password"], input[type="password"], #password', password);
  await page.click('button[type="submit"], .login-btn, .btn-login');
  await page.waitForURL('**/dashboard');
}`);
    }
    
    if (hasForm) {
      helpers.push(`
async function submitForm(page, formData) {
  for (const [selector, value] of Object.entries(formData)) {
    await page.fill(selector, value);
  }
  await page.click('button[type="submit"], .submit-btn');
}`);
    }
    
    return helpers.join('\n');
  }

  async generateTestConfig(framework) {
    return {
      'playwright.config.js': `
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run ${framework === 'react' ? 'start' : 'dev'}',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`,
      'package.json': `
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
`
    };
  }

  generateClassName(path) {
    return path.split('/').pop()
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, str => str.toUpperCase()) + 'Page';
  }

  generateSelectorName(selector) {
    return selector.replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, str => str.toLowerCase());
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async saveTestSuite(testSuite, outputPath) {
    const outputDir = path.join(outputPath, 'generated-tests');
    await fs.ensureDir(outputDir);
    
    // Save page objects
    const pagesDir = path.join(outputDir, 'pages');
    await fs.ensureDir(pagesDir);
    
    for (const pageObject of testSuite.pageObjects) {
      const filePath = path.join(pagesDir, `${pageObject.className}.js`);
      await fs.writeFile(filePath, pageObject.content);
    }
    
    // Save test cases
    const testsDir = path.join(outputDir, 'tests');
    await fs.ensureDir(testsDir);
    
    const testSuiteTemplate = await fs.readFile(path.join(__dirname, '../templates/test-suite.js'), 'utf-8');
    const imports = testSuite.pageObjects.map(po => `const ${po.className} = require('../pages/${po.className}');`).join('\n');
    const pageObjectDeclarations = testSuite.pageObjects.map(po => `let ${po.className.toLowerCase()};`).join('\n  ');
    const pageObjectInitializations = testSuite.pageObjects.map(po => `${po.className.toLowerCase()} = new ${po.className}(page);`).join('\n    ');
    const testCases = testSuite.testCases.map(tc => tc.content).join('\n');
    
    const testSuiteContent = testSuiteTemplate
      .replace(/{{testSuiteName}}/g, 'Generated UI Tests')
      .replace(/{{imports}}/g, imports)
      .replace(/{{pageObjects}}/g, pageObjectDeclarations)
      .replace(/{{pageObjectInitializations}}/g, pageObjectInitializations)
      .replace(/{{testCases}}/g, testCases);
    
    await fs.writeFile(path.join(testsDir, 'ui-tests.spec.js'), testSuiteContent);
    
    // Save helper functions
    if (testSuite.helpers.length > 0) {
      const helpersDir = path.join(outputDir, 'helpers');
      await fs.ensureDir(helpersDir);
      await fs.writeFile(path.join(helpersDir, 'common.js'), testSuite.helpers.join('\n'));
    }
    
    // Save config files
    for (const [fileName, content] of Object.entries(testSuite.config)) {
      await fs.writeFile(path.join(outputDir, fileName), content);
    }
    
    return outputDir;
  }
}

module.exports = CodeGenerator;