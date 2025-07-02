const PuppeteerTestAgent = require('./src/index');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * 创建演示项目用于测试
 */
async function createDemoProject() {
  const demoDir = './demo-project';
  
  try {
    // 创建目录结构
    await fs.mkdir(demoDir, { recursive: true });
    await fs.mkdir(path.join(demoDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(demoDir, 'src', 'components'), { recursive: true });
    await fs.mkdir(path.join(demoDir, 'src', 'pages'), { recursive: true });
    
    // 创建 package.json
    const packageJson = {
      name: "demo-react-app",
      version: "1.0.0",
      dependencies: {
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "react-router-dom": "^6.0.0"
      },
      scripts: {
        "start": "react-scripts start",
        "build": "react-scripts build"
      }
    };
    
    // 创建 App.js
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
    
    // 创建 LoginPage.js
    const loginPage = `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 简单的登录验证
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/home');
    } else {
      setError('Invalid username or password');
    }
  };
  
  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            data-testid="username-input"
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password-input"
          />
        </div>
        <button type="submit" data-testid="login-button">Login</button>
        {error && <div className="error-message" data-testid="error-message">{error}</div>}
      </form>
    </div>
  );
}

export default LoginPage;
    `;
    
    // 创建 HomePage.js
    const homePage = `
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };
  
  return (
    <div className="home-page">
      <nav className="navbar">
        <h1>Welcome to Dashboard</h1>
        <div>
          <Link to="/profile" data-testid="profile-link">Profile</Link>
          <button onClick={handleLogout} data-testid="logout-button">Logout</button>
        </div>
      </nav>
      <main>
        <h2>Dashboard Content</h2>
        <p>This is the main dashboard page.</p>
      </main>
    </div>
  );
}

export default HomePage;
    `;
    
    // 创建 ProfilePage.js
    const profilePage = `
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ProfilePage() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  
  const handleSave = () => {
    alert('Profile saved!');
  };
  
  return (
    <div className="profile-page">
      <nav>
        <Link to="/home" data-testid="home-link">Back to Home</Link>
      </nav>
      <h1>User Profile</h1>
      <form className="profile-form">
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="name-input"
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
        </div>
        <button type="button" onClick={handleSave} data-testid="save-button">
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
    `;
    
    // 保存文件
    await fs.writeFile(path.join(demoDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    await fs.writeFile(path.join(demoDir, 'src', 'App.js'), appJs);
    await fs.writeFile(path.join(demoDir, 'src', 'pages', 'LoginPage.js'), loginPage);
    await fs.writeFile(path.join(demoDir, 'src', 'pages', 'HomePage.js'), homePage);
    await fs.writeFile(path.join(demoDir, 'src', 'pages', 'ProfilePage.js'), profilePage);
    
    console.log('📁 Demo project created at:', demoDir);
    return demoDir;
  } catch (error) {
    console.error('❌ Failed to create demo project:', error.message);
    throw error;
  }
}

/**
 * 运行完整的测试演示
 */
async function runDemo() {
  console.log('🚀 Starting Puppeteer Test Agent Demo...\n');
  
  try {
    // 检查 LLM 配置
    if (!process.env.GLM_API_KEY && !process.env.DEEPSEEK_TOKEN && !process.env.OPENAI_API_KEY) {
      throw new Error('No LLM provider configured! Please set GLM_API_KEY, DEEPSEEK_TOKEN, or OPENAI_API_KEY in .env file.');
    }
    
    // 创建演示项目
    const projectPath = await createDemoProject();
    
    // 创建 Agent 实例
    const agent = new PuppeteerTestAgent();
    
    // 用户输入
    const userInput = `
我需要为这个 React 应用生成完整的 UI 测试。主要测试场景包括：

1. 登录流程测试：
   - 用户访问登录页面
   - 输入正确的用户名密码（admin/password）
   - 点击登录按钮，验证跳转到主页
   - 测试错误的登录凭据

2. 主页导航测试：
   - 验证登录后的主页内容
   - 测试导航到个人资料页面
   - 测试退出登录功能

3. 个人资料页面测试：
   - 访问个人资料页面
   - 编辑用户信息
   - 保存个人资料
   - 返回主页

请生成完整的测试用例，包括错误处理和边界情况。
    `.trim();
    
    console.log('📝 User Input:', userInput);
    console.log('📁 Project Path:', projectPath);
    console.log('🌐 Frontend URL: http://localhost:3000 (假设)');
    
    // 注意：这里我们不会真正启动浏览器，因为没有实际的前端服务运行
    // 但我们可以测试阶段一的代码分析功能
    console.log('\n⚠️  Note: Skipping browser validation (Phase 2) since no frontend server is running');
    console.log('Testing Phase 1 (Code Analysis) only...\n');
    
    // 只测试阶段一
    const Phase1Analysis = require('./src/phases/phase1-analysis');
    const phase1 = new Phase1Analysis();
    
    const phase1Results = await phase1.execute(userInput, projectPath);
    
    if (phase1Results.success) {
      console.log('\n✅ Phase 1 (Code Analysis) completed successfully!');
      console.log('\n📊 Analysis Results:');
      console.log('  • Framework:', phase1Results.analysis?.projectStructure?.framework || 'Unknown');
      console.log('  • Routes found:', phase1Results.analysis?.routes?.length || 0);
      console.log('  • Test scenarios:', phase1Results.analysis?.testScenarios?.length || 0);
      console.log('  • Auth flow detected:', phase1Results.analysis?.authFlow?.loginPage ? 'Yes' : 'No');
      
      if (phase1Results.analysis?.testScenarios) {
        console.log('\n🧪 Generated Test Scenarios:');
        phase1Results.analysis.testScenarios.forEach((scenario, index) => {
          console.log(`  ${index + 1}. ${scenario.name} (${scenario.priority})`);
          console.log(`     ${scenario.description}`);
        });
      }
      
      console.log('\n💡 To run the complete test generation:');
      console.log('  1. Start your frontend development server');
      console.log('  2. Run: npm run example');
      console.log('  3. Or use: node src/index.js "your requirements" "./your-project" "http://localhost:3000"');
      
    } else {
      console.error('\n❌ Phase 1 failed:', phase1Results.error);
    }
    
  } catch (error) {
    console.error('\n💥 Demo failed:', error.message);
    process.exit(1);
  }
}

// 运行演示
if (require.main === module) {
  runDemo();
}

module.exports = { createDemoProject, runDemo };
