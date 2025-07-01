# prd-to-agent

我正在实现一个 AI Agent，它可以根据用户的需求（结合读取前端代码和路由）自动生成 puppeteer 的 UI 测试。我希望你能参考你（Augment）的实现，帮我实现这个 AI Agent。你需要：

- 做一些搜索，看看现在的方案合理不合理
- 实现对应的方案

我初步设想的步骤是：

- 读取前端代码库的路由等信息，生成初步的测试步骤和方案，比如哪里登录等信息
- 根据用户的需求生成不同的几个业务测试路径作为参考，比如首页 -> 列表 -> 详情
- 启动对应的前端服务，然后跳转到对应的登陆页面，自动化抓取 HTML 进行测试 DOM path 的生成
- 根据测试路径和 PATH，生成代码。

我预期的调用模型的方案是三个阶段的：

阶段一，根据用户的输入和代码，生成工具调用（参考你的实现，可以使用 xml + json，或者纯 json 方式）。我的 AI Agent （Augment）和你一样有几个基本的工具（列出路径、读取代码等），可以考虑使用 MCP 作为工具管理：https://github.com/modelcontextprotocol/typescript-sdk
如果工具信息不够，可以再调用一次工具

阶段二，根据调用结果，生成测试用例和路径等信息，再启动浏览器看看能否正常执行。可以重复三次，需要把前面的结果发给模型确认

阶段三，生成对应的 puppeeer 测试代码给用户。


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
