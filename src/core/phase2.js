const { generateText } = require('ai');
const { configureLLMProvider } = require('../config/llm');
const PuppeteerValidator = require('../tools/puppeteer-validator');
const chalk = require('chalk');
const ora = require('ora');

class Phase2Validator {
  constructor() {
    this.llmConfig = configureLLMProvider();
    this.puppeteerValidator = new PuppeteerValidator();
  }

  async validateAndOptimize(projectPath, analysis, userRequirement = '') {
    const spinner = ora('Initializing validation phase...').start();
    
    try {
      // Initialize Puppeteer
      await this.puppeteerValidator.initialize();
      
      // Start development server
      await this.puppeteerValidator.startDevServer(projectPath);
      
      spinner.text = 'Validating routes with Puppeteer...';
      
      // Validate routes
      const validatedRoutes = await this.puppeteerValidator.validateRoutes(analysis.routes);
      
      spinner.text = 'Generating test scenarios...';
      
      // Generate test scenarios
      const scenarios = await this.puppeteerValidator.generateTestScenarios(validatedRoutes, userRequirement);
      
      // Optimize scenarios with AI
      const optimizedScenarios = await this.optimizeScenarios(scenarios, userRequirement);
      
      spinner.succeed('Route validation completed');
      
      return {
        validatedRoutes,
        scenarios: optimizedScenarios,
        summary: this.generateValidationSummary(validatedRoutes, optimizedScenarios)
      };
    } catch (error) {
      spinner.fail('Validation failed');
      throw error;
    } finally {
      await this.puppeteerValidator.cleanup();
    }
  }

  async optimizeScenarios(scenarios, userRequirement) {
    const prompt = `
Based on the following test scenarios and user requirements, optimize and enhance the test scenarios:

Current Test Scenarios:
${JSON.stringify(scenarios, null, 2)}

User Requirements: ${userRequirement || 'Comprehensive UI testing'}

Please provide optimized scenarios that:
1. Include better selectors and actions
2. Add meaningful assertions
3. Cover edge cases and error scenarios
4. Improve test reliability
5. Add data-driven test cases where applicable

Return the optimized scenarios in the same JSON format.
`;

    try {
      const response = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        prompt
      });

      // Try to parse the AI response as JSON
      try {
        const optimizedScenarios = JSON.parse(response.text);
        return Array.isArray(optimizedScenarios) ? optimizedScenarios : scenarios;
      } catch (parseError) {
        console.warn(chalk.yellow('Failed to parse AI response, using original scenarios'));
        return scenarios;
      }
    } catch (error) {
      console.error(chalk.red('Failed to optimize scenarios with AI:'), error);
      return scenarios;
    }
  }

  generateValidationSummary(validatedRoutes, scenarios) {
    const validRoutes = validatedRoutes.filter(r => r.valid);
    const invalidRoutes = validatedRoutes.filter(r => !r.valid);
    
    return {
      totalRoutes: validatedRoutes.length,
      validRoutes: validRoutes.length,
      invalidRoutes: invalidRoutes.length,
      totalScenarios: scenarios.length,
      validatedScenarios: scenarios.filter(s => s.validated).length,
      coverage: validRoutes.length / validatedRoutes.length,
      failedRoutes: invalidRoutes.map(r => ({ path: r.path, error: r.error }))
    };
  }

  async generateValidationReport(validationResult) {
    console.log(chalk.blue('\n=== Route Validation Report ==='));
    console.log(chalk.cyan(`Total Routes: ${validationResult.summary.totalRoutes}`));
    console.log(chalk.green(`Valid Routes: ${validationResult.summary.validRoutes}`));
    console.log(chalk.red(`Invalid Routes: ${validationResult.summary.invalidRoutes}`));
    console.log(chalk.cyan(`Test Scenarios: ${validationResult.summary.totalScenarios}`));
    console.log(chalk.cyan(`Coverage: ${(validationResult.summary.coverage * 100).toFixed(1)}%`));
    
    if (validationResult.summary.failedRoutes.length > 0) {
      console.log(chalk.red('\nFailed Routes:'));
      validationResult.summary.failedRoutes.forEach(route => {
        console.log(`  - ${route.path}: ${route.error}`);
      });
    }
    
    console.log(chalk.yellow('\nGenerated Test Scenarios:'));
    validationResult.scenarios.forEach((scenario, index) => {
      console.log(`  ${index + 1}. ${scenario.name} (${scenario.steps.length} steps)`);
    });
    
    return validationResult;
  }
}

module.exports = Phase2Validator;