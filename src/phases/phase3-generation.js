const { generateAIText } = require('../config/llm-provider');
const fs = require('fs').promises;
const path = require('path');
const { parseCleanJSON } = require('../utils/json-parser');

/**
 * 阶段三：Puppeteer 代码生成
 * 根据验证结果生成最终的 Puppeteer 测试代码
 */
class Phase3Generation {
  constructor() {
    this.outputDir = 'generated-tests';
  }

  /**
   * 执行阶段三代码生成
   */
  async execute(phase1Results, phase2Results) {
    console.log('🎯 Phase 3: Starting Puppeteer test code generation...');
    
    try {
      // 1. 生成测试代码
      const testCode = await this.generateTestCode(phase1Results, phase2Results);
      
      // 2. 生成辅助工具代码
      const utilityCode = await this.generateUtilityCode(phase2Results);
      
      // 3. 生成配置文件
      const configCode = await this.generateConfigCode(phase1Results, phase2Results);
      
      // 4. 生成 package.json 和说明文档
      const packageJson = await this.generatePackageJson();
      const documentation = await this.generateDocumentation(phase1Results, phase2Results);
      
      // 5. 保存所有文件
      await this.saveGeneratedFiles({
        testCode,
        utilityCode,
        configCode,
        packageJson,
        documentation
      });
      
      return {
        success: true,
        outputDir: this.outputDir,
        files: {
          testCode: `${this.outputDir}/tests/`,
          utilityCode: `${this.outputDir}/utils/`,
          configCode: `${this.outputDir}/config/`,
          packageJson: `${this.outputDir}/package.json`,
          documentation: `${this.outputDir}/README.md`
        },
        phase: 3
      };
    } catch (error) {
      console.error('❌ Phase 3 failed:', error);
      return {
        success: false,
        error: error.message,
        phase: 3
      };
    }
  }

  /**
   * 生成主要测试代码
   */
  async generateTestCode(phase1Results, phase2Results) {
    const prompt = `
基于前两个阶段的分析和验证结果，生成完整的 Puppeteer 测试代码。

阶段一分析结果：
${JSON.stringify(phase1Results.analysis, null, 2)}

阶段二验证结果：
${JSON.stringify(phase2Results, null, 2)}

请生成以下结构的测试代码：

1. 主测试文件 (main.test.js): 包含测试入口和通用设置。
2. 登录测试 (auth.test.js): 针对登录流程的测试。
3. 导航测试 (navigation.test.js): 验证主要页面间的导航。
4. 业务流程测试 (business-flow.test.js): 针对核心业务流程的测试。

每个测试文件应该包含：
- 完整的 Puppeteer 测试代码，使用 Jest 框架。
- 适当的错误处理和断言。
- 清晰的注释。
- 可配置的等待策略，利用 phase2Results.domMapping.waitStrategies。
- 截图和日志记录。
- 使用 phase2Results.optimizedPaths 中的优化路径和步骤。
- 使用 phase2Results.domMapping.selectors 中的 DOM 选择器。

请以 JSON 格式返回，注意代码中的引号需要正确转义：
{
  "main.test.js": "完整的JavaScript测试代码，所有引号都要转义",
  "auth.test.js": "完整的JavaScript测试代码，所有引号都要转义",
  "navigation.test.js": "完整的JavaScript测试代码，所有引号都要转义",
  "business-flow.test.js": "完整的JavaScript测试代码，所有引号都要转义"
}

重要：不要在JSON中使用markdown代码块标记，直接返回纯JSON格式。

代码要求：
- 使用 Jest 测试框架
- 包含完整的 setup 和 teardown
- 使用 async/await 语法
- 包含详细的断言
- 支持并行执行
- 包含重试机制
- 充分利用提供的 optimizedPaths 和 selectors 信息。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.2,
      maxTokens: 6000
    });

    try {
      const testCode = parseCleanJSON(result.text);
      console.log('📝 Generated test code files');
      return testCode;
    } catch (error) {
      throw new Error(`Failed to parse test code: ${error.message}`);
    }
  }

  /**
   * 生成辅助工具代码
   */
  async generateUtilityCode(phase2Results) {
    const prompt = `
基于验证结果，生成 Puppeteer 测试的辅助工具代码。

验证结果：
${JSON.stringify(phase2Results, null, 2)}

请生成以下辅助工具：

1. page-utils.js - 页面操作工具，包含点击、输入、导航等常用操作，并集成等待策略和错误处理。
2. wait-utils.js - 等待策略工具，封装 Puppeteer 的等待函数，并根据 phase2Results.domMapping.waitStrategies 提供建议的等待方法。
3. screenshot-utils.js - 截图工具，提供截图保存和比较功能。
4. data-utils.js - 测试数据工具，用于管理测试数据，可以考虑从外部文件加载或生成模拟数据。

请以 JSON 格式返回，注意代码中的引号需要正确转义：
{
  "page-utils.js": "完整的JavaScript工具代码，所有引号都要转义",
  "wait-utils.js": "完整的JavaScript工具代码，所有引号都要转义",
  "screenshot-utils.js": "完整的JavaScript工具代码，所有引号都要转义",
  "data-utils.js": "完整的JavaScript工具代码，所有引号都要转义"
}

重要：不要在JSON中使用markdown代码块标记，直接返回纯JSON格式。

工具要求：
- 可重用的函数
- 错误处理
- 详细注释
- 支持配置
- 日志记录
- 充分利用 phase2Results 中的信息，特别是 domMapping 和 optimizedPaths。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.2,
      maxTokens: 4000
    });

    try {
      // 清理 LLM 响应，移除可能的 markdown 代码块标记
      let cleanText = result.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const utilityCode = JSON.parse(cleanText);
      console.log('🔧 Generated utility code files');
      return utilityCode;
    } catch (error) {
      console.error('Raw LLM response:', result.text);
      throw new Error(`Failed to parse utility code: ${error.message}`);
    }
  }

  /**
   * 生成配置文件
   */
  async generateConfigCode(phase1Results, phase2Results) {
    const prompt = `
基于分析和验证结果，生成测试配置文件。

项目分析：
${JSON.stringify(phase1Results.analysis, null, 2)}

验证结果：
${JSON.stringify(phase2Results, null, 2)}

请生成以下配置文件：

1. test.config.js - 主配置文件，包含 Puppeteer 启动选项、超时设置、报告路径等。
2. selectors.js - 选择器配置，包含 phase2Results.domMapping.selectors 中生成的所有 DOM 选择器。
3. test-data.js - 测试数据配置，包含登录凭据、测试用户数据等，并强调敏感信息应从环境变量加载。
4. jest.config.js - Jest 配置，确保与 Puppeteer 和测试结构兼容。

请以 JSON 格式返回，注意代码中的引号需要正确转义：
{
  "test.config.js": "完整的JavaScript配置代码，所有引号都要转义",
  "selectors.js": "完整的JavaScript配置代码，所有引号都要转义",
  "test-data.js": "完整的JavaScript配置代码，所有引号都要转义",
  "jest.config.js": "完整的JavaScript配置代码，所有引号都要转义"
}

重要：不要在JSON中使用markdown代码块标记，直接返回纯JSON格式。

配置要求：
- 环境变量支持
- 可扩展性
- 清晰的结构
- 详细注释
- 充分利用 phase1Results 和 phase2Results 中的信息。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.2,
      maxTokens: 3000
    });

    try {
      // 清理 LLM 响应，移除可能的 markdown 代码块标记
      let cleanText = result.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const configCode = JSON.parse(cleanText);
      console.log('⚙️ Generated configuration files');
      return configCode;
    } catch (error) {
      console.error('Raw LLM response:', result.text);
      throw new Error(`Failed to parse config code: ${error.message}`);
    }
  }

  /**
   * 生成 package.json
   */
  async generatePackageJson() {
    const packageJson = {
      name: "generated-ui-tests",
      version: "1.0.0",
      description: "Auto-generated Puppeteer UI tests",
      main: "index.js",
      scripts: {
        test: "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
        "test:debug": "jest --detectOpenHandles --forceExit",
        "test:auth": "jest tests/auth.test.js",
        "test:navigation": "jest tests/navigation.test.js",
        "test:business": "jest tests/business-flow.test.js"
      },
      dependencies: {
        puppeteer: "^21.0.0",
        jest: "^29.0.0",
        "jest-puppeteer": "^9.0.0"
      },
      devDependencies: {
        "@types/jest": "^29.0.0",
        "@types/puppeteer": "^7.0.0"
      },
      jest: {
        preset: "jest-puppeteer",
        testTimeout: 30000
      }
    };

    console.log('📦 Generated package.json');
    return JSON.stringify(packageJson, null, 2);
  }

  /**
   * 生成文档
   */
  async generateDocumentation(phase1Results, phase2Results) {
    const prompt = `
基于整个分析和生成过程，创建详细的使用文档。

项目分析：
${JSON.stringify(phase1Results.analysis, null, 2)}

验证结果：
${JSON.stringify(phase2Results, null, 2)}

请生成 Markdown 格式的 README.md 文档，包含：

1. 项目概述：简要介绍生成的 Puppeteer UI 测试项目。
2. 安装说明：详细说明如何安装依赖。
3. 配置说明：如何配置测试环境，包括环境变量和测试数据。
4. 运行测试：如何执行测试，包括不同的测试脚本。
5. 测试结构说明：生成的测试文件和辅助工具的结构。
6. 自定义和扩展：如何修改和扩展生成的测试。
7. 故障排除：常见问题及解决方案。
8. 生成过程说明：简要回顾 AI Agent 的生成过程。

文档应该详细、易懂，包含代码示例和最佳实践。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.3,
      maxTokens: 4000
    });

    console.log('📚 Generated documentation');
    return result.text;
  }

  /**
   * 保存生成的文件
   */
  async saveGeneratedFiles(files) {
    console.log('💾 Saving generated files...');
    
    // 确保输出目录存在
    await this.ensureDirectoryExists(this.outputDir);
    await this.ensureDirectoryExists(path.join(this.outputDir, 'tests'));
    await this.ensureDirectoryExists(path.join(this.outputDir, 'utils'));
    await this.ensureDirectoryExists(path.join(this.outputDir, 'config'));

    // 保存测试文件
    for (const [filename, code] of Object.entries(files.testCode)) {
      const filePath = path.join(this.outputDir, 'tests', filename);
      await fs.writeFile(filePath, code, 'utf-8');
      console.log(`  ✅ Saved ${filePath}`);
    }

    // 保存工具文件
    for (const [filename, code] of Object.entries(files.utilityCode)) {
      const filePath = path.join(this.outputDir, 'utils', filename);
      await fs.writeFile(filePath, code, 'utf-8');
      console.log(`  ✅ Saved ${filePath}`);
    }

    // 保存配置文件
    for (const [filename, code] of Object.entries(files.configCode)) {
      const filePath = path.join(this.outputDir, 'config', filename);
      await fs.writeFile(filePath, code, 'utf-8');
      console.log(`  ✅ Saved ${filePath}`);
    }

    // 保存 package.json
    const packagePath = path.join(this.outputDir, 'package.json');
    await fs.writeFile(packagePath, files.packageJson, 'utf-8');
    console.log(`  ✅ Saved ${packagePath}`);

    // 保存文档
    const docPath = path.join(this.outputDir, 'README.md');
    await fs.writeFile(docPath, files.documentation, 'utf-8');
    console.log(`  ✅ Saved ${docPath}`);

    console.log('🎉 All files saved successfully!');
  }

  /**
   * 确保目录存在
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

module.exports = Phase3Generation;
