#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const Phase1Analyzer = require('./core/phase1');
const Phase2Validator = require('./core/phase2');
const Phase3Generator = require('./core/phase3');
const config = require('./config');

const program = new Command();

program
  .name('puppeteer-ui-test-agent')
  .description('AI Agent for automatic Puppeteer UI test generation')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate UI tests for a frontend project')
  .argument('<project-path>', 'Path to the frontend project')
  .option('-r, --requirement <requirement>', 'Specific testing requirements')
  .option('-o, --output <output>', 'Output directory for generated tests', './')
  .option('--skip-validation', 'Skip the validation phase (Phase 2)')
  .option('--phase <phase>', 'Run specific phase only (1, 2, or 3)')
  .action(async (projectPath, options) => {
    console.log(chalk.blue('🚀 Starting Puppeteer UI Test Agent'));
    console.log(chalk.gray(`Project Path: ${projectPath}`));
    console.log(chalk.gray(`Requirements: ${options.requirement || 'General UI testing'}`));
    
    try {
      let analysis, validationResult, generationResult;
      
      // Phase 1: Code Analysis
      if (!options.phase || options.phase === '1') {
        console.log(chalk.yellow('\n📊 Phase 1: Code Analysis'));
        const phase1 = new Phase1Analyzer();
        analysis = await phase1.analyzeProject(projectPath, options.requirement);
        await phase1.generateAnalysisReport(analysis);
        
        if (options.phase === '1') {
          console.log(chalk.green('✅ Phase 1 completed'));
          return;
        }
      }
      
      // Phase 2: Route Validation
      if (!options.skipValidation && (!options.phase || options.phase === '2')) {
        console.log(chalk.yellow('\n🔍 Phase 2: Route Validation'));
        const phase2 = new Phase2Validator();
        validationResult = await phase2.validateAndOptimize(projectPath, analysis, options.requirement);
        await phase2.generateValidationReport(validationResult);
        
        if (options.phase === '2') {
          console.log(chalk.green('✅ Phase 2 completed'));
          return;
        }
      }
      
      // Phase 3: Test Code Generation
      if (!options.phase || options.phase === '3') {
        console.log(chalk.yellow('\n⚙️  Phase 3: Test Code Generation'));
        const phase3 = new Phase3Generator();
        
        // If skipping validation, create a mock validation result
        if (options.skipValidation || !validationResult) {
          validationResult = {
            validatedRoutes: analysis.routes.map(route => ({
              ...route,
              valid: true,
              selectors: ['body', 'header', 'main', 'footer']
            })),
            scenarios: [
              {
                name: 'Basic Navigation Test',
                steps: [
                  { action: 'navigate', url: '/' },
                  { action: 'waitForSelector', selector: 'body' },
                  { action: 'screenshot', name: 'homepage' }
                ]
              }
            ]
          };
        }
        
        generationResult = await phase3.generateTestCode(
          validationResult,
          analysis,
          options.requirement,
          options.output
        );
        await phase3.generateCodeReport(generationResult);
      }
      
      console.log(chalk.green('\n🎉 All phases completed successfully!'));
      console.log(chalk.gray('You can now run the generated tests with:'));
      console.log(chalk.cyan('cd generated-tests && npm install && npm test'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:', error.message));
      if (process.env.NODE_ENV === 'development') {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Configure LLM provider settings')
  .option('--provider <provider>', 'LLM provider (deepseek, glm, openai)')
  .option('--api-key <key>', 'API key for the provider')
  .option('--model <model>', 'Model name to use')
  .action(async (options) => {
    console.log(chalk.blue('⚙️  Configuration'));
    
    if (options.provider && options.apiKey) {
      console.log(chalk.yellow('Setting up environment variables:'));
      
      const envVars = {
        deepseek: 'DEEPSEEK_TOKEN',
        glm: 'GLM_API_KEY',
        openai: 'OPENAI_API_KEY'
      };
      
      const envVar = envVars[options.provider];
      if (envVar) {
        console.log(chalk.cyan(`Set ${envVar}=${options.apiKey}`));
        if (options.model) {
          console.log(chalk.cyan(`Set ${options.provider.toUpperCase()}_MODEL=${options.model}`));
        }
      }
    } else {
      console.log(chalk.yellow('Available providers:'));
      console.log('  - deepseek (DEEPSEEK_TOKEN)');
      console.log('  - glm (GLM_API_KEY)');
      console.log('  - openai (OPENAI_API_KEY)');
    }
  });

program
  .command('test')
  .description('Test the AI Agent with current configuration')
  .action(async () => {
    console.log(chalk.blue('🧪 Testing AI Agent Configuration'));
    
    try {
      const { configureLLMProvider } = require('./config/llm');
      const llmConfig = configureLLMProvider();
      
      console.log(chalk.green(`✅ LLM Provider: ${llmConfig.providerName}`));
      console.log(chalk.green(`✅ Model: ${llmConfig.fullModel}`));
      
      // Test basic text generation
      const { generateText } = require('ai');
      const spinner = ora('Testing AI connection...').start();
      
      const response = await generateText({
        model: llmConfig.openai(llmConfig.quickModel),
        prompt: 'Say "Hello, this is a test from Puppeteer UI Test Agent!"'
      });
      
      spinner.succeed('AI connection test passed');
      console.log(chalk.cyan('Response:', response.text));
      
    } catch (error) {
      console.error(chalk.red('❌ Configuration test failed:', error.message));
      console.log(chalk.yellow('Please check your environment variables and API keys'));
    }
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:', error.message));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:', promise, 'reason:', reason));
  process.exit(1);
});

program.parse();