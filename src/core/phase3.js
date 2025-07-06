const { generateText } = require('ai');
const { configureLLMProvider } = require('../config/llm');
const CodeGenerator = require('../tools/code-generator');
const chalk = require('chalk');
const ora = require('ora');

class Phase3Generator {
  constructor() {
    this.llmConfig = configureLLMProvider();
    this.codeGenerator = new CodeGenerator();
  }

  async generateTestCode(validationResult, analysis, userRequirement = '', outputPath = './') {
    const spinner = ora('Generating test code...').start();
    
    try {
      spinner.text = 'Generating Page Object Models...';
      
      // Generate the complete test suite
      const testSuite = await this.codeGenerator.generateTestSuite(
        validationResult,
        analysis,
        userRequirement
      );
      
      spinner.text = 'Optimizing test code with AI...';
      
      // Optimize the test suite with AI
      const optimizedTestSuite = await this.optimizeTestSuite(testSuite, userRequirement);
      
      spinner.text = 'Saving test files...';
      
      // Save the test suite to files
      const savedPath = await this.codeGenerator.saveTestSuite(optimizedTestSuite, outputPath);
      
      spinner.succeed('Test code generation completed');
      
      return {
        testSuite: optimizedTestSuite,
        outputPath: savedPath,
        summary: this.generateCodeSummary(optimizedTestSuite)
      };
    } catch (error) {
      spinner.fail('Test code generation failed');
      throw error;
    }
  }

  async optimizeTestSuite(testSuite, userRequirement) {
    const optimizedTestSuite = { ...testSuite };
    
    // Optimize page objects
    optimizedTestSuite.pageObjects = await this.optimizePageObjects(testSuite.pageObjects, userRequirement);
    
    // Optimize test cases
    optimizedTestSuite.testCases = await this.optimizeTestCases(testSuite.testCases, userRequirement);
    
    return optimizedTestSuite;
  }

  async optimizePageObjects(pageObjects, userRequirement) {
    const optimizedPageObjects = [];
    
    for (const pageObject of pageObjects) {
      const optimized = await this.optimizeSinglePageObject(pageObject, userRequirement);
      optimizedPageObjects.push(optimized);
    }
    
    return optimizedPageObjects;
  }

  async optimizeSinglePageObject(pageObject, userRequirement) {
    const prompt = `
Optimize this Page Object Model for better maintainability and reliability:

Current Page Object:
${pageObject.content}

User Requirements: ${userRequirement || 'Robust and maintainable test code'}

Please improve the code by:
1. Adding better error handling
2. Improving selector strategies
3. Adding meaningful comments
4. Implementing retry mechanisms
5. Adding validation methods
6. Following best practices

Return the optimized code:
`;

    try {
      const response = await generateText({
        model: this.llmConfig.openai(this.llmConfig.quickModel),
        prompt
      });

      return {
        ...pageObject,
        content: response.text.includes('class') ? response.text : pageObject.content
      };
    } catch (error) {
      console.warn(chalk.yellow(`Failed to optimize page object ${pageObject.className}:`, error.message));
      return pageObject;
    }
  }

  async optimizeTestCases(testCases, userRequirement) {
    const optimizedTestCases = [];
    
    for (const testCase of testCases) {
      const optimized = await this.optimizeSingleTestCase(testCase, userRequirement);
      optimizedTestCases.push(optimized);
    }
    
    return optimizedTestCases;
  }

  async optimizeSingleTestCase(testCase, userRequirement) {
    const prompt = `
Optimize this test case for better reliability and coverage:

Current Test Case:
${testCase.content}

User Requirements: ${userRequirement || 'Comprehensive and reliable testing'}

Please improve the test by:
1. Adding proper assertions
2. Implementing error handling
3. Adding setup and teardown steps
4. Including edge case testing
5. Adding meaningful test descriptions
6. Implementing proper wait strategies

Return the optimized test case:
`;

    try {
      const response = await generateText({
        model: this.llmConfig.openai(this.llmConfig.quickModel),
        prompt
      });

      return {
        ...testCase,
        content: response.text.includes('test(') ? response.text : testCase.content
      };
    } catch (error) {
      console.warn(chalk.yellow(`Failed to optimize test case ${testCase.name}:`, error.message));
      return testCase;
    }
  }

  generateCodeSummary(testSuite) {
    return {
      pageObjects: testSuite.pageObjects.length,
      testCases: testSuite.testCases.length,
      helpers: testSuite.helpers.length,
      configFiles: Object.keys(testSuite.config).length,
      totalFiles: testSuite.pageObjects.length + testSuite.testCases.length + testSuite.helpers.length + Object.keys(testSuite.config).length
    };
  }

  async generateCodeReport(generationResult) {
    console.log(chalk.blue('\n=== Test Code Generation Report ==='));
    console.log(chalk.cyan(`Output Path: ${generationResult.outputPath}`));
    console.log(chalk.cyan(`Page Objects: ${generationResult.summary.pageObjects}`));
    console.log(chalk.cyan(`Test Cases: ${generationResult.summary.testCases}`));
    console.log(chalk.cyan(`Helper Functions: ${generationResult.summary.helpers}`));
    console.log(chalk.cyan(`Config Files: ${generationResult.summary.configFiles}`));
    console.log(chalk.cyan(`Total Files Generated: ${generationResult.summary.totalFiles}`));
    
    console.log(chalk.yellow('\nGenerated Files:'));
    console.log('📁 generated-tests/');
    console.log('  ├── 📁 pages/');
    generationResult.testSuite.pageObjects.forEach(po => {
      console.log(`  │   └── ${po.className}.js`);
    });
    console.log('  ├── 📁 tests/');
    console.log('  │   └── ui-tests.spec.js');
    if (generationResult.testSuite.helpers.length > 0) {
      console.log('  ├── 📁 helpers/');
      console.log('  │   └── common.js');
    }
    console.log('  ├── playwright.config.js');
    console.log('  └── package.json');
    
    console.log(chalk.green('\n✅ Ready to run tests with: npm test'));
    
    return generationResult;
  }
}

module.exports = Phase3Generator;