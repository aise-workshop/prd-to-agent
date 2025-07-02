const Phase1Analysis = require('./phases/phase1-analysis');
const Phase2Validation = require('./phases/phase2-validation');
const Phase3Generation = require('./phases/phase3-generation');
const { configureLLMProvider } = require('./config/llm-provider');
require('dotenv').config();

/**
 * AI Agent for Puppeteer UI Test Generation
 * 三阶段架构：工具调用 -> 测试用例生成与浏览器验证 -> 代码生成
 */
class PuppeteerTestAgent {
  constructor() {
    this.phase1 = new Phase1Analysis();
    this.phase2 = new Phase2Validation();
    this.phase3 = new Phase3Generation();
  }

  /**
   * 执行完整的测试生成流程
   */
  async generateTests(userInput, projectPath, frontendUrl = null) {
    console.log('🚀 Starting Puppeteer Test Generation Agent...');
    console.log(`📝 User Input: ${userInput}`);
    console.log(`📁 Project Path: ${projectPath}`);
    console.log(`🌐 Frontend URL: ${frontendUrl}`);
    
    try {
      // 验证 LLM 提供商配置
      const provider = configureLLMProvider();
      console.log(`🤖 Using LLM Provider: ${provider.providerName}`);
      
      const results = {
        startTime: new Date().toISOString(),
        userInput,
        projectPath,
        frontendUrl,
        provider: provider.providerName
      };

      // 阶段一：代码分析和工具调用
      console.log('\n' + '='.repeat(60));
      console.log('🔍 PHASE 1: CODE ANALYSIS AND TOOL CALLING');
      console.log('='.repeat(60));
      
      const phase1Results = await this.phase1.execute(userInput, projectPath);
      results.phase1 = phase1Results;
      
      if (!phase1Results.success) {
        throw new Error(`Phase 1 failed: ${phase1Results.error}`);
      }
      
      console.log('✅ Phase 1 completed successfully');
      this.printPhase1Summary(phase1Results);

      // 阶段二：测试用例生成和浏览器验证
      console.log('\n' + '='.repeat(60));
      console.log('🧪 PHASE 2: TEST CASE GENERATION AND BROWSER VALIDATION');
      console.log('='.repeat(60));
      
      const phase2Results = await this.phase2.execute(phase1Results, frontendUrl);
      results.phase2 = phase2Results;
      
      if (!phase2Results.success) {
        throw new Error(`Phase 2 failed: ${phase2Results.error}`);
      }
      
      console.log('✅ Phase 2 completed successfully');
      this.printPhase2Summary(phase2Results);

      // 阶段三：Puppeteer 代码生成
      console.log('\n' + '='.repeat(60));
      console.log('🎯 PHASE 3: PUPPETEER CODE GENERATION');
      console.log('='.repeat(60));
      
      const phase3Results = await this.phase3.execute(phase1Results, phase2Results);
      results.phase3 = phase3Results;
      
      if (!phase3Results.success) {
        throw new Error(`Phase 3 failed: ${phase3Results.error}`);
      }
      
      console.log('✅ Phase 3 completed successfully');
      this.printPhase3Summary(phase3Results);

      // 完成
      results.endTime = new Date().toISOString();
      results.success = true;
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 PUPPETEER TEST GENERATION COMPLETED!');
      console.log('='.repeat(60));
      this.printFinalSummary(results);
      
      return results;
      
    } catch (error) {
      console.error('\n❌ Test generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 打印阶段一总结
   */
  printPhase1Summary(results) {
    console.log('\n📊 Phase 1 Summary:');
    console.log(`  • Framework: ${results.analysis.projectStructure?.framework || 'Unknown'}`);
    console.log(`  • Routes found: ${results.analysis.routes?.length || 0}`);
    console.log(`  • Test scenarios: ${results.analysis.testScenarios?.length || 0}`);
    console.log(`  • Auth flow detected: ${results.analysis.authFlow?.loginPage ? 'Yes' : 'No'}`);
  }

  /**
   * 打印阶段二总结
   */
  printPhase2Summary(results) {
    console.log('\n📊 Phase 2 Summary:');
    console.log(`  • Test suites: ${results.testCases?.testSuites?.length || 0}`);
    console.log(`  • Test paths: ${results.testCases?.testPaths?.length || 0}`);
    
    const successful = results.validationResults?.filter(r => r.success).length || 0;
    const total = results.validationResults?.length || 0;
    console.log(`  • Validation success: ${successful}/${total}`);
    
    if (results.domMapping?.selectors) {
      const selectorCount = Object.keys(results.domMapping.selectors).length;
      console.log(`  • DOM selectors mapped: ${selectorCount}`);
    }
  }

  /**
   * 打印阶段三总结
   */
  printPhase3Summary(results) {
    console.log('\n📊 Phase 3 Summary:');
    console.log(`  • Output directory: ${results.outputDir}`);
    console.log('  • Generated files:');
    
    if (results.files) {
      Object.entries(results.files).forEach(([type, path]) => {
        console.log(`    - ${type}: ${path}`);
      });
    }
  }

  /**
   * 打印最终总结
   */
  printFinalSummary(results) {
    const duration = new Date(results.endTime) - new Date(results.startTime);
    console.log(`⏱️  Total execution time: ${Math.round(duration / 1000)}s`);
    console.log(`🤖 LLM Provider: ${results.provider}`);
    console.log(`📁 Generated tests location: ${results.phase3.outputDir}`);
    
    console.log('\n📋 Next steps:');
    console.log('  1. Navigate to the generated tests directory');
    console.log('  2. Run: npm install');
    console.log('  3. Configure test environment variables');
    console.log('  4. Run: npm test');
    
    console.log('\n💡 Tips:');
    console.log('  • Review generated selectors and adjust if needed');
    console.log('  • Update test data in config/test-data.js');
    console.log('  • Customize wait strategies in config/test.config.js');
  }

  /**
   * 验证输入参数
   */
  validateInputs(userInput, projectPath) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('User input is required and must be a string');
    }
    
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('Project path is required and must be a string');
    }
    
    // 可以添加更多验证逻辑
  }
}

/**
 * CLI 接口
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node src/index.js "<user_input>" "<project_path>" [frontend_url]');
    console.log('Example: node src/index.js "Generate tests for login and dashboard" "./my-react-app" "http://localhost:3000"');
    process.exit(1);
  }
  
  const userInput = args[0];
  const projectPath = args[1];
  const frontendUrl = args[2] || 'http://localhost:3000';
  
  const agent = new PuppeteerTestAgent();
  
  try {
    await agent.generateTests(userInput, projectPath, frontendUrl);
  } catch (error) {
    console.error('❌ Agent execution failed:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行 CLI
if (require.main === module) {
  main();
}

module.exports = PuppeteerTestAgent;
