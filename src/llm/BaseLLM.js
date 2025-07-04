class BaseLLM {
  constructor(config) {
    this.config = config;
  }

  async chat(messages, tools = null) {
    throw new Error('chat method must be implemented by subclass');
  }

  formatMessages(messages) {
    return messages;
  }

  formatTools(tools) {
    if (!tools || tools.length === 0) return null;
    
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  parseToolCalls(response) {
    if (!response.choices?.[0]?.message?.tool_calls) {
      return null;
    }

    return response.choices[0].message.tool_calls.map(call => ({
      id: call.id,
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments)
    }));
  }
}

module.exports = BaseLLM;