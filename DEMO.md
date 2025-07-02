# AI Puppeteer Test Generator - 演示指南

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd prd-to-agent

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 API Key
```

### 2. 启动演示应用

```bash
# 启动示例前端应用
cd examples/sample-frontend
npm install
npm start

# 应用将在 http://localhost:3000 启动
```

### 3. 运行 AI 测试生成器

```bash
# 返回项目根目录
cd ../../

# 运行默认演示
npm start

# 或者使用自定义参数
npm start -- --input "测试电商网站的完整购买流程" --project ./examples/sample-frontend --url http://localhost:3000
```

## 演示场景

### 场景 1: 电商网站基本流程测试

**用户需求**: "我需要测试一个电商网站的主要功能：用户登录、浏览商品列表、查看商品详情、添加到购物车的完整流程"

**预期结果**:
- 生成登录页面测试
- 生成商品列表页面测试
- 生成商品详情页面测试
- 生成购物车功能测试

### 场景 2: 用户注册流程测试

**用户需求**: "为我的网站生成用户注册和登录功能的自动化测试"

**预期结果**:
- 注册表单验证测试
- 登录功能测试
- 错误处理测试

## 生成的文件结构

```
generated-tests/
├── package.json                    # 测试项目配置
├── test-suite.js                   # 测试套件运行器
├── execution-summary.json          # 执行结果摘要
├── screenshots/                    # 浏览器截图
├── user_login_flow.test.js         # 用户登录测试
├── product_browsing.test.js        # 商品浏览测试
└── shopping_cart.test.js          # 购物车测试
```

## 测试生成的三个阶段

### 阶段一: 代码分析 🔍
- 扫描项目文件结构
- 分析路由配置
- 检测前端框架
- 生成初步测试计划

### 阶段二: 浏览器验证 🌐
- 启动 Puppeteer 浏览器
- 实际访问页面
- 验证 DOM 元素
- 截图保存
- 生成精确的选择器

### 阶段三: 代码生成 📝
- 基于验证结果生成测试代码
- 创建可执行的 Puppeteer 测试
- 生成测试套件
- 配置测试环境

## 运行生成的测试

```bash
# 进入生成的测试目录
cd generated-tests

# 安装依赖
npm install

# 运行所有测试
npm test

# 运行单个测试
npm run test:single user_login_flow.test.js

# 无头模式运行
npm run test:headless

# 调试模式运行
npm run test:debug
```

## 自定义配置

### 命令行参数

```bash
npm start -- --help

# 查看所有可用选项
npm start -- --input "你的测试需求" \
             --project /path/to/your/project \
             --url http://localhost:3000 \
             --output ./custom-tests
```

### 环境变量

```bash
# .env 文件配置
DEEPSEEK_TOKEN=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# 或者使用其他提供商
GLM_API_KEY=your_glm_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## 常见问题解决

### 1. API Key 错误
```bash
❌ No LLM provider configured
```
**解决方案**: 检查 .env 文件中的 API Key 配置

### 2. 端口冲突
```bash
❌ EADDRINUSE: address already in use :::3000
```
**解决方案**: 更换端口或关闭占用端口的进程

### 3. Puppeteer 启动失败
```bash
❌ Failed to launch browser
```
**解决方案**: 确保系统安装了 Chrome/Chromium

### 4. 网络连接问题
```bash
❌ Failed to navigate to URL
```
**解决方案**: 确保目标网站可以访问

## 高级特性

### 1. 并行执行测试
生成的测试支持并行执行，提高测试效率

### 2. 错误截图
测试失败时自动截图，便于问题诊断

### 3. 详细日志
提供详细的执行日志和错误信息

### 4. 自定义断言
支持自定义断言和验证逻辑

## 集成到 CI/CD

```yaml
# .github/workflows/test.yml
name: Auto Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run generate-tests
      - run: npm test
```

## 反馈和改进

如果你发现问题或有改进建议:
1. 查看 `execution-summary.json` 了解执行详情
2. 检查 `error-report.json` 查看错误信息
3. 提交 Issue 或 Pull Request

## 下一步计划

- [ ] 支持更多前端框架 (Angular, Svelte)
- [ ] 移动端测试支持
- [ ] 可视化测试报告
- [ ] 测试用例管理界面
- [ ] 性能测试集成