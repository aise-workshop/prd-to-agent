# Puppeteer UI 测试自动生成 AI Agent

实现一个 AI Agent，能够自动分析前端代码库并生成 Puppeteer UI 测试代码。

## 核心功能
1. **代码分析**：自动读取和分析前端项目的路由、组件和页面结构
2. **测试路径生成**：基于用户需求生成合理的测试路径（如：登录 → 列表 → 详情）
3. **DOM 选择器生成**：通过实际运行页面获取准确的 DOM 选择器
4. **测试代码生成**：输出可执行的 Puppeteer 测试脚本

## 练习阶段设计

### 阶段一：环境准备与基础工具搭建

#### 练习 1.1：项目初始化
**目标**：搭建基础开发环境

**提示词**：
```
你是一个前端测试自动化专家。请帮我：
1. 创建一个新的 Node.js 项目
2. 安装必要的依赖：puppeteer、ai、@ai-sdk/openai、fs-extra、glob、dotenv
3. 创建基础的目录结构：src/、test/、config/
4. 设置 .env 文件模板用于存储 API 密钥
5. 创建 package.json 脚本：start、test、dev

请提供完整的命令和文件内容。
```

**练习内容**：
- 执行项目初始化命令
- 配置开发环境
- 验证依赖安装

#### 练习 1.2：LLM 提供商配置
**目标**：实现多 LLM 提供商支持

**提示词**：
```
你是一个 AI 集成专家。请帮我实现一个 LLM 提供商配置函数，要求：
1. 支持 DeepSeek、GLM、OpenAI 三种提供商
2. 按优先级顺序检查环境变量
3. 返回标准化的配置对象
4. 包含错误处理和默认值

环境变量优先级：
- DEEPSEEK_TOKEN (优先)
- GLM_API_KEY 或 GLM_TOKEN
- OPENAI_API_KEY

请提供完整的配置函数代码。
```

**练习内容**：
- 编写配置函数
- 测试不同提供商
- 处理配置错误

### 阶段二：代码分析工具开发

#### 练习 2.1：文件扫描工具
**目标**：实现项目文件结构分析

**提示词**：
```
你是一个代码分析专家。请帮我实现一个文件扫描工具，功能包括：
1. 扫描项目根目录下的所有文件
2. 识别前端框架类型（React/Vue/Angular）
3. 提取关键文件：package.json、路由配置、组件文件
4. 生成项目结构报告

要求：
- 使用 fs-extra 和 glob 库
- 支持异步操作
- 返回结构化的分析结果
- 包含错误处理

请提供完整的实现代码。
```

**练习内容**：
- 实现文件扫描逻辑
- 测试不同项目结构
- 优化扫描性能

#### 练习 2.2：路由解析工具
**目标**：解析前端路由配置

**提示词**：
```
你是一个路由分析专家。请帮我实现一个路由解析工具，要求：
1. 支持多种路由配置格式：
   - React Router (BrowserRouter, Routes, Route)
   - Vue Router (createRouter, routes)
   - Angular Router (RouterModule.forRoot)
2. 提取路由路径、组件名称、是否需要认证
3. 生成标准化的路由对象数组
4. 处理嵌套路由和动态路由

输出格式：
```json
{
  "routes": [
    {
      "path": "/login",
      "component": "Login",
      "requiresAuth": false,
      "children": []
    }
  ]
}
```

请提供完整的解析逻辑。
```

**练习内容**：
- 实现路由解析器
- 测试不同框架
- 处理复杂路由结构

#### 练习 2.3：组件分析工具
**目标**：分析页面组件结构

**提示词**：
```
你是一个组件分析专家。请帮我实现一个组件分析工具，功能包括：
1. 解析 React/Vue 组件文件
2. 识别表单元素、按钮、链接等交互元素
3. 提取 data-testid、id、class 等选择器
4. 分析组件层级关系
5. 生成组件依赖图

要求：
- 使用 AST 解析或正则表达式
- 支持 JSX、TSX、Vue 单文件组件
- 识别常见的 UI 库组件
- 生成可读的分析报告

请提供完整的实现代码。
```

**练习内容**：
- 实现组件解析器
- 测试不同组件格式
- 优化解析准确性

### 阶段三：测试场景生成

#### 练习 3.1：用户故事分析
**目标**：基于用户需求生成测试场景

**提示词**：
```
你是一个测试场景设计专家。请帮我实现一个用户故事分析工具，功能包括：
1. 解析用户需求描述
2. 识别关键业务流程
3. 生成用户故事地图
4. 提取测试场景要点

输入示例：
"用户需要能够登录系统，查看商品列表，选择商品加入购物车，完成下单支付"

输出格式：
```json
{
  "userStories": [
    {
      "id": "US001",
      "title": "用户登录",
      "description": "作为用户，我希望能够登录系统",
      "acceptanceCriteria": [
        "输入正确的用户名和密码",
        "点击登录按钮",
        "成功跳转到首页"
      ],
      "testScenarios": [
        "正常登录流程",
        "错误密码处理",
        "空字段验证"
      ]
    }
  ]
}
```

请提供完整的分析逻辑。
```

**练习内容**：
- 实现需求解析
- 生成测试场景
- 优化场景覆盖度

#### 练习 3.2：测试路径生成
**目标**：基于路由和用户故事生成测试路径

**提示词**：
```
你是一个测试路径设计专家。请帮我实现一个测试路径生成工具，功能包括：
1. 结合路由信息和用户故事
2. 生成合理的测试路径序列
3. 考虑页面间的依赖关系
4. 优化路径长度和覆盖度

输入：
- 路由配置
- 用户故事列表
- 页面依赖关系

输出格式：
```json
{
  "testPaths": [
    {
      "id": "TP001",
      "name": "用户登录到下单完整流程",
      "description": "覆盖用户从登录到完成下单的完整业务流程",
      "steps": [
        {
          "step": 1,
          "action": "navigate",
          "url": "/login",
          "expected": "登录页面加载成功"
        },
        {
          "step": 2,
          "action": "input",
          "selector": "#username",
          "value": "testuser",
          "expected": "用户名输入成功"
        }
      ],
      "estimatedTime": "2分钟",
      "priority": "high"
    }
  ]
}
```

请提供完整的生成逻辑。
```

**练习内容**：
- 实现路径生成算法
- 测试不同场景
- 优化路径质量

### 阶段四：页面验证与选择器生成

#### 练习 4.1：页面可达性验证
**目标**：验证生成的测试路径是否可执行

**提示词**：
```
你是一个页面验证专家。请帮我实现一个页面可达性验证工具，功能包括：
1. 使用 Puppeteer 访问每个测试路径
2. 验证页面是否正常加载
3. 检查页面标题和关键元素
4. 记录页面加载时间
5. 生成验证报告

要求：
- 支持并发验证
- 超时处理
- 错误重试机制
- 详细的验证日志

输出格式：
```json
{
  "validationResults": [
    {
      "path": "/login",
      "status": "success",
      "loadTime": 1200,
      "title": "登录 - 系统名称",
      "keyElements": ["#username", "#password", "button[type='submit']"],
      "errors": [],
      "screenshot": "screenshots/login.png"
    }
  ]
}
```

请提供完整的验证逻辑。
```

**练习内容**：
- 实现页面验证
- 处理验证异常
- 优化验证性能

#### 练习 4.2：DOM 选择器生成
**目标**：生成稳定的 DOM 选择器

**提示词**：
```
你是一个 DOM 选择器专家。请帮我实现一个选择器生成工具，功能包括：
1. 分析页面 DOM 结构
2. 识别关键交互元素
3. 生成多种选择器策略：
   - data-testid (优先)
   - id 选择器
   - 语义化的 class 选择器
   - XPath 选择器
4. 验证选择器的唯一性和稳定性
5. 生成选择器优先级列表

要求：
- 使用 Puppeteer 的 evaluate 方法
- 考虑元素的可见性和可交互性
- 处理动态生成的元素
- 提供选择器回退方案

输出格式：
```json
{
  "selectors": {
    "username": {
      "primary": "#username",
      "fallback": "input[name='username']",
      "xpath": "//input[@name='username']",
      "confidence": 0.95
    },
    "loginButton": {
      "primary": "button[type='submit']",
      "fallback": ".login-btn",
      "xpath": "//button[contains(text(), '登录')]",
      "confidence": 0.90
    }
  }
}
```

请提供完整的生成逻辑。
```

**练习内容**：
- 实现选择器生成
- 测试选择器稳定性
- 优化选择器质量

### 阶段五：测试代码生成

#### 练习 5.1：Page Object 模式实现
**目标**：生成 Page Object 模式的测试代码

**提示词**：
```
你是一个测试代码生成专家。请帮我实现一个 Page Object 生成器，功能包括：
1. 为每个页面生成 Page Object 类
2. 包含页面元素选择器
3. 实现页面操作方法
4. 添加等待和断言逻辑
5. 生成 TypeScript 类型定义

要求：
- 使用 ES6 类语法
- 包含 JSDoc 注释
- 实现错误处理
- 支持链式调用
- 生成可读性强的代码

示例输出：
```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.selectors = {
      username: '#username',
      password: '#password',
      loginButton: 'button[type="submit"]',
      errorMessage: '.error-message'
    };
  }

  async navigate() {
    await this.page.goto('/login');
    await this.page.waitForSelector(this.selectors.username);
  }

  async login(username, password) {
    await this.page.fill(this.selectors.username, username);
    await this.page.fill(this.selectors.password, password);
    await this.page.click(this.selectors.loginButton);
  }

  async getErrorMessage() {
    return await this.page.textContent(this.selectors.errorMessage);
  }
}
```

请提供完整的生成逻辑。
```

**练习内容**：
- 实现 Page Object 生成
- 测试生成的代码
- 优化代码质量

#### 练习 5.2：测试用例生成
**目标**：生成完整的测试用例

**提示词**：
```
你是一个测试用例设计专家。请帮我实现一个测试用例生成器，功能包括：
1. 基于验证过的测试路径生成测试用例
2. 包含正向和异常测试场景
3. 实现数据驱动测试
4. 添加详细的测试描述和断言
5. 生成测试配置和辅助函数

要求：
- 使用 Jest 测试框架
- 包含 beforeEach/afterEach 钩子
- 实现测试数据管理
- 添加截图和日志功能
- 支持并行执行配置

示例输出：
```javascript
describe('用户登录流程', () => {
  let page;
  let loginPage;

  beforeEach(async () => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
  });

  afterEach(async () => {
    await page.close();
  });

  test('正常登录流程', async () => {
    await loginPage.navigate();
    await loginPage.login('testuser', 'password123');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.welcome-message')).toBeVisible();
  });

  test('错误密码处理', async () => {
    await loginPage.navigate();
    await loginPage.login('testuser', 'wrongpassword');
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('用户名或密码错误');
  });
});
```

请提供完整的生成逻辑。
```

**练习内容**：
- 实现测试用例生成
- 测试生成的用例
- 优化测试覆盖度

### 阶段六：AI Agent 集成

#### 练习 6.1：工具调用集成
**目标**：将各个工具集成到 AI Agent 中

**提示词**：
```
你是一个 AI Agent 集成专家。请帮我实现一个工具调用管理器，功能包括：
1. 定义工具调用接口
2. 实现工具注册机制
3. 处理工具调用请求
4. 管理工具执行结果
5. 实现错误处理和重试

工具列表：
- listFiles: 扫描项目文件
- readCode: 读取文件内容
- analyzeRoutes: 解析路由配置
- extractComponents: 分析组件结构
- generateTestPaths: 生成测试路径
- validatePages: 验证页面可达性
- generateSelectors: 生成 DOM 选择器
- generateTestCode: 生成测试代码

要求：
- 使用 MCP (Model Context Protocol) 标准
- 支持异步工具调用
- 实现工具调用链
- 提供详细的执行日志
- 支持工具调用缓存

请提供完整的集成逻辑。
```

**练习内容**：
- 实现工具管理器
- 测试工具调用
- 优化调用性能

#### 练习 6.2：Agent 工作流实现
**目标**：实现完整的 AI Agent 工作流

**提示词**：
```
你是一个 AI Agent 工作流专家。请帮我实现一个完整的工作流管理器，功能包括：
1. 定义工作流步骤
2. 实现步骤间数据传递
3. 处理工作流异常
4. 生成执行报告
5. 支持工作流暂停和恢复

工作流步骤：
1. 项目分析：扫描项目结构，识别框架类型
2. 路由解析：提取所有可用路由
3. 组件分析：分析页面组件结构
4. 场景生成：基于用户需求生成测试场景
5. 路径验证：验证测试路径的可达性
6. 选择器生成：生成稳定的 DOM 选择器
7. 代码生成：生成完整的测试代码
8. 报告生成：生成测试覆盖报告

要求：
- 支持步骤并行执行
- 实现步骤依赖管理
- 提供进度跟踪
- 支持工作流配置
- 生成详细的执行日志

请提供完整的工作流实现。
```

**练习内容**：
- 实现工作流管理器
- 测试完整流程
- 优化执行效率

## 环境配置

### 支持的 LLM 提供商
- **DeepSeek** (优先)：`DEEPSEEK_TOKEN`
- **GLM (智谱AI)**：`GLM_API_KEY` 或 `GLM_TOKEN`
- **OpenAI**：`OPENAI_API_KEY`

### 环境变量配置
```bash
# DeepSeek 配置
DEEPSEEK_TOKEN=your_deepseek_token
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# GLM 配置
GLM_API_KEY=your_glm_api_key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-air

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

## 使用指南

### 快速开始
```bash
# 1. 克隆项目
git clone <repository-url>
cd prd-to-agent

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 API 密钥

# 4. 运行 AI Agent
npm start -- --project-path /path/to/your/frontend/project
```

### 练习建议
1. **循序渐进**：按照练习阶段逐步实现，每个练习都要充分测试
2. **实际项目**：使用真实的前端项目进行练习，提高实用性
3. **代码质量**：注重代码可读性和可维护性
4. **错误处理**：每个工具都要包含完善的错误处理机制
5. **性能优化**：关注工具执行的性能，特别是网络请求和文件操作

### 扩展练习
- 支持更多前端框架（Svelte、Solid.js 等）
- 添加可视化测试报告生成
- 实现测试用例的自动优化
- 支持移动端测试生成
- 集成 CI/CD 流程

## 贡献指南
欢迎提交 Issue 和 Pull Request 来改进这个项目。请确保：
- 代码符合项目规范
- 包含必要的测试
- 更新相关文档
- 提供清晰的提交信息

