const PuppeteerTestAgent = require('./src/index');
require('dotenv').config();

/**
 * 示例：使用 AI Agent 生成 Puppeteer 测试
 */
async function runExample() {
  console.log('🚀 Running Puppeteer Test Agent Example...\n');
  
  // 创建 Agent 实例
  const agent = new PuppeteerTestAgent();
  
  // 示例配置
  const userInput = `
我需要为我的 React 应用生成 UI 测试。主要测试场景包括：
1. 用户登录流程 - 从登录页面输入用户名密码，点击登录按钮
2. 主页导航 - 登录后跳转到主页，验证导航菜单
3. 用户资料页面 - 点击用户资料链接，查看和编辑个人信息
4. 退出登录 - 点击退出按钮，返回登录页面

请生成完整的测试用例，包括错误处理和边界情况测试。
  `.trim();
  
  const projectPath = './demo-project'; // 示例项目路径
  const frontendUrl = 'http://localhost:3000'; // 前端服务地址
  
  try {
    // 执行测试生成
    const results = await agent.generateTests(userInput, projectPath, frontendUrl);
    
    if (results.success) {
      console.log('\n✅ Example completed successfully!');
      console.log('\nGenerated files can be found in:', results.phase3.outputDir);
    } else {
      console.error('\n❌ Example failed:', results.error);
    }
    
    return results;
  } catch (error) {
    console.error('\n💥 Example crashed:', error.message);
    throw error;
  }
}

/**
 * 创建演示项目结构
 */
async function createDemoProject() {
  const fs = require('fs').promises;
  const path = require('path');
  
  const demoDir = './demo-project';
  
  try {
    // 创建目录结构
    await fs.mkdir(demoDir, { recursive: true });
    await fs.mkdir(path.join(demoDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(demoDir, 'src', 'components'), { recursive: true });
    await fs.mkdir(path.join(demoDir, 'src', 'pages'), { recursive: true });
    
    // 创建示例文件
    const packageJson = {
      name: "demo-react-app",
      version: "1.0.0",
      dependencies: {
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "react-router-dom": "^6.0.0"
      }
    };
    
    const appJs = `
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
    `;
    
    const loginPage = `
import React, { useState } from 'react';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // 登录逻辑
  };
  
  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
    `;
    
    // 保存文件
    await fs.writeFile(path.join(demoDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    await fs.writeFile(path.join(demoDir, 'src', 'App.js'), appJs);
    await fs.writeFile(path.join(demoDir, 'src', 'pages', 'LoginPage.js'), loginPage);
    
    console.log('📁 Demo project created at:', demoDir);
  } catch (error) {
    console.warn('⚠️  Could not create demo project:', error.message);
  }
}

// 主函数
async function main() {
  try {
    // 检查是否有 LLM 配置
    if (!process.env.GLM_API_KEY && !process.env.DEEPSEEK_TOKEN && !process.env.OPENAI_API_KEY) {
      console.error('❌ No LLM provider configured!');
      console.log('Please set one of the following environment variables:');
      console.log('  - GLM_API_KEY (for GLM/智谱AI)');
      console.log('  - DEEPSEEK_TOKEN (for DeepSeek)');
      console.log('  - OPENAI_API_KEY (for OpenAI)');
      process.exit(1);
    }
    
    // 创建演示项目（如果不存在）
    await createDemoProject();
    
    // 运行示例
    await runExample();
    
  } catch (error) {
    console.error('💥 Example execution failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { runExample, createDemoProject };
