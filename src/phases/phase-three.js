import { generateText } from '../utils/llm-provider.js';
import { FileTools } from '../tools/file-tools.js';

export class PhaseThree {
  constructor(llmProvider) {
    this.llmProvider = llmProvider;
  }

  async execute(phaseTwoResult, outputPath) {
    try {
      console.log('🔧 Starting Phase Three: Puppeteer test code generation');
      
      const { refinedTestCases } = phaseTwoResult;
      const testFiles = [];
      
      // Generate test file for each test case
      for (const testCase of refinedTestCases.refinedTestCases || []) {
        console.log(`📝 Generating test code for: ${testCase.name}`);
        const testCode = await this.generateTestCode(testCase, phaseTwoResult);
        
        if (testCode) {
          const fileName = `${testCase.name.replace(/\s+/g, '_').toLowerCase()}.test.js`;
          const filePath = `${outputPath}/${fileName}`;
          
          await FileTools.writeFile(filePath, testCode);
          testFiles.push({
            name: fileName,
            path: filePath,
            testCase: testCase.name
          });
        }
      }
      
      // Generate a test suite runner
      const suiteRunner = await this.generateTestSuite(refinedTestCases.refinedTestCases || [], outputPath);
      if (suiteRunner) {
        const suiteRunnerPath = `${outputPath}/test-suite.js`;
        await FileTools.writeFile(suiteRunnerPath, suiteRunner);
        testFiles.push({
          name: 'test-suite.js',
          path: suiteRunnerPath,
          testCase: 'Test Suite Runner'
        });
      }
      
      // Generate package.json for the test project
      const testPackageJson = this.generateTestPackageJson();
      await FileTools.writeFile(`${outputPath}/package.json`, JSON.stringify(testPackageJson, null, 2));
      
      return {
        success: true,
        testFiles,
        outputPath,
        generatedTests: testFiles.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateTestCode(testCase, phaseTwoResult) {
    try {
      const prompt = this.buildTestCodePrompt(testCase, phaseTwoResult);
      
      const result = await generateText({
        model: this.llmProvider.openai(this.llmProvider.fullModel),
        prompt,
        temperature: 0.1
      });
      
      return this.extractTestCode(result.text);
    } catch (error) {
      console.error(`Failed to generate test code for ${testCase.name}:`, error);
      return null;
    }
  }

  buildTestCodePrompt(testCase, phaseTwoResult) {
    return `请生成一个完整的Puppeteer测试文件，基于以下测试用例：

测试用例：
${JSON.stringify(testCase, null, 2)}

浏览器验证结果：
${JSON.stringify(phaseTwoResult.browserResults, null, 2)}

要求：
1. 使用现代的Puppeteer API
2. 包含适当的错误处理
3. 添加必要的等待和断言
4. 使用Jest或类似的测试框架
5. 包含详细的注释
6. 使用async/await语法
7. 确保测试是独立和可重复的

请生成完整的JavaScript测试文件代码：

\`\`\`javascript
// 你的测试代码
\`\`\``;
  }

  extractTestCode(llmResponse) {
    const codeMatch = llmResponse.match(/```javascript\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return codeMatch[1];
    }
    
    // Fallback: try to extract any code block
    const fallbackMatch = llmResponse.match(/```\n([\s\S]*?)\n```/) || llmResponse.match(/```([\s\S]*?)```/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }
    
    // If no code block found, return the whole response
    return llmResponse;
  }

  async generateTestSuite(testCases, outputPath) {
    try {
      const prompt = `请生成一个测试套件运行器，用于批量执行以下测试用例：

测试用例列表：
${testCases.map(tc => `- ${tc.name}: ${tc.description}`).join('\n')}

要求：
1. 创建一个主测试套件文件
2. 能够批量运行所有测试
3. 提供测试结果汇总
4. 包含适当的错误处理和日志
5. 支持并行或串行执行选项
6. 生成测试报告

请生成完整的测试套件运行器代码：

\`\`\`javascript
// 测试套件运行器代码
\`\`\``;

      const result = await generateText({
        model: this.llmProvider.openai(this.llmProvider.fullModel),
        prompt,
        temperature: 0.1
      });

      return this.extractTestCode(result.text);
    } catch (error) {
      console.error('Failed to generate test suite:', error);
      return null;
    }
  }

  generateTestPackageJson() {
    return {
      "name": "generated-puppeteer-tests",
      "version": "1.0.0",
      "description": "Auto-generated Puppeteer tests",
      "main": "test-suite.js",
      "scripts": {
        "test": "node test-suite.js",
        "test:single": "node",
        "test:headless": "HEADLESS=true node test-suite.js",
        "test:debug": "DEBUG=true node test-suite.js"
      },
      "dependencies": {
        "puppeteer": "^23.0.0",
        "jest": "^29.0.0",
        "@jest/globals": "^29.0.0"
      },
      "devDependencies": {
        "@types/node": "^22.0.0"
      },
      "jest": {
        "testEnvironment": "node",
        "testTimeout": 30000,
        "verbose": true
      }
    };
  }
}