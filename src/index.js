#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
require('dotenv').config();

const UITestGenerator = require('./UITestGenerator');

// CLI Configuration
program
  .name('ui-test-generator')
  .description('AI Agent for Puppeteer UI Test Generation')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Generation mode (full, quick, analyze, validate)', 'full')
  .option('-p, --project <path>', 'Path to frontend project', process.cwd())
  .option('-u, --url <url>', 'Target URL for testing', process.env.TARGET_URL || 'http://localhost:3000')
  .option('-r, --requirement <text>', 'User requirement description')
  .option('-i, --iterations <number>', 'Max validation iterations', parseInt, 3)
  .option('-o, --output <path>', 'Output directory', process.env.TEST_OUTPUT_DIR || './generated-tests')
  .action(async (options) => {
    try {
      if (!options.requirement) {
        console.error(chalk.red('Error: User requirement is required'));
        console.log(chalk.yellow('\nExample usage:'));
        console.log(chalk.gray('  node src/index.js --requirement "Test login and dashboard flow"'));
        console.log(chalk.gray('  node src/index.js --mode quick --requirement "Test user registration"'));
        process.exit(1);
      }

      const generator = new UITestGenerator();
      
      const config = {
        mode: options.mode,
        projectPath: path.resolve(options.project),
        userRequirement: options.requirement,
        targetUrl: options.url,
        maxIterations: options.iterations,
        testOutputDir: path.resolve(options.output)
      };

      const results = await generator.run(config);

      // Display summary
      displayResults(results, config);

    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Add examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue.bold('\n📚 Usage Examples:\n'));
    
    console.log(chalk.yellow('Full generation process:'));
    console.log(chalk.gray('  node src/index.js --requirement "Test login and dashboard flow" --url http://localhost:3000\n'));
    
    console.log(chalk.yellow('Quick generation without validation:'));
    console.log(chalk.gray('  node src/index.js --mode quick --requirement "Test user registration"\n'));
    
    console.log(chalk.yellow('Analyze codebase only:'));
    console.log(chalk.gray('  node src/index.js --mode analyze --requirement "Analyze routes and components"\n'));
    
    console.log(chalk.yellow('Custom project path:'));
    console.log(chalk.gray('  node src/index.js --project /path/to/your/frontend --requirement "Test e-commerce flow"\n'));
  });

function displayResults(results, config) {
  console.log(chalk.blue.bold('\n📊 Generation Summary:\n'));

  if (results.phase1) {
    console.log(chalk.green('✓ Phase 1: Code Analysis & Test Planning'));
    console.log(chalk.gray(`  - Framework: ${results.phase1.codebaseAnalysis?.framework || 'detected'}`));
    console.log(chalk.gray(`  - Test Scenarios: ${results.phase1.testScenarios?.length || 0}`));
  }

  if (results.phase2) {
    console.log(chalk.green('✓ Phase 2: Test Validation & Refinement'));
    const validation = results.phase2.validationResults;
    if (validation) {
      console.log(chalk.gray(`  - Validated: ${validation.validated}/${validation.total} scenarios`));
      console.log(chalk.gray(`  - Success Rate: ${validation.successRate.toFixed(1)}%`));
    }
  }

  if (results.phase3) {
    console.log(chalk.green('✓ Phase 3: Test Code Generation'));
    console.log(chalk.gray(`  - Test Files: ${results.phase3.testFiles?.length || 0}`));
    console.log(chalk.gray(`  - Support Files: ${results.phase3.supportFiles?.length || 0}`));
    console.log(chalk.gray(`  - Output Directory: ${config.testOutputDir}`));
  }

  console.log(chalk.blue.bold('\n🎉 Next Steps:\n'));
  console.log(chalk.yellow('1. Navigate to the generated tests:'));
  console.log(chalk.gray(`   cd ${config.testOutputDir}\n`));
  
  console.log(chalk.yellow('2. Install test dependencies:'));
  console.log(chalk.gray('   npm install puppeteer jest\n'));
  
  console.log(chalk.yellow('3. Run the tests:'));
  console.log(chalk.gray('   npm test\n'));
}

// Export for programmatic use
module.exports = { UITestGenerator };

// Run CLI if called directly
if (require.main === module) {
  program.parse(process.argv);
}