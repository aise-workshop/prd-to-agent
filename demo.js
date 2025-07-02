const PuppeteerTestAgent = require('./src/index');
require('dotenv').config();

/**
 * 演示 AI Agent 的完全自动化功能
 */
async function runDemo() {
  console.log('🚀 Puppeteer Test Generation AI Agent Demo\n');
  
  try {
    // 检查 LLM 配置
    if (!process.env.GLM_API_KEY && !process.env.DEEPSEEK_TOKEN && !process.env.OPENAI_API_KEY) {
      console.error('❌ 请在 .env 文件中配置 LLM API 密钥');
      console.log('支持的配置：GLM_API_KEY, DEEPSEEK_TOKEN, OPENAI_API_KEY');
      process.exit(1);
    }
    
    // 创建 Agent 实例
    const agent = new PuppeteerTestAgent();
    
    // 示例用法
    const userInput = `
我需要为我的 React 应用生成完整的 UI 测试。主要功能包括：
1. 用户登录系统
2. 主页导航和内容展示
3. 用户资料管理

请生成包含登录流程、导航测试和业务流程的完整测试代码。
    `.trim();
    
    const projectPath = './your-frontend-project'; // 替换为你的项目路径
    
    console.log('📝 用户需求:', userInput);
    console.log('📁 项目路径:', projectPath);
    console.log('🌐 前端服务: 将自动检测和启动\n');
    
    console.log('🎯 开始完全自动化测试生成...');
    console.log('这将自动完成：');
    console.log('  1. 分析项目结构和路由');
    console.log('  2. 自动安装依赖（如需要）');
    console.log('  3. 自动启动前端服务器');
    console.log('  4. 启动浏览器验证页面');
    console.log('  5. 生成完整的 Puppeteer 测试代码');
    console.log('  6. 自动清理资源\n');
    
    // 执行完全自动化的测试生成
    const results = await agent.generateTests(userInput, projectPath);
    
    if (results.success) {
      console.log('\n🎉 测试生成完成！');
      console.log('\n📊 结果摘要:');
      console.log(`  • 阶段一 (代码分析): ${results.phase1?.success ? '✅ 成功' : '❌ 失败'}`);
      console.log(`  • 阶段二 (浏览器验证): ${results.phase2?.success ? '✅ 成功' : '❌ 失败'}`);
      console.log(`  • 阶段三 (代码生成): ${results.phase3?.success ? '✅ 成功' : '❌ 失败'}`);
      
      if (results.phase2?.autoStartedServer) {
        console.log(`  • 自动启动服务器: ${results.phase2.frontendUrl}`);
      }
      
      if (results.phase3?.outputDir) {
        console.log(`  • 生成的测试代码: ${results.phase3.outputDir}`);
      }
      
      console.log('\n🎯 下一步:');
      console.log('  1. 进入生成的测试目录');
      console.log('  2. 运行: npm install');
      console.log('  3. 启动你的前端应用');
      console.log('  4. 运行: npm test');
      
    } else {
      console.error('\n❌ 测试生成失败:', results.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 演示执行失败:', error.message);
    process.exit(1);
  }
}

// 运行演示
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };
