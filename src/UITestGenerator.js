const chalk = require('chalk');
const ora = require('ora');
const path = require('path');

const LLMFactory = require('./llm/LLMFactory');
const ToolRegistry = require('./tools/ToolRegistry');
const Phase1 = require('./phases/Phase1');
const Phase2 = require('./phases/Phase2');
const Phase3 = require('./phases/Phase3');

class UITestGenerator {
  constructor() {
    this.llm = null;
    this.toolRegistry = null;
  }

  async initialize() {
    console.log(chalk.blue.bold('\n🤖 AI Agent for Puppeteer UI Test Generation\n'));
    
    // Initialize LLM
    try {
      this.llm = LLMFactory.create();
    } catch (error) {
      console.error(chalk.red('Failed to initialize LLM:'), error.message);
      throw error;
    }

    // Initialize tools
    this.toolRegistry = new ToolRegistry();
  }

  async run(config) {
    const startTime = Date.now();
    
    try {
      await this.initialize();

      const {
        mode = 'full',
        projectPath = process.cwd(),
        userRequirement,
        targetUrl = process.env.TARGET_URL || 'http://localhost:3000',
        maxIterations = 3,
        testOutputDir = process.env.TEST_OUTPUT_DIR || './generated-tests'
      } = config;

      if (!userRequirement) {
        throw new Error('User requirement is required');
      }

      console.log(chalk.green('Configuration:'));
      console.log(chalk.gray(`  Mode: ${mode}`));
      console.log(chalk.gray(`  Project Path: ${projectPath}`));
      console.log(chalk.gray(`  Target URL: ${targetUrl}`));
      console.log(chalk.gray(`  Output Directory: ${testOutputDir}`));
      console.log(chalk.gray(`  User Requirement: ${userRequirement}\n`));

      let results = {};

      // Execute phases based on mode
      switch (mode) {
        case 'full':
          results = await this.runFullGeneration(
            { projectPath, userRequirement, targetUrl, maxIterations, testOutputDir }
          );
          break;

        case 'quick':
          results = await this.runQuickGeneration(
            { projectPath, userRequirement, testOutputDir }
          );
          break;

        case 'analyze':
          results = await this.runAnalysisOnly(
            { projectPath, userRequirement }
          );
          break;

        case 'validate':
          results = await this.runValidationOnly(
            { projectPath, userRequirement, targetUrl, maxIterations }
          );
          break;

        default:
          throw new Error(`Unknown mode: ${mode}`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(chalk.green.bold(`\n✅ Generation completed in ${duration}s\n`));

      return results;
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Generation failed:'), error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async runFullGeneration(config) {
    // Phase 1: Analysis & Planning
    const phase1 = new Phase1(this.llm, this.toolRegistry);
    const phase1Results = await phase1.run(config);

    // Phase 2: Validation & Refinement
    const phase2 = new Phase2(this.llm, this.toolRegistry);
    const phase2Results = await phase2.run(config, phase1Results);

    // Phase 3: Code Generation
    const phase3 = new Phase3(this.llm, this.toolRegistry);
    const phase3Results = await phase3.run(config, phase2Results);

    return {
      phase1: phase1Results,
      phase2: phase2Results,
      phase3: phase3Results
    };
  }

  async runQuickGeneration(config) {
    // Skip validation phase
    const phase1 = new Phase1(this.llm, this.toolRegistry);
    const phase1Results = await phase1.run(config);

    const phase3 = new Phase3(this.llm, this.toolRegistry);
    const phase3Results = await phase3.run(config, {
      ...phase1Results,
      validatedScenarios: phase1Results.testScenarios
    });

    return {
      phase1: phase1Results,
      phase3: phase3Results
    };
  }

  async runAnalysisOnly(config) {
    const phase1 = new Phase1(this.llm, this.toolRegistry);
    const phase1Results = await phase1.run(config);

    return {
      phase1: phase1Results
    };
  }

  async runValidationOnly(config) {
    const phase1 = new Phase1(this.llm, this.toolRegistry);
    const phase1Results = await phase1.run(config);

    const phase2 = new Phase2(this.llm, this.toolRegistry);
    const phase2Results = await phase2.run(config, phase1Results);

    return {
      phase1: phase1Results,
      phase2: phase2Results
    };
  }

  async cleanup() {
    if (this.toolRegistry) {
      await this.toolRegistry.cleanup();
    }
  }
}

module.exports = UITestGenerator;