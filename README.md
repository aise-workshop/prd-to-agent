# AI Puppeteer Test Generator

🤖 一个智能的 Puppeteer UI 测试生成器，可以根据用户需求和前端代码自动生成完整的端到端测试。

## ✨ 功能特性

- **🔍 智能代码分析**: 自动分析前端项目结构、路由和框架
- **🌐 浏览器验证**: 实际启动浏览器验证页面和DOM元素
- **📝 代码生成**: 生成完整可执行的 Puppeteer 测试代码
- **🎯 多框架支持**: 支持 React、Vue、Angular 等主流前端框架
- **🔧 多 AI 模型**: 支持 DeepSeek、GLM、OpenAI 等多个 AI 提供商
- **📊 详细报告**: 生成执行摘要和错误报告

## 🚀 快速开始

### 1. 安装依赖

```bash
git clone <repository-url>
cd prd-to-agent
npm install
```

### 2. 配置环境

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 API Key
DEEPSEEK_TOKEN=your_deepseek_api_key_here
# 或者使用其他提供商
# GLM_API_KEY=your_glm_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 运行演示

```bash
# 启动示例应用（新终端）
cd examples/sample-frontend
npm install && npm start

# 运行测试生成器（项目根目录）
npm start
```

## 📖 使用方法

### 基本用法

```bash
# 使用默认配置
npm start

# 自定义参数
npm start -- --input "测试电商网站登录和购买流程" \
             --project ./my-frontend-project \
             --url http://localhost:3000 \
             --output ./my-tests
```

### 命令行参数

- `-i, --input`: 测试需求描述
- `-p, --project`: 前端项目路径
- `-u, --url`: 应用的基础URL
- `-o, --output`: 测试输出目录
- `-h, --help`: 显示帮助信息

## 🏗️ 三阶段架构

### 阶段一：代码分析 🔍
- 扫描项目文件和路由结构
- 检测前端框架类型
- 分析登录认证方式
- 生成初步测试计划

### 阶段二：浏览器验证 🌐
- 启动 Puppeteer 浏览器
- 实际访问和验证页面
- 提取准确的 DOM 选择器
- 生成页面截图
- 精化测试用例

### 阶段三：代码生成 📝
- 基于验证结果生成测试代码
- 创建完整的测试套件
- 生成项目配置文件
- 提供运行脚本

## 📁 生成的文件结构

```
generated-tests/
├── package.json                    # 测试项目配置
├── test-suite.js                   # 测试套件运行器
├── execution-summary.json          # 执行结果摘要
├── screenshots/                    # 页面截图
├── user_login_flow.test.js         # 登录流程测试
├── product_browsing.test.js        # 商品浏览测试
└── shopping_cart.test.js          # 购物车测试
```

## 🎯 支持的测试场景

- ✅ 用户注册和登录流程
- ✅ 页面导航和路由测试
- ✅ 表单填写和提交
- ✅ 商品浏览和搜索
- ✅ 购物车操作
- ✅ 响应式布局验证
- ✅ 错误处理测试

## 🔧 配置选项

### 环境变量

```bash
# AI 模型配置
DEEPSEEK_TOKEN=your_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# 其他提供商
GLM_API_KEY=your_glm_key
OPENAI_API_KEY=your_openai_key

# 运行配置
NODE_ENV=development
DEBUG=false
```

### 支持的框架

- React (Create React App, Next.js)
- Vue (Vue CLI, Nuxt.js)
- Angular
- Vanilla JavaScript
- 其他基于路由的SPA应用

## 🧪 运行生成的测试

```bash
cd generated-tests
npm install
npm test                 # 运行所有测试
npm run test:headless   # 无头模式运行
npm run test:debug      # 调试模式运行
```

## 📊 测试报告

系统会生成详细的执行报告：
- `execution-summary.json`: 完整的执行摘要
- `error-report.json`: 错误详情（如果有）
- 页面截图保存在 `screenshots/` 目录

## 🔗 API 集成

支持多个 AI 提供商：

1. **DeepSeek** (推荐)
2. **GLM (智谱AI)**
3. **OpenAI**

API 配置优先级：DEEPSEEK_TOKEN > GLM_API_KEY > OPENAI_API_KEY

## 🐛 常见问题

### Q: API Key 错误
**A**: 检查 `.env` 文件中的 API Key 配置是否正确

### Q: 浏览器启动失败
**A**: 确保系统安装了 Chrome/Chromium

### Q: 端口占用
**A**: 更换端口或关闭占用端口的进程

### Q: 网络连接问题
**A**: 确保目标网站可以正常访问

## 🚀 高级特性

- **并行执行**: 支持并行运行测试，提高效率
- **错误截图**: 测试失败时自动截图
- **自定义断言**: 支持复杂的验证逻辑
- **CI/CD 集成**: 可轻松集成到持续集成流程

## 📈 路线图

- [ ] 支持移动端测试
- [ ] 可视化测试报告
- [ ] 测试用例管理界面
- [ ] 性能测试集成
- [ ] 更多框架支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请查看：
- [演示指南](./DEMO.md)
- [架构文档](./ARCHITECTURE.md)
- [GitHub Issues](./issues)
