# AI Agent for Puppeteer UI Test Generation

An intelligent AI agent that automatically generates Puppeteer UI tests based on frontend code analysis and user requirements.

## Features

- **🔍 Code Analysis**: Automatically analyzes frontend codebases to identify routes, components, and architecture
- **🎯 Smart Test Planning**: Generates comprehensive test scenarios based on user requirements
- **🤖 Browser Automation**: Uses Puppeteer to validate test scenarios and extract UI elements
- **⚡ Test Generation**: Creates production-ready Puppeteer test code with Jest integration
- **🔧 Multi-LLM Support**: Supports DeepSeek, GLM (智谱AI), and OpenAI providers
- **🛠 Tool Integration**: Built-in tools for filesystem operations and browser automation

## Architecture

The system operates in three phases:

### Phase 1: Code Analysis & Test Planning
- Analyzes frontend codebase structure and routes
- Identifies key components and navigation flows
- Generates initial test scenarios based on user requirements
- Uses intelligent tool calling for comprehensive code understanding

### Phase 2: Test Validation & Refinement
- Launches browser automation to validate test scenarios
- Captures screenshots and extracts UI element information
- Iteratively refines test scenarios based on validation results
- Improves selector accuracy and test reliability

### Phase 3: Test Code Generation
- Generates production-ready Puppeteer test code
- Creates page object models and test utilities
- Includes Jest configuration and test data management
- Provides comprehensive documentation and usage instructions

## Installation

```bash
npm install
```

## Configuration

Copy the environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your API credentials:

```env
# DeepSeek Configuration (Primary)
DEEPSEEK_TOKEN=your_deepseek_token_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# GLM Configuration (智谱AI)
GLM_API_KEY=your_glm_api_key_here
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-air

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# Application Configuration
TARGET_URL=http://localhost:3000
PUPPETEER_HEADLESS=true
TEST_OUTPUT_DIR=./generated-tests
```

## Usage

### Command Line Interface

```bash
# Full generation process
node src/index.js --requirement "Test login and dashboard flow" --url http://localhost:3000

# Quick generation without validation
node src/index.js --mode quick --requirement "Test user registration"

# Analyze codebase only
node src/index.js --mode analyze --requirement "Analyze routes and components"

# Custom project path
node src/index.js --project /path/to/your/frontend --requirement "Test e-commerce flow"
```

### Programmatic Usage

```javascript
const { UITestGenerator } = require('./src/index');

const generator = new UITestGenerator();

const results = await generator.run({
  mode: 'full',
  projectPath: '/path/to/your/frontend/project',
  userRequirement: 'Test the complete user login flow',
  targetUrl: 'http://localhost:3000',
  maxIterations: 3
});

console.log('Generated tests:', results.phase3.testFiles);
```

## CLI Options

- `--mode <mode>`: Generation mode (full, quick, analyze, validate)
- `--project <path>`: Path to frontend project
- `--url <url>`: Target URL for testing
- `--requirement <text>`: User requirement description
- `--iterations <number>`: Max validation iterations
- `--output <path>`: Output directory

## Generated Output

The system generates:

- **Main test suite** (`ui-tests.test.js`)
- **Page object models** (`page-objects/`)
- **Test utilities** (`test-helpers.js`)
- **Test configuration** (`jest.config.js`)
- **Test data** (`test-data.json`)
- **Documentation** (`README.md`)

## Examples

### React Application
```javascript
await generator.run({
  mode: 'full',
  projectPath: '/path/to/react/app',
  userRequirement: `
    Test the e-commerce flow:
    1. User registration and login
    2. Browse products and add to cart
    3. Checkout process
    4. Order confirmation
  `,
  targetUrl: 'http://localhost:3000'
});
```

### Vue.js Application
```javascript
await generator.run({
  mode: 'full',
  projectPath: '/path/to/vue/app',
  userRequirement: `
    Test the admin dashboard:
    1. Admin login
    2. User management operations
    3. Settings configuration
  `,
  targetUrl: 'http://localhost:8080'
});
```

## Supported Frameworks

- ✅ React
- ✅ Vue.js
- ✅ Angular
- ✅ Next.js
- ✅ Generic HTML/JS applications

## LLM Provider Support

The system prioritizes providers in this order:
1. **DeepSeek** (if `DEEPSEEK_TOKEN` is set)
2. **GLM (智谱AI)** (if `GLM_API_KEY` is set)
3. **OpenAI** (if `OPENAI_API_KEY` is set)

## Tool System

Built-in tools include:
- **FileSystem Tool**: Code analysis and file operations
- **Puppeteer Tool**: Browser automation and UI element extraction
- **Tool Registry**: Extensible tool management system

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
