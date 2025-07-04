# Puppeteer UI 测试自动生成 AI Agent

## 项目目标
实现一个 AI Agent，能够自动分析前端代码库并生成 Puppeteer UI 测试代码。

## 核心功能
1. **代码分析**：自动读取和分析前端项目的路由、组件和页面结构
2. **测试路径生成**：基于用户需求生成合理的测试路径（如：登录 → 列表 → 详情）
3. **DOM 选择器生成**：通过实际运行页面获取准确的 DOM 选择器
4. **测试代码生成**：输出可执行的 Puppeteer 测试脚本

## 实现方案

### 第一阶段：代码分析与工具调用
**目标**：分析前端代码库，提取关键信息

**任务**：
1. 扫描项目结构，识别框架类型（React/Vue/Angular）
2. 解析路由配置文件，提取所有可用路由
3. 分析页面组件，识别关键交互元素
4. 生成初步的测试覆盖方案

**工具集成**：
- 使用 MCP (Model Context Protocol) 管理工具：https://github.com/modelcontextprotocol/typescript-sdk
- 实现基础工具：`listFiles`、`readCode`、`analyzeRoutes`、`extractComponents`

**输出格式**：
```json
{
  "framework": "react|vue|angular",
  "routes": [{"path": "/login", "component": "Login", "requiresAuth": false}],
  "components": [{"name": "LoginForm", "selectors": ["#username", "#password"]}],
  "testStrategy": "登录优先，覆盖主要业务流程"
}
```

### 第二阶段：测试路径验证与优化
**目标**：生成并验证可执行的测试路径

**任务**：
1. 基于用户需求生成 3-5 个核心测试场景
2. 启动本地开发服务器（自动检测端口）
3. 使用 Puppeteer 访问每个路径，验证可达性
4. 捕获实际 DOM 结构，生成稳定的选择器
5. 记录页面加载时间和关键性能指标

**重试机制**：
- 最多重试 3 次，每次优化选择器策略
- 将执行结果反馈给模型进行调整

**输出格式**：
```json
{
  "scenarios": [
    {
      "name": "用户登录流程",
      "steps": [
        {"action": "navigate", "url": "/login"},
        {"action": "type", "selector": "#username", "value": "testuser"},
        {"action": "click", "selector": "button[type='submit']"},
        {"action": "waitForNavigation", "expectedUrl": "/dashboard"}
      ],
      "validated": true
    }
  ]
}
```

### 第三阶段：测试代码生成
**目标**：生成生产级的 Puppeteer 测试代码

**任务**：
1. 基于验证过的测试路径生成完整测试套件
2. 包含必要的错误处理和断言
3. 支持数据驱动测试（参数化）
4. 生成配置文件和辅助函数

**代码特性**：
- 使用 Page Object Model 模式
- 包含截图和日志功能
- 支持并行执行
- 集成 CI/CD 配置示例

## 环境配置
- 模型密钥存储在 `.env` 文件中（如 `DEEPSEEK_TOKEN`）
- 支持多种 LLM 提供商（DeepSeek、GLM、OpenAI）


如下是调用 AI SDK 的代码

```
const ai = require('ai');
const aiSdkOpenai = require('@ai-sdk/openai');
generateText = ai.generateText;
createOpenAI = aiSdkOpenai.createOpenAI;

function configureLLMProvider() {
  // DeepSeek Provider (Prioritized)
  if (process.env.DEEPSEEK_TOKEN) {
    const openai = createOpenAI({
      compatibility: "compatible",
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_TOKEN,
    });

    return {
      fullModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      quickModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      openai,
      providerName: "DeepSeek"
    };
  }

  // GLM Provider (智谱AI)
  if (process.env.GLM_API_KEY || process.env.GLM_TOKEN) {
    const apiKey = process.env.GLM_API_KEY || process.env.GLM_TOKEN;
    const openai = createOpenAI({
      compatibility: "compatible",
      baseURL: process.env.LLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
      apiKey: apiKey,
    });

    return {
      fullModel: process.env.LLM_MODEL || "glm-4-air",
      quickModel: process.env.LLM_MODEL || "glm-4-air",
      openai,
      providerName: "GLM"
    };
  }

  // OpenAI Provider
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      compatibility: "strict",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    return {
      fullModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      quickModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      openai,
      providerName: "OpenAI"
    };
  }

  return null;
}
```
