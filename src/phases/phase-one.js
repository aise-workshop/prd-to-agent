import { generateText } from '../utils/llm-provider.js';
import { FileTools } from '../tools/file-tools.js';

export class PhaseOne {
  constructor(llmProvider) {
    this.llmProvider = llmProvider;
  }

  async execute(userInput, projectPath) {
    try {
      // Step 1: Analyze project structure
      console.log('🔍 Analyzing project structure...');
      const projectAnalysis = await FileTools.analyzeProject(projectPath);
      
      // Step 2: Read key files
      console.log('📁 Reading key files...');
      const keyFiles = {};
      for (const routeFile of projectAnalysis.routeFiles.slice(0, 5)) {
        try {
          const fullPath = `${projectPath}/${routeFile}`;
          keyFiles[routeFile] = await FileTools.readFile(fullPath);
        } catch (error) {
          console.warn(`Failed to read ${routeFile}: ${error.message}`);
        }
      }

      // Step 3: Generate tool calls using LLM
      console.log('🤖 Generating analysis and tool calls...');
      const analysisPrompt = this.buildAnalysisPrompt(userInput, projectAnalysis, keyFiles);
      
      const result = await generateText({
        model: this.llmProvider.openai(this.llmProvider.fullModel),
        prompt: analysisPrompt,
        temperature: 0.3
      });

      // Step 4: Parse the result and extract structured information
      const analysis = this.parseAnalysisResult(result.text);
      
      return {
        success: true,
        projectAnalysis,
        keyFiles,
        analysis,
        rawLLMResponse: result.text
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildAnalysisPrompt(userInput, projectAnalysis, keyFiles) {
    return `你是一个专业的前端测试分析师。请根据用户需求和项目代码分析，生成结构化的测试计划。

用户需求：
${userInput}

项目信息：
- 框架：${projectAnalysis.framework}
- 路由文件数量：${projectAnalysis.routeFiles.length}
- 总文件数量：${projectAnalysis.allFiles.length}

主要路由文件内容：
${Object.entries(keyFiles).map(([file, content]) => `
文件：${file}
内容预览：
\`\`\`
${content.slice(0, 1000)}...
\`\`\`
`).join('\n')}

请分析并提供以下JSON格式的结果：

{
  "analysis": {
    "framework": "检测到的框架",
    "mainRoutes": ["主要路由路径"],
    "authenticationMethod": "认证方式分析",
    "keyPages": ["关键页面列表"]
  },
  "testPlan": {
    "loginFlow": {
      "required": true/false,
      "loginUrl": "登录页面URL",
      "loginSelectors": {
        "usernameField": "用户名输入框选择器",
        "passwordField": "密码输入框选择器", 
        "submitButton": "提交按钮选择器"
      }
    },
    "testScenarios": [
      {
        "name": "测试场景名称",
        "description": "场景描述",
        "steps": ["步骤1", "步骤2", "步骤3"],
        "expectedPages": ["期望访问的页面"]
      }
    ]
  },
  "recommendations": [
    "建议1",
    "建议2"
  ]
}

注意：
1. 仔细分析路由文件中的页面结构
2. 识别是否需要登录认证
3. 根据用户需求设计合理的测试场景
4. 提供具体的DOM选择器建议`;
  }

  parseAnalysisResult(llmResponse) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create a basic structure
      return {
        analysis: {
          framework: "unknown",
          mainRoutes: [],
          authenticationMethod: "unknown",
          keyPages: []
        },
        testPlan: {
          loginFlow: {
            required: false,
            loginUrl: "",
            loginSelectors: {}
          },
          testScenarios: []
        },
        recommendations: ["需要更详细的项目分析"]
      };
    } catch (error) {
      console.warn('Failed to parse LLM response as JSON:', error.message);
      return {
        analysis: {
          framework: "unknown",
          mainRoutes: [],
          authenticationMethod: "unknown", 
          keyPages: []
        },
        testPlan: {
          loginFlow: {
            required: false,
            loginUrl: "",
            loginSelectors: {}
          },
          testScenarios: []
        },
        recommendations: ["JSON解析失败，请检查LLM响应格式"],
        rawResponse: llmResponse
      };
    }
  }
}