const { generateAIText } = require('../config/llm-provider');
const MCPToolManager = require('../tools/mcp-tools');
const { parseCleanJSON } = require('../utils/json-parser');

/**
 * 阶段一：工具调用和代码分析
 * 根据用户输入和代码生成工具调用，分析前端路由和代码结构
 */
class Phase1Analysis {
  constructor() {
    this.toolManager = new MCPToolManager();
  }

  /**
   * 执行阶段一分析
   */
  async execute(userInput, projectPath) {
    console.log('🔍 Phase 1: Starting code analysis and tool calling...');
    
    try {
      // 1. 生成初始工具调用计划
      const toolPlan = await this.generateToolPlan(userInput, projectPath);
      
      // 2. 执行工具调用
      const toolResults = await this.executeTools(toolPlan.tools);
      
      // 3. 分析结果并生成总结
      const analysis = await this.analyzeResults(userInput, toolResults);
      
      return {
        success: true,
        userInput,
        projectPath,
        toolPlan,
        toolResults,
        analysis,
        phase: 1
      };
    } catch (error) {
      console.error('❌ Phase 1 failed:', error);
      return {
        success: false,
        error: error.message,
        phase: 1
      };
    }
  }

  /**
   * 生成工具调用计划
   */
  async generateToolPlan(userInput, projectPath) {
    const toolDefinitions = this.toolManager.getToolDefinitions();
    
    const prompt = `
你是一个专业的前端代码分析助手。用户想要为他们的前端项目生成 Puppeteer UI 测试。

用户需求：${userInput}
项目路径：${projectPath}

可用工具：
${JSON.stringify(toolDefinitions, null, 2)}

请分析用户需求，并生成一个工具调用计划。你的目标是：
1. 深入分析前端项目结构，包括检测框架类型。
2. 详细识别所有路由配置，包括嵌套路由、路由参数、关联组件以及是否需要认证。
3. 识别关键页面和组件，特别是那些与用户交互、数据展示和业务流程相关的。
4. 全面理解登录流程和认证机制，包括登录页面、登录方式和受保护的路由。

请务必在工具调用计划中包含对 'analyze_routes' 工具的调用，并提供 'projectPath' 和 'framework' 参数（如果已知）。

请以 JSON 格式返回工具调用计划：
{
  "reasoning": "分析推理过程",
  "tools": [
    {
      "name": "工具名称",
      "parameters": { "参数": "值" },
      "purpose": "调用目的"
    }
  ]
}

确保工具调用顺序合理，先分析项目结构，再深入具体文件。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.3,
      maxTokens: 2000
    });

    try {
      const plan = parseCleanJSON(result.text);
      console.log('📋 Generated tool plan:', plan.reasoning);
      return plan;
    } catch (error) {
      throw new Error(`Failed to parse tool plan: ${error.message}`);
    }
  }

  /**
   * 执行工具调用
   */
  async executeTools(tools) {
    const results = [];
    
    for (const tool of tools) {
      console.log(`🔧 Executing tool: ${tool.name}`);
      
      try {
        const result = await this.toolManager.executeTool(tool.name, tool.parameters);
        results.push({
          tool: tool.name,
          parameters: tool.parameters,
          purpose: tool.purpose,
          result,
          success: true
        });
        
        console.log(`✅ Tool ${tool.name} completed successfully`);
      } catch (error) {
        console.error(`❌ Tool ${tool.name} failed:`, error.message);
        results.push({
          tool: tool.name,
          parameters: tool.parameters,
          purpose: tool.purpose,
          error: error.message,
          success: false
        });
      }
    }
    
    return results;
  }

  /**
   * 分析工具执行结果
   */
  async analyzeResults(userInput, toolResults) {
    const prompt = `
基于工具执行结果，分析前端项目结构并为 Puppeteer UI 测试生成分析报告。

用户需求：${userInput}

工具执行结果：
${JSON.stringify(toolResults, null, 2)}

请分析并返回以下信息的 JSON 格式：
{
  "projectStructure": {
    "framework": "检测到的前端框架",
    "buildTool": "构建工具",
    "mainEntryPoint": "主入口文件",
    "routingLibrary": "路由库"
  },
  "routes": [
    {
      "path": "路由路径",
      "component": "对应组件",
      "description": "页面描述",
      "requiresAuth": "是否需要认证",
      "file": "路由定义所在文件"
    }
  ],
  "authFlow": {
    "loginPage": "登录页面路径",
    "loginMethod": "登录方式",
    "authStorage": "认证信息存储方式",
    "protectedRoutes": ["需要认证的路由"]
  },
  "testScenarios": [
    {
      "name": "测试场景名称",
      "description": "场景描述",
      "steps": ["步骤1", "步骤2"],
      "priority": "优先级 (high/medium/low)",
      "associatedRoutes": ["相关路由路径"]
    }
  ],
  "recommendations": [
    "测试建议1",
    "测试建议2"
  ]
}

重点关注：
1. 识别登录流程和认证机制，包括登录页面、登录方式和受保护的路由。
2. 找出主要的用户操作路径，并将其与具体的路由和组件关联起来。
3. 确定需要测试的关键功能，并为每个功能生成详细的测试场景。
4. 分析页面间的导航关系，特别是那些涉及认证和授权的页面。
5. 确保分析结果能够直接用于生成 Puppeteer 测试用例。
`;

    const result = await generateAIText(prompt, {
      temperature: 0.2,
      maxTokens: 3000
    });

    try {
      const analysis = parseCleanJSON(result.text);
      console.log('📊 Analysis completed');
      return analysis;
    } catch (error) {
      throw new Error(`Failed to parse analysis results: ${error.message}`);
    }
  }

  /**
   * 如果需要更多信息，生成补充工具调用
   */
  async generateSupplementaryTools(analysis, projectPath) {
    // 检查分析结果是否需要更多信息
    const needsMoreInfo = this.assessInformationGaps(analysis);
    
    if (!needsMoreInfo.hasGaps) {
      return null;
    }

    const prompt = `
基于当前分析结果，发现以下信息缺口：
${needsMoreInfo.gaps.join(', ')}

当前分析：
${JSON.stringify(analysis, null, 2)}

请生成补充的工具调用来获取缺失信息：
{
  "reasoning": "补充调用的原因",
  "tools": [
    {
      "name": "工具名称",
      "parameters": { "参数": "值" },
      "purpose": "调用目的"
    }
  ]
}
`;

    const result = await generateAIText(prompt, {
      temperature: 0.3,
      maxTokens: 1500
    });

    try {
      return JSON.parse(result.text);
    } catch (error) {
      console.warn('Failed to generate supplementary tools:', error.message);
      return null;
    }
  }

  /**
   * 评估信息缺口
   */
  assessInformationGaps(analysis) {
    const gaps = [];
    
    if (!analysis.authFlow || !analysis.authFlow.loginPage) {
      gaps.push('登录页面信息缺失');
    }
    
    if (!analysis.routes || analysis.routes.length === 0) {
      gaps.push('路由信息不完整');
    }
    
    if (!analysis.projectStructure || !analysis.projectStructure.framework) {
      gaps.push('项目框架信息缺失');
    }
    
    if (!analysis.testScenarios || analysis.testScenarios.length === 0) {
      gaps.push('测试场景信息不足');
    }

    return {
      hasGaps: gaps.length > 0,
      gaps
    };
  }
}

module.exports = Phase1Analysis;
