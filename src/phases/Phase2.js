const chalk = require('chalk');
const ora = require('ora');

class Phase2 {
  constructor(llm, toolRegistry) {
    this.llm = llm;
    this.toolRegistry = toolRegistry;
  }

  async run(config, phase1Results) {
    console.log(chalk.blue('\n=== Phase 2: Test Validation & Refinement ===\n'));
    
    const { targetUrl, maxIterations = 3 } = config;
    const { testScenarios } = phase1Results;
    
    const validatedScenarios = [];
    
    for (const scenario of testScenarios) {
      console.log(chalk.yellow(`\nValidating scenario: ${scenario.name}`));
      
      const validated = await this.validateAndRefineScenario(
        scenario,
        targetUrl,
        maxIterations
      );
      
      validatedScenarios.push(validated);
    }
    
    return {
      ...phase1Results,
      validatedScenarios,
      validationResults: this.summarizeValidation(validatedScenarios)
    };
  }

  async validateAndRefineScenario(scenario, targetUrl, maxIterations) {
    let currentScenario = { ...scenario };
    let iteration = 0;
    const spinner = ora('Starting browser automation...').start();
    
    while (iteration < maxIterations) {
      iteration++;
      spinner.text = `Validation iteration ${iteration}/${maxIterations}`;
      
      const validationResult = await this.runValidation(currentScenario, targetUrl);
      
      if (validationResult.success) {
        spinner.succeed(`Scenario validated successfully`);
        currentScenario.validated = true;
        currentScenario.selectors = validationResult.selectors;
        currentScenario.screenshots = validationResult.screenshots;
        break;
      }
      
      spinner.info(`Refining scenario based on validation results...`);
      currentScenario = await this.refineScenario(
        currentScenario,
        validationResult
      );
    }
    
    if (!currentScenario.validated) {
      spinner.warn(`Scenario validation incomplete after ${maxIterations} iterations`);
    }
    
    return currentScenario;
  }

  async runValidation(scenario, targetUrl) {
    const messages = [
      {
        role: 'system',
        content: `You are a test automation expert. Validate the test scenario by:
1. Navigating to the target URL
2. Following the test steps
3. Capturing screenshots
4. Extracting UI elements and selectors
5. Verifying the scenario is executable`
      },
      {
        role: 'user',
        content: `Validate this test scenario at ${targetUrl}:

Scenario: ${scenario.name}
Description: ${scenario.description}

Steps:
${scenario.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Use the puppeteer tool to:
1. Navigate to the URL
2. Extract interactive elements
3. Try to follow the steps
4. Take screenshots of key states
5. Return validation results with accurate selectors`
      }
    ];

    const tools = this.toolRegistry.getSchemas();
    const validationResult = {
      success: false,
      selectors: {},
      screenshots: [],
      errors: []
    };

    let toolCallCount = 0;
    const maxToolCalls = 15;

    while (toolCallCount < maxToolCalls) {
      const response = await this.llm.chat(messages, tools);
      
      if (response.toolCalls) {
        toolCallCount += response.toolCalls.length;
        const toolResults = await this.toolRegistry.executeToolCalls(response.toolCalls);
        
        // Process tool results
        for (const result of toolResults) {
          if (result.name === 'puppeteer') {
            this.processValidationResult(result.result, validationResult);
          }
        }
        
        // Add to conversation
        messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.toolCalls
        });
        
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            tool_call_id: result.id,
            content: JSON.stringify(result.result)
          });
        }
      } else {
        // Parse final validation result
        validationResult.success = this.parseValidationSuccess(response.content);
        break;
      }
    }

    return validationResult;
  }

  async refineScenario(scenario, validationResult) {
    const messages = [
      {
        role: 'system',
        content: `You are a test automation expert. Refine the test scenario based on validation results.`
      },
      {
        role: 'user',
        content: `Refine this test scenario based on the validation results:

Original Scenario:
${JSON.stringify(scenario, null, 2)}

Validation Results:
${JSON.stringify(validationResult, null, 2)}

Improve the scenario by:
1. Updating steps to match actual UI
2. Adding accurate selectors
3. Fixing any errors found
4. Making steps more specific and actionable

Return the refined scenario in the same format.`
      }
    ];

    const response = await this.llm.chat(messages);
    return this.parseRefinedScenario(response.content, scenario);
  }

  processValidationResult(result, validationResult) {
    if (!result.success) {
      validationResult.errors.push(result.error);
      return;
    }

    switch (result.action) {
      case 'extract_elements':
        if (result.elements) {
          for (const element of result.elements) {
            if (element.attributes.id) {
              validationResult.selectors[element.attributes.id] = `#${element.attributes.id}`;
            } else if (element.attributes['data-testid']) {
              validationResult.selectors[element.attributes['data-testid']] = 
                `[data-testid="${element.attributes['data-testid']}"]`;
            }
          }
        }
        break;
      
      case 'screenshot':
        if (result.path) {
          validationResult.screenshots.push(result.path);
        }
        break;
    }
  }

  parseValidationSuccess(content) {
    // Check for success indicators in the response
    const successIndicators = [
      /validation\s+successful/i,
      /scenario\s+validated/i,
      /all\s+steps\s+completed/i,
      /successfully\s+executed/i
    ];

    return successIndicators.some(pattern => pattern.test(content));
  }

  parseRefinedScenario(content, originalScenario) {
    // Try to parse JSON first
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { ...originalScenario, ...parsed };
      }
    } catch (e) {
      // Fall back to structured parsing
    }

    const refined = { ...originalScenario };
    
    // Extract updated steps
    const stepsMatch = content.match(/steps[:\s]*([\s\S]*?)(?=expected|selectors|$)/i);
    if (stepsMatch) {
      refined.steps = stepsMatch[1]
        .split(/\n/)
        .filter(s => s.trim())
        .map(s => s.replace(/^\d+\.?\s*/, '').trim());
    }

    // Extract selectors
    const selectorsMatch = content.match(/selectors[:\s]*([\s\S]*?)(?=expected|$)/i);
    if (selectorsMatch) {
      try {
        refined.selectors = JSON.parse(selectorsMatch[1]);
      } catch (e) {
        // Parse line by line
        refined.selectors = {};
      }
    }

    return refined;
  }

  summarizeValidation(scenarios) {
    const total = scenarios.length;
    const validated = scenarios.filter(s => s.validated).length;
    const withSelectors = scenarios.filter(s => s.selectors && Object.keys(s.selectors).length > 0).length;
    
    return {
      total,
      validated,
      withSelectors,
      successRate: (validated / total) * 100
    };
  }
}

module.exports = Phase2;