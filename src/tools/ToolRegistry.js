const FileSystemTool = require('./FileSystemTool');
const PuppeteerTool = require('./PuppeteerTool');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    this.register(new FileSystemTool());
    this.register(new PuppeteerTool());
  }

  register(tool) {
    this.tools.set(tool.name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  getAll() {
    return Array.from(this.tools.values());
  }

  getSchemas() {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.getSchema()
    }));
  }

  async execute(toolName, params) {
    const tool = this.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return await tool.execute(params);
  }

  async executeToolCalls(toolCalls) {
    const results = [];
    
    for (const call of toolCalls) {
      try {
        const result = await this.execute(call.name, call.arguments);
        results.push({
          id: call.id,
          name: call.name,
          result
        });
      } catch (error) {
        results.push({
          id: call.id,
          name: call.name,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async cleanup() {
    // Clean up resources, especially for PuppeteerTool
    const puppeteerTool = this.get('puppeteer');
    if (puppeteerTool) {
      await puppeteerTool.close();
    }
  }
}

module.exports = ToolRegistry;