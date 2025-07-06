const { generateText } = require('ai');
const { configureLLMProvider } = require('../config/llm');
const FileAnalyzer = require('../tools/file-analyzer');
const chalk = require('chalk');
const ora = require('ora');

class Phase1Analyzer {
  constructor() {
    this.llmConfig = configureLLMProvider();
    this.fileAnalyzer = new FileAnalyzer();
  }

  async analyzeProject(projectPath, userRequirement = '') {
    const spinner = ora('Analyzing project structure...').start();
    
    try {
      const analysis = {
        framework: await this.fileAnalyzer.detectFramework(projectPath),
        routes: await this.fileAnalyzer.analyzeRoutes(projectPath),
        components: await this.fileAnalyzer.extractComponents(projectPath),
        files: await this.fileAnalyzer.listFiles(projectPath),
        testStrategy: ''
      };

      spinner.text = 'Generating test strategy with AI...';
      
      const testStrategy = await this.generateTestStrategy(analysis, userRequirement);
      analysis.testStrategy = testStrategy;

      spinner.succeed('Project analysis completed');
      
      return analysis;
    } catch (error) {
      spinner.fail('Project analysis failed');
      throw error;
    }
  }

  async generateTestStrategy(analysis, userRequirement) {
    const prompt = `
Based on the following frontend project analysis, generate a comprehensive test strategy:

Project Details:
- Framework: ${analysis.framework}
- Routes: ${JSON.stringify(analysis.routes, null, 2)}
- Components: ${JSON.stringify(analysis.components, null, 2)}
- Total Files: ${analysis.files.length}

User Requirements: ${userRequirement || 'General UI testing coverage'}

Please provide a test strategy that includes:
1. Priority routes to test (based on business logic)
2. Key user flows to validate
3. Critical components that need testing
4. Recommended test scenarios

Format your response as a clear, actionable test strategy.
`;

    try {
      const response = await generateText({
        model: this.llmConfig.openai(this.llmConfig.fullModel),
        prompt
      });

      return response.text;
    } catch (error) {
      console.error(chalk.red('Failed to generate test strategy:'), error);
      return 'Basic test strategy: Test main routes and key user interactions';
    }
  }

  async generateAnalysisReport(analysis) {
    console.log(chalk.blue('\n=== Project Analysis Report ==='));
    console.log(chalk.cyan(`Framework: ${analysis.framework}`));
    console.log(chalk.cyan(`Total Files: ${analysis.files.length}`));
    console.log(chalk.cyan(`Routes Found: ${analysis.routes.length}`));
    console.log(chalk.cyan(`Components Found: ${analysis.components.length}`));
    
    console.log(chalk.yellow('\nRoutes:'));
    analysis.routes.forEach(route => {
      console.log(`  - ${route.path} (${route.component}) ${route.requiresAuth ? '[Auth Required]' : ''}`);
    });

    console.log(chalk.yellow('\nComponents:'));
    analysis.components.forEach(component => {
      console.log(`  - ${component.name} (${component.selectors.length} selectors)`);
    });

    console.log(chalk.yellow('\nTest Strategy:'));
    console.log(analysis.testStrategy);
    
    return analysis;
  }
}

module.exports = Phase1Analyzer;