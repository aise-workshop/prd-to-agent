const { generateAIText } = require('../config/llm-provider');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const FrontendServerManager = require('../utils/frontend-server');
const { parseCleanJSON, safeParseJSON } = require('../utils/json-parser');

/**
 * 阶段二：测试用例生成和浏览器验证
 * 生成测试用例和路径，启动浏览器进行验证，支持重试机制
 */
class Phase2Validation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.maxRetries = 3;
    this.serverManager = new FrontendServerManager();
    this.autoStartedServer = false;
  }

  /**
   * 执行阶段二验证
   */
  async execute(phase1Results, frontendUrl = null) {
    console.log('🧪 Phase 2: Starting test case generation and browser validation...');

    try {
      // 1. 基于阶段一结果生成测试用例
      const testCases = await this.generateTestCases(phase1Results);

      // 2. 自动启动前端服务器（如果没有提供URL）
      let actualFrontendUrl = frontendUrl;
      if (!actualFrontendUrl) {
        console.log('🚀 No frontend URL provided, attempting to auto-start server...');
        const serverInfo = await this.serverManager.autoStart(phase1Results.projectPath);
        actualFrontendUrl = serverInfo.url;
        this.autoStartedServer = true;
        console.log(`✅ Frontend server auto-started at: ${actualFrontendUrl}`);
      }

      // 3. 启动浏览器
      await this.initializeBrowser();

      // 4. 验证测试用例（支持重试）
      const validationResults = await this.validateTestCases(testCases, actualFrontendUrl);

      // 5. 生成DOM选择器映射
      const domMapping = await this.generateDOMMapping(validationResults);

      // 6. 优化测试路径
      const optimizedPaths = await this.optimizeTestPaths(testCases, validationResults);

      await this.cleanup();

      return {
        success: true,
        testCases,
        validationResults,
        domMapping,
        optimizedPaths,
        frontendUrl: actualFrontendUrl,
        autoStartedServer: this.autoStartedServer,
        phase: 2
      };
    } catch (error) {
      console.error('❌ Phase 2 failed:', error);
      await this.cleanup();
      return {
        success: false,
        error: error.message,
        phase: 2
      };
    }
  }

  /**
   * 生成测试用例
   */
  async generateTestCases(phase1Results) {
    const prompt = `
基于阶段一的分析结果，生成详细的 UI 测试用例。

分析结果：
${JSON.stringify(phase1Results.analysis, null, 2)}

请生成测试用例，包含以下信息的 JSON 格式：
{
  "testSuites": [
    {
      "name": "测试套件名称",
      "description": "套件描述",
      "priority": "high/medium/low",
      "testCases": [
        {
          "name": "测试用例名称",
          "description": "测试描述",
          "steps": [
            {
              "action": "操作类型 (navigate/click/type/wait/assert)",
              "target": "目标元素描述",
              "value": "输入值或期望值",
              "description": "步骤描述"
            }
          ],
          "expectedResults": ["期望结果1", "期望结果2"],
          "prerequisites": ["前置条件1", "前置条件2"]
        }
      ]
    }
  ],
  "testPaths": [
    {
      "name": "测试路径名称",
      "description": "路径描述",
      "startUrl": "起始URL",
      "steps": ["步骤1", "步骤2", "步骤3"],
      "endUrl": "结束URL",
      "businessValue": "业务价值描述"
    }
  ]
}

重点生成以下类型的测试：
1. 登录流程测试
2. 主要业务流程测试
3. 导航和路由测试
4. 表单提交测试
5. 错误处理测试

确保测试用例具体、可执行，包含明确的操作步骤和验证点。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.3,
      maxTokens: 4000
    });

    try {
      const testCases = parseCleanJSON(result.text);
      console.log(`📝 Generated ${testCases.testSuites?.length || 0} test suites with ${testCases.testPaths?.length || 0} test paths`);
      return testCases;
    } catch (error) {
      throw new Error(`Failed to parse test cases: ${error.message}`);
    }
  }

  /**
   * 初始化浏览器
   */
  async initializeBrowser() {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: false, // 设为 false 以便观察测试过程
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // 设置用户代理
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // 启用请求拦截以便调试
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      request.continue();
    });
    
    console.log('✅ Browser initialized');
  }

  /**
   * 验证测试用例
   */
  async validateTestCases(testCases, frontendUrl) {
    const validationResults = [];
    
    for (const testPath of testCases.testPaths) {
      console.log(`🔍 Validating test path: ${testPath.name}`);
      
      let attempt = 0;
      let success = false;
      let lastError = null;
      
      while (attempt < this.maxRetries && !success) {
        attempt++;
        console.log(`  Attempt ${attempt}/${this.maxRetries}`);
        
        try {
          const result = await this.validateSinglePath(testPath, frontendUrl);
          validationResults.push({
            testPath: testPath.name,
            success: true,
            attempt,
            result,
            timestamp: new Date().toISOString()
          });
          success = true;
          console.log(`  ✅ Validation successful on attempt ${attempt}`);
        } catch (error) {
          lastError = error;
          console.log(`  ❌ Attempt ${attempt} failed: ${error.message}`);
          
          if (attempt < this.maxRetries) {
            console.log(`  ⏳ Waiting before retry...`);
            await this.delay(2000);
          }
        }
      }
      
      if (!success) {
        validationResults.push({
          testPath: testPath.name,
          success: false,
          attempts: this.maxRetries,
          error: lastError.message,
          timestamp: new Date().toISOString()
        });
        console.log(`  ❌ All attempts failed for ${testPath.name}`);
      }
    }
    
    return validationResults;
  }

  /**
   * 验证单个测试路径
   */
  async validateSinglePath(testPath, frontendUrl) {
    const startUrl = testPath.startUrl.startsWith('http') 
      ? testPath.startUrl 
      : `${frontendUrl}${testPath.startUrl}`;
    
    console.log(`    Navigating to: ${startUrl}`);
    await this.page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待页面加载
    await this.delay(2000);
    
    // 执行测试路径中的步骤
    for (const step of testPath.steps) {
      console.log(`      Performing step: ${step.description || step.action}`);
      await this.performStep(this.page, step);
      await this.delay(500); // 短暂延迟，确保页面状态更新
    }

    // 截图保存
    const screenshotPath = `screenshots/validation_${testPath.name.replace(/\s+/g, '_')}_${Date.now()}.png`;
    await this.ensureDirectoryExists(path.dirname(screenshotPath));
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    
    // 获取页面信息
    const pageInfo = await this.page.evaluate(() => {
      const getElementInfo = (el) => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        name: el.name,
        text: el.textContent.trim().substring(0, 100), // Limit text length
        value: el.value,
        type: el.type,
        placeholder: el.placeholder,
        href: el.href,
        src: el.src,
        visible: el.offsetParent !== null,
        bounds: el.getBoundingClientRect ? {
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        } : null,
      });

      const allElements = Array.from(document.querySelectorAll('input, button, a, form, textarea, select, [role="button"], [role="link"]'));
      const interactiveElements = allElements.map(getElementInfo);

      return {
        title: document.title,
        url: window.location.href,
        htmlContent: document.documentElement.outerHTML.substring(0, 5000), // Capture a snippet of HTML
        interactiveElements,
        // Deprecated, but kept for backward compatibility if needed
        hasLoginForm: !!document.querySelector('form[action*="login"], form input[type="password"], .login-form'),
        hasNavigation: !!document.querySelector('nav, .navbar, .navigation'),
        formElements: Array.from(document.querySelectorAll('form')).map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder
          }))
        })),
        buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(btn => ({
          text: btn.textContent || btn.value,
          type: btn.type,
          className: btn.className
        })),
        links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
          text: link.textContent,
          href: link.href,
          className: link.className
        }))
      };
    });
    
    return {
      url: startUrl,
      pageInfo,
      screenshot: screenshotPath,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行单个测试步骤
   */
  async performStep(page, step) {
    const { action, target, value, description } = step;

    try {
      switch (action) {
        case 'navigate':
          await page.goto(target, { waitUntil: 'networkidle2' });
          break;
        case 'click':
          await page.waitForSelector(target, { visible: true });
          await page.click(target);
          break;
        case 'type':
          await page.waitForSelector(target, { visible: true });
          await page.type(target, value);
          break;
        case 'wait':
          if (typeof target === 'number') { // wait for a duration
            await this.delay(target);
          } else if (target.startsWith('#') || target.startsWith('.') || target.startsWith('[')) { // wait for selector
            await page.waitForSelector(target, { visible: true });
          } else { // wait for navigation
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
          }
          break;
        case 'assert':
          // This is a basic assertion, more complex assertions would be in generated code
          if (target === 'url') {
            const currentUrl = page.url();
            if (!currentUrl.includes(value)) {
              throw new Error(`Assertion failed: URL "${currentUrl}" does not contain "${value}"`);
            }
          } else {
            const element = await page.$(target);
            if (!element) {
              throw new Error(`Assertion failed: Element "${target}" not found`);
            }
            // More assertions can be added here (e.g., text content, visibility)
          }
          break;
        default:
          console.warn(`Unknown action type: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing step "${description || action}" on target "${target}": ${error.message}`);
      throw error; // Re-throw to fail the validation
    }
  }

  /**
   * 生成DOM选择器映射
   */
  async generateDOMMapping(validationResults) {
    const prompt = `
基于浏览器验证结果，生成DOM选择器映射，用于后续的Puppeteer测试代码生成。

验证结果：
${JSON.stringify(validationResults, null, 2)}

特别注意 validationResults 中的 pageInfo.interactiveElements，它们包含了页面上可交互元素的详细信息。

请分析页面元素，生成选择器映射的JSON格式：
{
  "selectors": {
    "login": {
      "usernameInput": "用户名输入框选择器",
      "passwordInput": "密码输入框选择器", 
      "submitButton": "登录按钮选择器",
      "errorMessage": "错误信息选择器"
    },
    "navigation": {
      "homeLink": "首页链接选择器",
      "profileLink": "个人资料链接选择器",
      "logoutButton": "退出按钮选择器"
    },
    "common": {
      "loadingSpinner": "加载动画选择器",
      "successMessage": "成功消息选择器",
      "modal": "模态框选择器"
    },
    "dynamic": { // 用于存放动态或特定业务场景的选择器
      "productItem": "产品列表项选择器",
      "addToCartButton": "添加到购物车按钮选择器"
    }
  },
  "waitStrategies": {
    "pageLoad": "页面加载等待策略",
    "ajaxComplete": "AJAX完成等待策略",
    "elementVisible": "元素可见等待策略"
  }
}

选择器应该优先使用：
1. data-testid 属性
2. id 属性
3. 稳定的 class 名称
4. 语义化的元素选择器

避免使用容易变化的选择器。对于输入框，优先使用 name 或 placeholder 属性。对于按钮和链接，优先使用文本内容或 aria-label。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.2,
      maxTokens: 2000
    });

    try {
      const domMapping = parseCleanJSON(result.text);
      console.log('🎯 Generated DOM selector mapping');
      return domMapping;
    } catch (error) {
      console.warn('Failed to generate DOM mapping:', error.message);
      return safeParseJSON(result.text, { selectors: {}, waitStrategies: {} });
    }
  }

  /**
   * 优化测试路径
   */
  async optimizeTestPaths(testCases, validationResults) {
    const prompt = `
基于测试用例、验证结果和 DOM 选择器映射，优化测试路径，提供最佳的测试执行顺序和策略。

原始测试用例：
${JSON.stringify(testCases, null, 2)}

验证结果：
${JSON.stringify(validationResults, null, 2)}

请生成优化后的测试路径：
{
  "optimizedPaths": [
    {
      "name": "优化路径名称",
      "description": "路径描述",
      "priority": "执行优先级",
      "estimatedDuration": "预估执行时间",
      "dependencies": ["依赖的其他测试"],
      "steps": [
        {
          "action": "操作类型 (navigate/click/type/wait/assert)",
          "selector": "元素选择器 (使用DOM映射中生成的最优选择器)",
          "value": "输入值",
          "waitCondition": "等待条件 (例如: 'networkidle2', '#elementId', 2000)",
          "description": "步骤描述"
        }
      ]
    }
  ],
  "executionStrategy": {
    "parallelizable": ["可并行执行的测试"],
    "sequential": ["必须顺序执行的测试"],
    "setupTeardown": "设置和清理策略"
  }
}

优化重点：
1. 确保每个步骤都使用最稳定、最精确的 DOM 选择器。
2. 考虑页面加载、AJAX 请求和元素可见性等等待策略。
3. 识别并处理测试路径中的依赖关系，确保测试顺序的正确性。
4. 尽可能地将测试路径并行化，以提高执行效率。
5. 为每个步骤提供清晰的描述，以便于理解和调试。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.3,
      maxTokens: 3000
    });

    try {
      const optimizedPaths = parseCleanJSON(result.text);
      console.log('⚡ Generated optimized test paths');
      return optimizedPaths;
    } catch (error) {
      console.warn('Failed to optimize test paths:', error.message);
      return safeParseJSON(result.text, { optimizedPaths: [], executionStrategy: {} });
    }
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🔒 Browser closed');
    }
  }

  /**
   * 清理资源（浏览器和服务器）
   */
  async cleanup() {
    await this.closeBrowser();

    if (this.autoStartedServer) {
      await this.serverManager.stopServer();
      this.autoStartedServer = false;
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

module.exports = Phase2Validation;
