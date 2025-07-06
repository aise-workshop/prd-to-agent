# 故障排除指南

## 常见问题和解决方案

### 1. AI 配置相关问题

#### 问题：`No LLM provider configured`
**原因：** 未正确配置 AI 提供商的 API 密钥。

**解决方案：**
```bash
# 检查环境变量是否正确设置
node src/index.js test

# 如果失败，重新配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加正确的 API 密钥
```

#### 问题：API 调用失败或超时
**原因：** 网络问题或 API 密钥无效。

**解决方案：**
1. 检查网络连接
2. 验证 API 密钥的有效性
3. 检查 API 配额是否用完
4. 尝试使用不同的 AI 提供商

### 2. 项目分析相关问题

#### 问题：`Cannot detect framework`
**原因：** 项目缺少 package.json 或依赖配置不标准。

**解决方案：**
```bash
# 确保项目根目录包含 package.json
ls -la your-project/package.json

# 检查是否包含框架依赖
cat your-project/package.json | grep -E "(react|vue|angular)"
```

#### 问题：路由分析结果为空
**原因：** 路由配置文件不在标准位置或使用了非标准的路由配置方式。

**解决方案：**
1. 检查路由文件是否存在：
   - React: `src/App.js`, `src/router.js`
   - Vue: `src/router/index.js`
   - Angular: `src/app-routing.module.ts`

2. 手动指定路由文件位置（修改配置）

#### 问题：组件提取结果不准确
**原因：** 代码中使用了动态选择器或组件命名不标准。

**解决方案：**
1. 确保组件使用标准的 JSX/Vue/Angular 语法
2. 添加 `data-testid` 属性到关键元素
3. 使用标准的 CSS 类名和 ID

### 3. 服务器和验证相关问题

#### 问题：`Failed to start development server`
**原因：** 项目无法正常启动或启动脚本配置错误。

**解决方案：**
```bash
# 手动测试项目是否能启动
cd your-project
npm install
npm start  # 或 npm run dev

# 检查 package.json 中的 scripts 配置
cat package.json | grep -A 5 "scripts"
```

#### 问题：`Server not ready after 60s`
**原因：** 服务器启动时间过长或端口被占用。

**解决方案：**
1. 检查端口占用情况：
   ```bash
   lsof -i :3000
   ```

2. 增加等待时间（修改 `TEST_TIMEOUT` 环境变量）

3. 使用 `--skip-validation` 跳过验证阶段

#### 问题：路由验证失败
**原因：** 路径不存在、需要认证或页面加载错误。

**解决方案：**
1. 手动访问路径确认是否可达
2. 检查是否需要登录才能访问
3. 查看页面是否存在 JavaScript 错误
4. 使用无头模式调试：`PUPPETEER_HEADLESS=false`

### 4. 代码生成相关问题

#### 问题：生成的测试代码语法错误
**原因：** AI 模型输出格式不正确或模板解析失败。

**解决方案：**
1. 检查生成的代码文件
2. 手动修复语法错误
3. 重新运行代码生成
4. 使用更稳定的 AI 模型

#### 问题：生成的选择器无效
**原因：** 页面结构发生变化或选择器提取不准确。

**解决方案：**
1. 手动验证选择器：
   ```javascript
   // 在浏览器控制台测试
   document.querySelector('#your-selector')
   ```

2. 使用更稳定的选择器策略：
   - 优先使用 `data-testid`
   - 使用 CSS 类名而不是标签选择器
   - 避免使用位置相关的选择器

### 5. 测试运行相关问题

#### 问题：生成的测试无法运行
**原因：** 依赖缺失或配置错误。

**解决方案：**
```bash
cd generated-tests
npm install
npm audit fix

# 检查 Playwright 安装
npx playwright install
```

#### 问题：测试执行超时
**原因：** 页面加载慢或等待策略不当。

**解决方案：**
1. 增加超时时间
2. 优化等待策略
3. 使用更具体的等待条件

### 6. 性能相关问题

#### 问题：分析或生成过程很慢
**原因：** 项目文件过多或 AI 调用频繁。

**解决方案：**
1. 使用 `.gitignore` 排除不必要的文件
2. 限制分析的文件范围
3. 使用更快的 AI 模型（如 `glm-4-air`）

#### 问题：内存使用过高
**原因：** 处理大型项目时内存溢出。

**解决方案：**
1. 分批处理文件
2. 增加 Node.js 内存限制：
   ```bash
   node --max-old-space-size=4096 src/index.js
   ```

## 调试技巧

### 1. 启用详细日志
```bash
# 设置环境变量启用调试模式
NODE_ENV=development node src/index.js generate your-project
```

### 2. 分阶段调试
```bash
# 只运行第一阶段
node src/index.js generate your-project --phase 1

# 跳过验证阶段
node src/index.js generate your-project --skip-validation
```

### 3. 查看中间结果
生成过程中的中间结果会保存在临时目录中，可以手动检查：
- 截图文件：`screenshots/`
- 分析结果：控制台输出
- 生成的代码：`generated-tests/`

### 4. 使用有头模式
```bash
# 在 .env 中设置
PUPPETEER_HEADLESS=false
```

## 获取帮助

### 1. 检查版本和依赖
```bash
node --version
npm --version
npm list
```

### 2. 运行集成测试
```bash
npm run integration-test
```

### 3. 查看详细错误信息
大多数错误都会包含详细的堆栈信息，请仔细阅读错误消息。

### 4. 常用检查命令
```bash
# 检查项目结构
find your-project -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | head -20

# 检查网络连接
curl -I https://api.deepseek.com/v1/chat/completions

# 检查端口占用
netstat -tulpn | grep :3000
```

如果以上方法都无法解决问题，请提供：
1. 错误的完整输出
2. 项目的基本信息（框架、版本等）
3. 环境配置（去除敏感信息）
4. 重现步骤