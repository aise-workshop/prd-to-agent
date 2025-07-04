const axios = require('axios');
const BaseLLM = require('./BaseLLM');

class DeepSeekLLM extends BaseLLM {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.DEEPSEEK_TOKEN;
    this.baseURL = config.baseURL || process.env.DEEPSEEK_BASE_URL;
    this.model = config.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  async chat(messages, tools = null) {
    const formattedTools = this.formatTools(tools);
    
    const payload = {
      model: this.model,
      messages: this.formatMessages(messages),
      temperature: 0.7,
      max_tokens: 4096
    };

    if (formattedTools) {
      payload.tools = formattedTools;
      payload.tool_choice = 'auto';
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const toolCalls = this.parseToolCalls(response.data);
      if (toolCalls) {
        return {
          content: response.data.choices[0].message.content || '',
          toolCalls
        };
      }

      return {
        content: response.data.choices[0].message.content,
        toolCalls: null
      };
    } catch (error) {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = DeepSeekLLM;