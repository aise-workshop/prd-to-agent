#!/usr/bin/env node

import { TestAgent } from './agents/test-agent.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('🤖 AI Puppeteer Test Generator');
    console.log('================================\n');

    // Parse command line arguments or use default config for demo
    const config = parseConfig();
    
    // Initialize the Test Agent
    const testAgent = new TestAgent();
    
    // Validate configuration
    const validationErrors = await testAgent.validateConfiguration(config);
    if (validationErrors.length > 0) {
      console.error('❌ Configuration errors:');
      validationErrors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    // Execute the test generation
    const results = await testAgent.generateTests(config);
    
    if (results.success) {
      console.log('\n🎉 Test generation completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Navigate to the output directory:', results.phases.phaseThree.outputPath);
      console.log('2. Install dependencies: npm install');
      console.log('3. Run tests: npm test');
      console.log('4. Check execution-summary.json for detailed results');
    } else {
      console.error('\n❌ Test generation failed:', results.error);
      console.log('Check error-report.json for detailed error information');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function parseConfig() {
  const args = process.argv.slice(2);
  
  // Default configuration for demo
  const defaultConfig = {
    userInput: "我需要测试一个电商网站的主要功能：用户登录、浏览商品列表、查看商品详情、添加到购物车的完整流程",
    projectPath: process.cwd(), // Current directory
    baseUrl: "http://localhost:3000", // Assume local development server
    outputPath: "./generated-tests"
  };
  
  // Simple argument parsing
  const config = { ...defaultConfig };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];
    
    switch (arg) {
      case '--input':
      case '-i':
        if (value) config.userInput = value;
        i++;
        break;
      case '--project':
      case '-p':
        if (value) config.projectPath = path.resolve(value);
        i++;
        break;
      case '--url':
      case '-u':
        if (value) config.baseUrl = value;
        i++;
        break;
      case '--output':
      case '-o':
        if (value) config.outputPath = path.resolve(value);
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return config;
}

function printHelp() {
  console.log(`
AI Puppeteer Test Generator

Usage: npm start [options]

Options:
  -i, --input <text>      User requirements for test generation
  -p, --project <path>    Path to the frontend project directory  
  -u, --url <url>         Base URL of the application to test
  -o, --output <path>     Output directory for generated tests
  -h, --help              Show this help message

Examples:
  npm start
  npm start --input "测试登录和商品浏览功能" --project ./my-app --url http://localhost:3000
  npm start -i "Test user registration flow" -p /path/to/project -u https://app.example.com

Environment Variables:
  DEEPSEEK_TOKEN          DeepSeek API key (recommended)
  GLM_API_KEY            GLM API key  
  OPENAI_API_KEY         OpenAI API key
`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main();