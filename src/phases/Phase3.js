const chalk = require('chalk');
const path = require('path');

class Phase3 {
  constructor(llm, toolRegistry) {
    this.llm = llm;
    this.toolRegistry = toolRegistry;
  }

  async run(config, phase2Results) {
    console.log(chalk.blue('\n=== Phase 3: Test Code Generation ===\n'));
    
    const { testOutputDir } = config;
    const { validatedScenarios, codebaseAnalysis } = phase2Results;
    
    // Generate test files
    const testFiles = await this.generateTestFiles(
      validatedScenarios,
      codebaseAnalysis,
      testOutputDir
    );
    
    // Generate supporting files
    const supportFiles = await this.generateSupportFiles(
      validatedScenarios,
      testOutputDir
    );
    
    // Generate documentation
    const documentation = await this.generateDocumentation(
      validatedScenarios,
      testFiles,
      testOutputDir
    );
    
    return {
      ...phase2Results,
      testFiles,
      supportFiles,
      documentation,
      outputDirectory: testOutputDir
    };
  }

  async generateTestFiles(scenarios, codebaseAnalysis, outputDir) {
    console.log(chalk.yellow('Generating test files...'));
    
    const testFiles = [];
    
    // Generate main test suite
    const mainTestFile = await this.generateMainTestSuite(scenarios, codebaseAnalysis);
    testFiles.push({
      path: path.join(outputDir, 'ui-tests.test.js'),
      content: mainTestFile
    });
    
    // Generate page objects
    const pageObjects = await this.generatePageObjects(scenarios);
    for (const [pageName, content] of Object.entries(pageObjects)) {
      testFiles.push({
        path: path.join(outputDir, 'page-objects', `${pageName}.js`),
        content
      });
    }
    
    // Write files
    for (const file of testFiles) {
      await this.toolRegistry.execute('file_system', {
        action: 'write',
        path: file.path,
        content: file.content
      });
    }
    
    return testFiles;
  }

  async generateMainTestSuite(scenarios, codebaseAnalysis) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert test automation engineer. Generate production-ready Puppeteer test code with Jest.
Follow these guidelines:
- Use async/await syntax
- Include proper error handling
- Use page object pattern
- Add meaningful assertions
- Include setup and teardown
- Use descriptive test names
- Add helpful comments`
      },
      {
        role: 'user',
        content: `Generate a complete Puppeteer test suite for these scenarios:

${JSON.stringify(scenarios, null, 2)}

Framework: ${codebaseAnalysis.framework || 'generic'}

Requirements:
1. Use Jest as the test runner
2. Include beforeAll/afterAll hooks
3. Use page objects for maintainability
4. Add proper waits and timeouts
5. Include error screenshots on failure
6. Use the validated selectors provided`
      }
    ];

    const response = await this.llm.chat(messages);
    return this.formatTestCode(response.content);
  }

  async generatePageObjects(scenarios) {
    const pageObjects = {};
    const pageGroups = this.groupScenariosByPage(scenarios);
    
    for (const [pageName, pageScenarios] of Object.entries(pageGroups)) {
      const messages = [
        {
          role: 'system',
          content: `You are an expert test automation engineer. Generate a Page Object Model class for Puppeteer.`
        },
        {
          role: 'user',
          content: `Generate a Page Object class for "${pageName}" with these scenarios:

${JSON.stringify(pageScenarios, null, 2)}

Include:
1. Constructor with page instance
2. Selectors as static properties
3. Methods for common actions
4. Methods for assertions
5. Proper error handling
6. JSDoc comments`
        }
      ];

      const response = await this.llm.chat(messages);
      pageObjects[pageName] = this.formatTestCode(response.content);
    }
    
    return pageObjects;
  }

  async generateSupportFiles(scenarios, outputDir) {
    const supportFiles = [];
    
    // Generate test helpers
    const helpers = await this.generateTestHelpers();
    supportFiles.push({
      path: path.join(outputDir, 'test-helpers.js'),
      content: helpers
    });
    
    // Generate Jest config
    const jestConfig = this.generateJestConfig();
    supportFiles.push({
      path: path.join(outputDir, 'jest.config.js'),
      content: jestConfig
    });
    
    // Generate test data
    const testData = this.extractTestData(scenarios);
    supportFiles.push({
      path: path.join(outputDir, 'test-data.json'),
      content: JSON.stringify(testData, null, 2)
    });
    
    // Write files
    for (const file of supportFiles) {
      await this.toolRegistry.execute('file_system', {
        action: 'write',
        path: file.path,
        content: file.content
      });
    }
    
    return supportFiles;
  }

  async generateTestHelpers() {
    return `const fs = require('fs').promises;
const path = require('path');

class TestHelpers {
  static async takeScreenshot(page, name) {
    const screenshotDir = path.join(__dirname, 'screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });
    
    const filename = \`\${name}-\${Date.now()}.png\`;
    const filepath = path.join(screenshotDir, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(\`Screenshot saved: \${filepath}\`);
    return filepath;
  }

  static async waitForElement(page, selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.error(\`Element not found: \${selector}\`);
      return false;
    }
  }

  static async clickAndWait(page, selector, waitSelector = null, timeout = 5000) {
    await page.click(selector);
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout });
    }
  }

  static async typeText(page, selector, text, options = {}) {
    const element = await page.$(selector);
    if (element) {
      await element.click({ clickCount: 3 }); // Select all
      await element.type(text, options);
    } else {
      throw new Error(\`Element not found: \${selector}\`);
    }
  }

  static async getElementText(page, selector) {
    const element = await page.$(selector);
    if (element) {
      return await page.evaluate(el => el.textContent, element);
    }
    return null;
  }

  static async elementExists(page, selector) {
    const element = await page.$(selector);
    return element !== null;
  }

  static async waitForNavigation(page, options = {}) {
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      ...options
    });
  }
}

module.exports = TestHelpers;`;
  }

  generateJestConfig() {
    return `module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'UI Test Report',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ]
};`;
  }

  async generateDocumentation(scenarios, testFiles, outputDir) {
    const messages = [
      {
        role: 'system',
        content: `You are a technical writer. Create comprehensive documentation for the generated tests.`
      },
      {
        role: 'user',
        content: `Create a README.md for these generated tests:

Scenarios: ${scenarios.map(s => s.name).join(', ')}
Test Files: ${testFiles.map(f => path.basename(f.path)).join(', ')}

Include:
1. Overview
2. Prerequisites
3. Installation instructions
4. Running tests
5. Test structure
6. Scenario descriptions
7. Troubleshooting
8. Maintenance tips`
      }
    ];

    const response = await this.llm.chat(messages);
    const readmePath = path.join(outputDir, 'README.md');
    
    await this.toolRegistry.execute('file_system', {
      action: 'write',
      path: readmePath,
      content: response.content
    });

    return {
      path: readmePath,
      content: response.content
    };
  }

  groupScenariosByPage(scenarios) {
    const groups = {};
    
    for (const scenario of scenarios) {
      // Extract page name from scenario name or steps
      const pageName = this.extractPageName(scenario);
      if (!groups[pageName]) {
        groups[pageName] = [];
      }
      groups[pageName].push(scenario);
    }
    
    return groups;
  }

  extractPageName(scenario) {
    // Simple extraction logic - can be improved
    const name = scenario.name.toLowerCase();
    
    if (name.includes('login') || name.includes('auth')) return 'LoginPage';
    if (name.includes('dashboard')) return 'DashboardPage';
    if (name.includes('profile')) return 'ProfilePage';
    if (name.includes('product')) return 'ProductPage';
    if (name.includes('cart')) return 'CartPage';
    if (name.includes('checkout')) return 'CheckoutPage';
    
    return 'GenericPage';
  }

  extractTestData(scenarios) {
    const testData = {
      users: [
        {
          username: 'testuser@example.com',
          password: 'Test123!',
          role: 'user'
        },
        {
          username: 'admin@example.com',
          password: 'Admin123!',
          role: 'admin'
        }
      ],
      products: [],
      urls: {}
    };

    // Extract test data from scenarios
    for (const scenario of scenarios) {
      if (scenario.testData) {
        Object.assign(testData, scenario.testData);
      }
    }

    return testData;
  }

  formatTestCode(content) {
    // Extract code blocks if wrapped in markdown
    const codeMatch = content.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    // Return as-is if already clean code
    return content.trim();
  }
}

module.exports = Phase3;