const chalk = require('chalk');

class Phase1 {
  constructor(llm, toolRegistry) {
    this.llm = llm;
    this.toolRegistry = toolRegistry;
  }

  async run(config) {
    console.log(chalk.blue('\n=== Phase 1: Code Analysis & Test Planning ===\n'));
    
    const { projectPath, userRequirement } = config;
    
    // Step 1: Analyze codebase
    console.log(chalk.yellow('Analyzing codebase structure...'));
    const codebaseAnalysis = await this.analyzeCodebase(projectPath);
    
    // Step 2: Generate test scenarios
    console.log(chalk.yellow('Generating test scenarios based on requirements...'));
    const testScenarios = await this.generateTestScenarios(
      userRequirement,
      codebaseAnalysis
    );
    
    return {
      codebaseAnalysis,
      testScenarios,
      projectPath
    };
  }

  async analyzeCodebase(projectPath) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert frontend developer and test engineer. 
Analyze the codebase and identify key components, routes, and architecture.
Use the file_system tool to explore the project structure.`
      },
      {
        role: 'user',
        content: `Analyze the frontend project at: ${projectPath}
1. Identify the framework (React, Vue, Angular, etc.)
2. Find main routes and navigation flows
3. Identify key components and pages
4. Understand the project structure`
      }
    ];

    const tools = this.toolRegistry.getSchemas();
    let analysis = null;
    let toolCallCount = 0;
    const maxToolCalls = 10;

    while (toolCallCount < maxToolCalls) {
      const response = await this.llm.chat(messages, tools);
      
      if (response.toolCalls) {
        toolCallCount += response.toolCalls.length;
        const toolResults = await this.toolRegistry.executeToolCalls(response.toolCalls);
        
        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.toolCalls
        });
        
        // Add tool results
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            tool_call_id: result.id,
            content: JSON.stringify(result.result)
          });
        }
      } else {
        // Final response with analysis
        analysis = this.parseAnalysis(response.content);
        break;
      }
    }

    return analysis || {
      framework: 'unknown',
      routes: [],
      components: [],
      structure: {}
    };
  }

  async generateTestScenarios(userRequirement, codebaseAnalysis) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert QA engineer specializing in UI test automation.
Generate comprehensive test scenarios based on user requirements and codebase analysis.`
      },
      {
        role: 'user',
        content: `Based on the following information, generate detailed test scenarios:

User Requirement: ${userRequirement}

Codebase Analysis:
${JSON.stringify(codebaseAnalysis, null, 2)}

Generate test scenarios that cover:
1. Happy paths
2. Edge cases
3. Error scenarios
4. User interactions
5. Navigation flows

Format each scenario with:
- Name
- Description
- Steps
- Expected results
- Required test data`
      }
    ];

    const response = await this.llm.chat(messages);
    return this.parseTestScenarios(response.content);
  }

  parseAnalysis(content) {
    // Basic parsing - in production, use more sophisticated parsing
    const analysis = {
      framework: null,
      routes: [],
      components: [],
      structure: {}
    };

    // Extract framework
    const frameworkMatch = content.match(/framework[:\s]+(react|vue|angular|next)/i);
    if (frameworkMatch) {
      analysis.framework = frameworkMatch[1].toLowerCase();
    }

    // Extract routes (simple pattern matching)
    const routeMatches = content.match(/route[s]?[:\s]+([^\n]+)/gi);
    if (routeMatches) {
      analysis.routes = routeMatches.map(m => m.replace(/route[s]?[:\s]+/i, '').trim());
    }

    // Extract components
    const componentMatches = content.match(/component[s]?[:\s]+([^\n]+)/gi);
    if (componentMatches) {
      analysis.components = componentMatches.map(m => m.replace(/component[s]?[:\s]+/i, '').trim());
    }

    return analysis;
  }

  parseTestScenarios(content) {
    const scenarios = [];
    
    // Split content into scenario blocks
    const scenarioBlocks = content.split(/(?=(?:Test )?Scenario\s*\d*[:\s])/i);
    
    for (const block of scenarioBlocks) {
      if (!block.trim()) continue;
      
      const scenario = {
        name: '',
        description: '',
        steps: [],
        expectedResults: [],
        testData: {}
      };

      // Extract scenario name
      const nameMatch = block.match(/(?:Test )?Scenario\s*\d*[:\s]*([^\n]+)/i);
      if (nameMatch) {
        scenario.name = nameMatch[1].trim();
      }

      // Extract description
      const descMatch = block.match(/Description[:\s]*([^\n]+)/i);
      if (descMatch) {
        scenario.description = descMatch[1].trim();
      }

      // Extract steps
      const stepsMatch = block.match(/Steps?[:\s]*([\s\S]*?)(?=Expected|Test Data|$)/i);
      if (stepsMatch) {
        scenario.steps = stepsMatch[1]
          .split(/\n/)
          .filter(s => s.trim())
          .map(s => s.replace(/^\d+\.?\s*/, '').trim());
      }

      // Extract expected results
      const expectedMatch = block.match(/Expected\s*(?:Results?)?[:\s]*([\s\S]*?)(?=Test Data|$)/i);
      if (expectedMatch) {
        scenario.expectedResults = expectedMatch[1]
          .split(/\n/)
          .filter(s => s.trim())
          .map(s => s.replace(/^\d+\.?\s*/, '').trim());
      }

      if (scenario.name || scenario.steps.length > 0) {
        scenarios.push(scenario);
      }
    }

    return scenarios;
  }
}

module.exports = Phase1;