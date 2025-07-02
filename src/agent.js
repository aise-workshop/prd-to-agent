const { generateText } = require("ai");
const { configureLLMProvider } = require("./llm");
const { createTools } = require("./tools");

class Agent {
  constructor() {
    const llmProvider = configureLLMProvider();
    if (!llmProvider) {
      throw new Error("LLM provider not configured. Please set environment variables.");
    }
    this.llm = llmProvider.openai;
    this.fullModel = llmProvider.fullModel;
    this.tools = createTools();
  }

  async run(userInput) {
    console.log("Phase 1: Information Gathering");

    const phase1Prompt = `
      You are an AI agent that generates UI tests for a web application.
      The user wants to test the following scenario: "${userInput}".

      To get started, you need to understand the project structure and identify the relevant files.
      You have access to the following tools:
      - list_directory(path): Lists the files in a directory.
      - read_file(absolute_path): Reads the content of a file.

      Please use these tools to explore the project and gather the necessary information.
      Start by listing the files in the current directory.
    `;

    const { toolResults } = await generateText({
      model: this.llm(this.fullModel),
      prompt: phase1Prompt,
      tools: this.tools,
    });

    console.log("Tool results:", toolResults);

    // TODO: Implement Phase 2 and 3
  }
}

module.exports = { Agent };
