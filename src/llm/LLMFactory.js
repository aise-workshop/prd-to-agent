const DeepSeekLLM = require('./DeepSeekLLM');
const GLMLLM = require('./GLMLLM');
const OpenAILLM = require('./OpenAILLM');

class LLMFactory {
  static create(provider = null) {
    // If provider is specified, use it
    if (provider) {
      switch (provider.toLowerCase()) {
        case 'deepseek':
          return new DeepSeekLLM({});
        case 'glm':
          return new GLMLLM({});
        case 'openai':
          return new OpenAILLM({});
        default:
          throw new Error(`Unknown LLM provider: ${provider}`);
      }
    }

    // Auto-detect based on environment variables
    if (process.env.DEEPSEEK_TOKEN) {
      console.log('Using DeepSeek LLM provider');
      return new DeepSeekLLM({});
    }

    if (process.env.GLM_API_KEY) {
      console.log('Using GLM (智谱AI) LLM provider');
      return new GLMLLM({});
    }

    if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI LLM provider');
      return new OpenAILLM({});
    }

    throw new Error('No LLM provider configured. Please set DEEPSEEK_TOKEN, GLM_API_KEY, or OPENAI_API_KEY in your .env file');
  }
}

module.exports = LLMFactory;