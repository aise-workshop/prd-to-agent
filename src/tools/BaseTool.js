class BaseTool {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  getSchema() {
    throw new Error('getSchema method must be implemented by subclass');
  }

  async execute(params) {
    throw new Error('execute method must be implemented by subclass');
  }

  validate(params) {
    const schema = this.getSchema();
    const required = schema.required || [];
    
    for (const field of required) {
      if (!params[field]) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }

    return true;
  }
}

module.exports = BaseTool;