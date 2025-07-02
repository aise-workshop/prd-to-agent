import { generateText } from '../utils/llm-provider.js';
import { BrowserTools } from '../tools/browser-tools.js';

export class PhaseTwo {
  constructor(llmProvider) {
    this.llmProvider = llmProvider;
    this.browser = new BrowserTools();
  }

  async execute(phaseOneResult, baseUrl) {
    try {
      console.log('🚀 Starting Phase Two: Browser verification and test case generation');
      
      const { analysis } = phaseOneResult;
      const results = [];
      
      // Launch browser
      await this.browser.launch({ headless: false, devtools: true });
      
      // Test each scenario from phase one
      for (const scenario of analysis.testPlan.testScenarios) {
        console.log(`🧪 Testing scenario: ${scenario.name}`);
        const scenarioResult = await this.testScenario(scenario, baseUrl, analysis);
        results.push(scenarioResult);
      }
      
      // If login is required, test login flow first
      if (analysis.testPlan.loginFlow.required) {
        console.log('🔐 Testing login flow...');
        const loginResult = await this.testLoginFlow(analysis.testPlan.loginFlow, baseUrl);
        results.unshift(loginResult);
      }
      
      // Generate refined test cases based on browser verification
      console.log('🤖 Generating refined test cases...');
      const refinedTestCases = await this.generateRefinedTestCases(results, phaseOneResult);
      
      await this.browser.close();
      
      return {
        success: true,
        browserResults: results,
        refinedTestCases,
        validatedScenarios: results.filter(r => r.success)
      };
    } catch (error) {
      await this.browser.close();
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testScenario(scenario, baseUrl, analysis) {
    const result = {
      name: scenario.name,
      success: false,
      steps: [],
      pageInfo: [],
      errors: []
    };

    try {
      // Navigate through expected pages
      for (const expectedPage of scenario.expectedPages) {
        const fullUrl = this.buildFullUrl(baseUrl, expectedPage);
        console.log(`  📄 Navigating to: ${fullUrl}`);
        
        try {
          await this.browser.navigateTo(fullUrl);
          const pageInfo = await this.browser.getPageInfo();
          
          result.steps.push({
            action: 'navigate',
            url: fullUrl,
            success: true
          });
          
          result.pageInfo.push({
            url: fullUrl,
            ...pageInfo
          });
          
          // Take screenshot for verification
          const screenshotPath = `./screenshots/${scenario.name.replace(/\s+/g, '_')}_${expectedPage.replace(/\//g, '_')}.png`;
          await this.browser.screenshot(screenshotPath);
          
        } catch (error) {
          result.errors.push(`Failed to navigate to ${fullUrl}: ${error.message}`);
          result.steps.push({
            action: 'navigate',
            url: fullUrl,
            success: false,
            error: error.message
          });
        }
      }
      
      result.success = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Scenario execution failed: ${error.message}`);
    }
    
    return result;
  }

  async testLoginFlow(loginFlow, baseUrl) {
    const result = {
      name: 'Login Flow',
      success: false,
      steps: [],
      pageInfo: null,
      errors: []
    };

    try {
      const loginUrl = this.buildFullUrl(baseUrl, loginFlow.loginUrl);
      console.log(`  🔐 Testing login at: ${loginUrl}`);
      
      await this.browser.navigateTo(loginUrl);
      const pageInfo = await this.browser.getPageInfo();
      result.pageInfo = pageInfo;
      
      // Verify login form elements exist
      const { loginSelectors } = loginFlow;
      const formValidation = {
        usernameField: false,
        passwordField: false,
        submitButton: false
      };
      
      // Check if suggested selectors exist on the page
      for (const element of pageInfo.interactiveElements) {
        if (element.selector.includes('username') || element.selector.includes('email')) {
          formValidation.usernameField = true;
        }
        if (element.selector.includes('password')) {
          formValidation.passwordField = true;
        }
        if (element.tag === 'button' || element.type === 'submit') {
          formValidation.submitButton = true;
        }
      }
      
      result.steps.push({
        action: 'verify_login_form',
        validation: formValidation,
        success: Object.values(formValidation).every(v => v)
      });
      
      result.success = Object.values(formValidation).every(v => v);
      
      if (!result.success) {
        result.errors.push('Login form elements not found with suggested selectors');
      }
      
    } catch (error) {
      result.errors.push(`Login flow test failed: ${error.message}`);
    }
    
    return result;
  }

  async generateRefinedTestCases(browserResults, phaseOneResult) {
    try {
      const prompt = this.buildRefinementPrompt(browserResults, phaseOneResult);
      
      const result = await generateText({
        model: this.llmProvider.openai(this.llmProvider.fullModel),
        prompt,
        temperature: 0.2
      });
      
      return this.parseRefinedTestCases(result.text);
    } catch (error) {
      console.error('Failed to generate refined test cases:', error);
      return [];
    }
  }

  buildRefinementPrompt(browserResults, phaseOneResult) {
    return `基于浏览器验证结果，请生成精确的Puppeteer测试用例。

原始分析结果：
${JSON.stringify(phaseOneResult.analysis, null, 2)}

浏览器验证结果：
${JSON.stringify(browserResults, null, 2)}

请生成包含以下结构的JSON响应：

{
  "refinedTestCases": [
    {
      "name": "测试用例名称",
      "description": "详细描述",
      "preconditions": ["前置条件"],
      "steps": [
        {
          "action": "navigate|click|type|wait",
          "target": "具体的DOM选择器",
          "value": "输入值（如果适用）",
          "description": "步骤描述",
          "expectedResult": "期望结果"
        }
      ],
      "assertions": [
        {
          "type": "url|text|element",
          "target": "检查目标",
          "expected": "期望值"
        }
      ]
    }
  ],
  "improvements": [
    {
      "issue": "发现的问题",
      "suggestion": "改进建议"
    }
  ]
}

要求：
1. 基于实际浏览器验证结果调整选择器
2. 确保所有步骤都是可执行的
3. 包含必要的等待和断言
4. 处理页面加载和异步操作`;
  }

  parseRefinedTestCases(llmResponse) {
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { refinedTestCases: [], improvements: [] };
    } catch (error) {
      console.warn('Failed to parse refined test cases:', error.message);
      return { 
        refinedTestCases: [], 
        improvements: [{ 
          issue: "JSON解析失败", 
          suggestion: "检查LLM响应格式" 
        }],
        rawResponse: llmResponse
      };
    }
  }

  buildFullUrl(baseUrl, path) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
  }
}