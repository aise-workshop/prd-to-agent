const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const net = require('net');
const http = require('http');

/**
 * 前端服务器自动启动和管理工具
 */
class FrontendServerManager {
  constructor() {
    this.serverProcess = null;
    this.serverUrl = null;
    this.serverPort = null;
  }

  /**
   * 检测项目类型和启动命令
   */
  async detectProjectType(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const scripts = packageJson.scripts || {};
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // 检测框架类型
      let framework = 'unknown';
      let startCommand = null;
      let buildCommand = null;
      
      if (dependencies['react'] || dependencies['react-dom']) {
        framework = 'react';
        if (dependencies['next']) {
          framework = 'nextjs';
          startCommand = scripts.dev || scripts.start || 'npm run dev';
        } else if (dependencies['react-scripts']) {
          framework = 'create-react-app';
          startCommand = scripts.start || 'npm start';
        } else if (dependencies['vite']) {
          framework = 'vite-react';
          startCommand = scripts.dev ? 'npm run dev' : (scripts.start ? 'npm run start' : 'npm run dev');
        }
      } else if (dependencies['vue']) {
        framework = 'vue';
        if (dependencies['@vue/cli-service']) {
          startCommand = scripts.serve || scripts.dev || 'npm run serve';
        } else if (dependencies['vite']) {
          framework = 'vite-vue';
          startCommand = scripts.dev ? 'npm run dev' : (scripts.start ? 'npm run start' : 'npm run dev');
        }
      } else if (dependencies['@angular/core']) {
        framework = 'angular';
        startCommand = scripts.start || scripts.serve || 'ng serve';
      }
      
      // 如果没有检测到特定框架，尝试通用启动命令
      if (!startCommand) {
        if (scripts.dev) startCommand = 'npm run dev';
        else if (scripts.start) startCommand = 'npm start';
        else if (scripts.serve) startCommand = 'npm run serve';
      }
      
      return {
        framework,
        startCommand,
        buildCommand: scripts.build || 'npm run build',
        packageJson,
        hasNodeModules: await this.checkNodeModules(projectPath)
      };
    } catch (error) {
      console.warn('Failed to detect project type:', error.message);
      return {
        framework: 'unknown',
        startCommand: null,
        buildCommand: null,
        packageJson: null,
        hasNodeModules: false
      };
    }
  }

  /**
   * 检查是否已安装依赖
   */
  async checkNodeModules(projectPath) {
    try {
      const nodeModulesPath = path.join(projectPath, 'node_modules');
      await fs.access(nodeModulesPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 安装项目依赖
   */
  async installDependencies(projectPath) {
    console.log('📦 Installing project dependencies...');
    
    return new Promise((resolve, reject) => {
      const installProcess = spawn('npm', ['install'], {
        cwd: projectPath,
        stdio: 'pipe'
      });
      
      let output = '';
      installProcess.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      installProcess.stderr.on('data', (data) => {
        output += data.toString();
        process.stderr.write(data);
      });
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencies installed successfully');
          resolve(output);
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      
      installProcess.on('error', (error) => {
        reject(new Error(`Failed to start npm install: ${error.message}`));
      });
    });
  }

  /**
   * 查找可用端口
   */
  async findAvailablePort(startPort = 3000) {
    for (let port = startPort; port < startPort + 100; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error('No available port found');
  }

  /**
   * 检查端口是否可用
   */
  isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  }

  /**
   * 启动前端开发服务器
   */
  async startServer(projectPath, projectInfo) {
    if (!projectInfo.startCommand) {
      throw new Error('No start command found for this project');
    }

    // 检查并安装依赖
    if (!projectInfo.hasNodeModules) {
      await this.installDependencies(projectPath);
    }

    // 查找可用端口
    const port = await this.findAvailablePort(3000);
    this.serverPort = port;
    this.serverUrl = `http://localhost:${port}`;

    console.log(`🚀 Starting frontend server on port ${port}...`);
    console.log(`📝 Command: ${projectInfo.startCommand}`);

    return new Promise((resolve, reject) => {
      // 解析启动命令，优先使用 npx 或 npm run
      let command, args;
      if (projectInfo.startCommand.startsWith('npm ')) {
        [command, ...args] = projectInfo.startCommand.split(' ');
      } else {
        // 对于像 'vite' 这样的命令，使用 npx
        command = 'npx';
        args = projectInfo.startCommand.split(' ');
      }
      
      // 设置环境变量
      const env = {
        ...process.env,
        PORT: port.toString(),
        BROWSER: 'none', // 防止自动打开浏览器
        CI: 'true' // 某些工具在 CI 环境下行为更稳定
      };

      this.serverProcess = spawn(command, args, {
        cwd: projectPath,
        stdio: 'pipe',
        env
      });

      let output = '';
      let isReady = false;

      // 监听输出，检测服务器是否启动成功
      this.serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // console.log('Server output:', text); // 调试输出

        // 检测常见的服务器启动成功标志
        const readyPatterns = [
          /Local:\s+http:\/\/localhost:(\d+)/,
          /webpack compiled/i,
          /compiled successfully/i,
          /ready on/i,
          /development server running/i,
          /server running/i,
          /VITE.*ready/i,
          /ready in \d+ms/i
        ];

        // 检测 Vite 特定的端口信息
        const vitePortMatch = text.match(/Local:\s+http:\/\/localhost:(\d+)/);
        if (vitePortMatch && !isReady) {
          const actualPort = parseInt(vitePortMatch[1]);
          this.serverPort = actualPort;
          this.serverUrl = `http://localhost:${actualPort}`;
          console.log(`🔄 Server started on different port: ${this.serverUrl}`);
        }

        if (!isReady && readyPatterns.some(pattern => pattern.test(text))) {
          isReady = true;
          console.log('✅ Frontend server started successfully');
          resolve({
            url: this.serverUrl,
            port: this.serverPort,
            process: this.serverProcess
          });
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // 某些框架将正常信息输出到 stderr
        if (!isReady && text.includes('compiled') || text.includes('ready')) {
          isReady = true;
          console.log('✅ Frontend server started successfully');
          resolve({
            url: this.serverUrl,
            port: this.serverPort,
            process: this.serverProcess
          });
        }
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.serverProcess.on('close', (code) => {
        if (!isReady) {
          reject(new Error(`Server process exited with code ${code}`));
        }
      });

      // 超时处理
      setTimeout(() => {
        if (!isReady) {
          reject(new Error('Server startup timeout (60s)'));
        }
      }, 60000);
    });
  }

  /**
   * 等待服务器响应
   */
  async waitForServer(url, maxAttempts = 30) {
    console.log(`⏳ Waiting for server to respond at ${url}...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.checkServerHealth(url);
        console.log('✅ Server is responding');
        return true;
      } catch (error) {
        // 服务器还没准备好，继续等待
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`  Attempt ${attempt}/${maxAttempts}...`);
    }

    throw new Error('Server failed to respond within timeout period');
  }

  /**
   * 检查服务器健康状态
   */
  checkServerHealth(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname || '/',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        // 接受任何 2xx 或 3xx 状态码，以及 404（SPA 应用常见）
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
        } else {
          reject(new Error(`Server responded with status ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(5000);
      req.end();
    });
  }

  /**
   * 停止服务器
   */
  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping frontend server...');
      
      // 尝试优雅关闭
      this.serverProcess.kill('SIGTERM');
      
      // 等待一段时间后强制关闭
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.serverProcess = null;
      this.serverUrl = null;
      this.serverPort = null;
      
      console.log('✅ Frontend server stopped');
    }
  }

  /**
   * 自动启动并等待服务器就绪
   */
  async autoStart(projectPath) {
    try {
      // 检测项目类型
      const projectInfo = await this.detectProjectType(projectPath);
      console.log(`🔍 Detected framework: ${projectInfo.framework}`);
      
      if (!projectInfo.startCommand) {
        throw new Error(`Cannot auto-start server for framework: ${projectInfo.framework}`);
      }
      
      // 启动服务器
      const serverInfo = await this.startServer(projectPath, projectInfo);
      
      // 等待服务器响应
      await this.waitForServer(serverInfo.url);
      
      return serverInfo;
    } catch (error) {
      await this.stopServer();
      throw error;
    }
  }
}

module.exports = FrontendServerManager;
