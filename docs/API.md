# API 文档

## 核心类和模块

### 1. FileAnalyzer 类

负责分析前端项目的文件结构和代码内容。

#### 主要方法

##### `listFiles(projectPath, patterns)`
列出项目中的所有相关文件。

**参数：**
- `projectPath`: 项目路径
- `patterns`: 文件匹配模式数组（可选）

**返回：** 文件路径数组

##### `detectFramework(projectPath)`
检测项目使用的前端框架。

**参数：**
- `projectPath`: 项目路径

**返回：** 框架名称 ('react' | 'vue' | 'angular')

##### `analyzeRoutes(projectPath)`
分析项目中的路由配置。

**参数：**
- `projectPath`: 项目路径

**返回：** 路由对象数组
```javascript
[
  {
    path: '/login',
    component: 'Login',
    requiresAuth: false,
    sourceFile: 'src/App.js'
  }
]
```

##### `extractComponents(projectPath)`
提取项目中的组件信息。

**参数：**
- `projectPath`: 项目路径

**返回：** 组件对象数组
```javascript
[
  {
    name: 'LoginForm',
    selectors: ['#username', '#password', '.login-btn'],
    sourceFile: 'src/components/LoginForm.js'
  }
]
```

### 2. PuppeteerValidator 类

负责验证路由可达性和提取 DOM 选择器。

#### 主要方法

##### `initialize()`
初始化 Puppeteer 浏览器实例。

##### `startDevServer(projectPath)`
启动开发服务器。

**参数：**
- `projectPath`: 项目路径

**返回：** Promise<boolean>

##### `validateRoutes(routes)`
验证路由列表的可达性。

**参数：**
- `routes`: 路由对象数组

**返回：** 验证结果数组
```javascript
[
  {
    path: '/login',
    valid: true,
    title: 'Login Page',
    selectors: ['#username', '#password'],
    loadTime: 1234
  }
]
```

##### `generateTestScenarios(validatedRoutes, userRequirement)`
基于验证过的路由生成测试场景。

**参数：**
- `validatedRoutes`: 验证过的路由数组
- `userRequirement`: 用户需求描述

**返回：** 测试场景数组

### 3. CodeGenerator 类

负责生成测试代码。

#### 主要方法

##### `generateTestSuite(validationResult, analysis, userRequirement)`
生成完整的测试套件。

**参数：**
- `validationResult`: 验证结果
- `analysis`: 代码分析结果
- `userRequirement`: 用户需求

**返回：** 测试套件对象
```javascript
{
  pageObjects: [...],
  testCases: [...],
  helpers: [...],
  config: {...}
}
```

##### `saveTestSuite(testSuite, outputPath)`
保存测试套件到文件系统。

**参数：**
- `testSuite`: 测试套件对象
- `outputPath`: 输出路径

**返回：** 输出目录路径

### 4. Phase1Analyzer 类

第一阶段：代码分析器。

#### 主要方法

##### `analyzeProject(projectPath, userRequirement)`
分析项目并生成测试策略。

**参数：**
- `projectPath`: 项目路径
- `userRequirement`: 用户需求

**返回：** 分析结果对象

### 5. Phase2Validator 类

第二阶段：路径验证器。

#### 主要方法

##### `validateAndOptimize(projectPath, analysis, userRequirement)`
验证路径并优化测试场景。

**参数：**
- `projectPath`: 项目路径
- `analysis`: 第一阶段分析结果
- `userRequirement`: 用户需求

**返回：** 验证结果对象

### 6. Phase3Generator 类

第三阶段：代码生成器。

#### 主要方法

##### `generateTestCode(validationResult, analysis, userRequirement, outputPath)`
生成最终的测试代码。

**参数：**
- `validationResult`: 第二阶段验证结果
- `analysis`: 第一阶段分析结果
- `userRequirement`: 用户需求
- `outputPath`: 输出路径

**返回：** 生成结果对象

## 配置选项

### LLM 配置

通过环境变量配置 AI 提供商：

```bash
# DeepSeek（推荐）
DEEPSEEK_TOKEN=your_token
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# GLM（智谱AI）
GLM_API_KEY=your_api_key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-air

# OpenAI
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 测试配置

```bash
# 测试基础 URL
TEST_BASE_URL=http://localhost:3000

# 测试超时时间（毫秒）
TEST_TIMEOUT=30000

# Puppeteer 无头模式
PUPPETEER_HEADLESS=true
```

## 错误处理

### 常见错误

1. **LLM 配置错误**
   - 错误信息：`No LLM provider configured`
   - 解决方案：检查环境变量配置

2. **项目路径不存在**
   - 错误信息：`Project path does not exist`
   - 解决方案：确认项目路径正确

3. **框架检测失败**
   - 错误信息：`Cannot detect framework`
   - 解决方案：确保 package.json 包含框架依赖

4. **服务器启动失败**
   - 错误信息：`Failed to start development server`
   - 解决方案：检查项目是否可以正常启动

### 重试机制

- 路由验证失败时，系统会自动重试最多 3 次
- 每次重试会尝试优化选择器策略
- AI 调用失败时会使用默认回退方案

## 扩展开发

### 添加新的框架支持

1. 在 `src/config/index.js` 中添加框架配置
2. 在 `FileAnalyzer` 类中实现对应的解析方法
3. 更新框架检测逻辑

### 自定义代码模板

1. 在 `src/templates/` 目录下添加新模板
2. 在 `CodeGenerator` 类中引用模板
3. 实现模板变量替换逻辑

### 添加新的测试框架

目前支持 Playwright，可以扩展支持：
- Jest + Puppeteer
- Cypress
- WebDriver

通过修改 `CodeGenerator` 类的模板生成逻辑即可。