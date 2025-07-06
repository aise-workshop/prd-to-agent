const { createOpenAI } = require('@ai-sdk/openai');
const dotenv = require('dotenv');

dotenv.config();

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

  throw new Error('No LLM provider configured. Please set one of: DEEPSEEK_TOKEN, GLM_API_KEY, or OPENAI_API_KEY');
}

module.exports = { configureLLMProvider };