import { configureLLMProvider } from '../utils/llm-provider.js';
import { PhaseOne } from '../phases/phase-one.js';
import { PhaseTwo } from '../phases/phase-two.js';
import { PhaseThree } from '../phases/phase-three.js';
import fs from 'fs-extra';
import path from 'path';

export class TestAgent {
  constructor() {
    this.llmProvider = configureLLMProvider();
    if (!this.llmProvider) {
      throw new Error('No LLM provider configured. Please set up API keys in .env file.');
    }
    
    this.phaseOne = new PhaseOne(this.llmProvider);
    this.phaseTwo = new PhaseTwo(this.llmProvider);
    this.phaseThree = new PhaseThree(this.llmProvider);
    
    console.log(`🤖 Test Agent initialized with ${this.llmProvider.providerName} provider`);
  }

  async generateTests(config) {
    const {
      userInput,
      projectPath,
      baseUrl,
      outputPath = './generated-tests'
    } = config;

    const results = {
      phases: {},
      success: false,
      error: null,
      executionTime: Date.now()
    };

    try {
      console.log('🚀 Starting AI Test Agent execution...');
      console.log(`📝 User Input: ${userInput}`);
      console.log(`📁 Project Path: ${projectPath}`);
      console.log(`🌐 Base URL: ${baseUrl}`);
      console.log(`📤 Output Path: ${outputPath}`);

      // Ensure output directory exists
      await fs.ensureDir(outputPath);
      await fs.ensureDir(path.join(outputPath, 'screenshots'));

      // Phase 1: Code Analysis and Tool Generation
      console.log('\n=== PHASE 1: CODE ANALYSIS ===');
      const phaseOneResult = await this.phaseOne.execute(userInput, projectPath);
      results.phases.phaseOne = phaseOneResult;

      if (!phaseOneResult.success) {
        throw new Error(`Phase One failed: ${phaseOneResult.error}`);
      }

      console.log('✅ Phase One completed successfully');
      console.log(`   - Framework detected: ${phaseOneResult.analysis.analysis?.framework || 'unknown'}`);
      console.log(`   - Test scenarios: ${phaseOneResult.analysis.testPlan?.testScenarios?.length || 0}`);

      // Phase 2: Browser Verification and Test Case Refinement
      console.log('\n=== PHASE 2: BROWSER VERIFICATION ===');
      const phaseTwoResult = await this.phaseTwo.execute(phaseOneResult, baseUrl);
      results.phases.phaseTwo = phaseTwoResult;

      if (!phaseTwoResult.success) {
        console.warn(`Phase Two had issues: ${phaseTwoResult.error}`);
        // Continue with Phase Three even if Phase Two has issues
      } else {
        console.log('✅ Phase Two completed successfully');
        console.log(`   - Scenarios verified: ${phaseTwoResult.validatedScenarios?.length || 0}`);
        console.log(`   - Refined test cases: ${phaseTwoResult.refinedTestCases?.refinedTestCases?.length || 0}`);
      }

      // Phase 3: Puppeteer Code Generation
      console.log('\n=== PHASE 3: CODE GENERATION ===');
      const phaseThreeResult = await this.phaseThree.execute(phaseTwoResult, outputPath);
      results.phases.phaseThree = phaseThreeResult;

      if (!phaseThreeResult.success) {
        throw new Error(`Phase Three failed: ${phaseThreeResult.error}`);
      }

      console.log('✅ Phase Three completed successfully');
      console.log(`   - Test files generated: ${phaseThreeResult.generatedTests}`);
      console.log(`   - Output location: ${phaseThreeResult.outputPath}`);

      // Generate execution summary
      const summary = this.generateExecutionSummary(results);
      await fs.writeFile(
        path.join(outputPath, 'execution-summary.json'),
        JSON.stringify(summary, null, 2)
      );

      results.success = true;
      results.executionTime = Date.now() - results.executionTime;

      console.log('\n🎉 AI Test Agent execution completed successfully!');
      console.log(`⏱️  Total execution time: ${results.executionTime}ms`);
      console.log(`📁 Generated files in: ${outputPath}`);

      return results;

    } catch (error) {
      results.error = error.message;
      results.executionTime = Date.now() - results.executionTime;
      
      console.error('\n❌ AI Test Agent execution failed:', error.message);
      
      // Save error results for debugging
      try {
        await fs.writeFile(
          path.join(outputPath, 'error-report.json'),
          JSON.stringify(results, null, 2)
        );
      } catch (writeError) {
        console.error('Failed to write error report:', writeError.message);
      }

      return results;
    }
  }

  generateExecutionSummary(results) {
    const summary = {
      timestamp: new Date().toISOString(),
      success: results.success,
      executionTime: results.executionTime,
      phases: {
        phaseOne: {
          success: results.phases.phaseOne?.success || false,
          framework: results.phases.phaseOne?.analysis?.analysis?.framework,
          routeFiles: results.phases.phaseOne?.projectAnalysis?.routeFiles?.length,
          testScenarios: results.phases.phaseOne?.analysis?.testPlan?.testScenarios?.length
        },
        phaseTwo: {
          success: results.phases.phaseTwo?.success || false,
          validatedScenarios: results.phases.phaseTwo?.validatedScenarios?.length,
          refinedTestCases: results.phases.phaseTwo?.refinedTestCases?.refinedTestCases?.length
        },
        phaseThree: {
          success: results.phases.phaseThree?.success || false,
          generatedTests: results.phases.phaseThree?.generatedTests,
          outputPath: results.phases.phaseThree?.outputPath
        }
      },
      error: results.error
    };

    return summary;
  }

  async validateConfiguration(config) {
    const errors = [];

    if (!config.userInput || config.userInput.trim() === '') {
      errors.push('User input is required');
    }

    if (!config.projectPath) {
      errors.push('Project path is required');
    } else if (!await fs.pathExists(config.projectPath)) {
      errors.push('Project path does not exist');
    }

    if (!config.baseUrl) {
      errors.push('Base URL is required');
    } else if (!config.baseUrl.match(/^https?:\/\//)) {
      errors.push('Base URL must be a valid HTTP/HTTPS URL');
    }

    return errors;
  }
}