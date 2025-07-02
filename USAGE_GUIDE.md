# Puppeteer Test Agent 使用指南

## 🎯 项目概述

这是一个基于 AI 的自动化 Puppeteer UI 测试生成工具，采用三阶段架构：

1. **阶段一**：代码分析和工具调用 - 分析前端项目结构、路由配置和认证流程
2. **阶段二**：测试用例生成和浏览器验证 - 生成测试用例并启动浏览器验证
3. **阶段三**：Puppeteer 代码生成 - 生成完整的可执行测试代码

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd prd-to-agent

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 LLM API 密钥
```

### 2. 配置 LLM 提供商

在 `.env` 文件中配置以下任一提供商：

```env
# 选项 1: GLM (智谱AI) - 推荐
GLM_API_KEY=your_glm_api_key

# 选项 2: DeepSeek
DEEPSEEK_TOKEN=your_deepseek_token

# 选项 3: OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 3. 运行演示

```bash
# 运行内置演示
node test-demo.js

# 或者运行完整示例（需要前端服务）
npm run example
```

## 📋 使用方法

### 命令行使用

```bash
node src/index.js "测试需求描述" "前端项目路径" "前端服务URL"
```

**示例：**
```bash
node src/index.js \
  "生成登录、主页导航和用户资料的完整测试流程" \
  "./my-react-app" \
  "http://localhost:3000"
```

### 编程接口使用

```javascript
const PuppeteerTestAgent = require('./src/index');

async function generateTests() {
  const agent = new PuppeteerTestAgent();
  
  const results = await agent.generateTests(
    "生成用户登录和主页导航的测试",
    "./my-frontend-project",
    "http://localhost:3000"
  );
  
  if (results.success) {
    console.log('测试生成成功！');
    console.log('输出目录：', results.phase3.outputDir);
  }
}
```

## 🔧 配置选项

### 支持的前端框架

- ✅ **React** (React Router) - 完全支持
- ✅ **Vue.js** (Vue Router) - 基础支持
- ✅ **Angular** - 基础支持

### LLM 提供商配置

| 提供商 | 环境变量 | 说明 |
|--------|----------|------|
| GLM (智谱AI) | `GLM_API_KEY` | 推荐使用，性价比高 |
| DeepSeek | `DEEPSEEK_TOKEN` | 代码理解能力强 |
| OpenAI | `OPENAI_API_KEY` | 通用性好，成本较高 |

### 高级配置

```env
# GLM 配置
GLM_API_KEY=your_api_key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4  # 可选
LLM_MODEL=glm-4-air                                # 可选

# DeepSeek 配置
DEEPSEEK_TOKEN=your_token
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1     # 可选
DEEPSEEK_MODEL=deepseek-chat                       # 可选

# OpenAI 配置
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1         # 可选
OPENAI_MODEL=gpt-4o-mini                           # 可选
```

## 📊 输出结果

生成的测试代码包含：

```
generated-tests/
├── tests/
│   ├── main.test.js        # 主测试文件
│   ├── auth.test.js        # 登录测试
│   ├── navigation.test.js  # 导航测试
│   └── business-flow.test.js # 业务流程测试
├── utils/
│   ├── page-utils.js       # 页面操作工具
│   ├── wait-utils.js       # 等待策略工具
│   ├── screenshot-utils.js # 截图工具
│   └── data-utils.js       # 测试数据工具
├── config/
│   ├── test.config.js      # 主配置文件
│   ├── selectors.js        # 选择器配置
│   ├── test-data.js        # 测试数据配置
│   └── jest.config.js      # Jest 配置
├── package.json            # 依赖配置
└── README.md              # 使用说明
```

## 🧪 运行生成的测试

```bash
cd generated-tests
npm install
npm test
```

## 🔍 故障排除

### 常见问题

1. **LLM 配置错误**
   ```
   Error: No LLM provider configured
   ```
   **解决方案**：检查 `.env` 文件中的 API 密钥配置

2. **浏览器启动失败**
   ```
   Error: Failed to launch browser
   ```
   **解决方案**：确保系统已安装 Chrome/Chromium

3. **前端服务无法访问**
   ```
   Error: Navigation timeout
   ```
   **解决方案**：确保前端服务正在运行且地址正确

4. **JSON 解析错误**
   ```
   Error: Failed to parse tool plan
   ```
   **解决方案**：这通常是 LLM 响应格式问题，已内置处理逻辑

### 调试技巧

1. **启用详细日志**
   ```bash
   DEBUG=true node src/index.js "测试需求" "项目路径" "前端URL"
   ```

2. **单独测试各阶段**
   ```javascript
   // 只测试阶段一
   const Phase1Analysis = require('./src/phases/phase1-analysis');
   const phase1 = new Phase1Analysis();
   const result = await phase1.execute(userInput, projectPath);
   ```

3. **检查生成的中间结果**
   - 查看 `screenshots/` 目录中的截图
   - 检查控制台输出的分析结果

## 💡 最佳实践

### 1. 项目准备
- 确保前端项目有清晰的路由结构
- 使用语义化的 CSS 类名和 data-testid 属性
- 保持登录流程简单明确

### 2. 需求描述
- 详细描述测试场景和用户操作流程
- 明确指出关键的业务逻辑
- 包含错误处理和边界情况

### 3. 测试优化
- 定期更新选择器配置
- 根据实际情况调整等待策略
- 添加自定义的测试数据

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
```bash
git clone <repository-url>
cd prd-to-agent
npm install
npm run test
```

### 代码结构
- `src/config/` - 配置文件
- `src/tools/` - MCP 工具管理
- `src/phases/` - 三阶段实现
- `src/utils/` - 通用工具函数

## 📄 许可证

ISC License - 详见 LICENSE 文件
