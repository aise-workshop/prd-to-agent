const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

class IntegrationTest {
  constructor() {
    this.projectPath = path.join(__dirname, 'test-project');
    this.outputPath = path.join(__dirname, '../generated-tests');
  }

  async runTests() {
    console.log(chalk.blue('🧪 Running Integration Tests'));
    console.log(chalk.gray('Testing the complete AI Agent pipeline...'));

    try {
      // Test 1: Configuration Test
      await this.testConfiguration();

      // Test 2: Phase 1 - Code Analysis
      await this.testPhase1();

      // Test 3: Complete Pipeline (without validation)
      await this.testFullPipeline();

      // Test 4: Verify Generated Files
      await this.verifyGeneratedFiles();

      console.log(chalk.green('\n✅ All integration tests passed!'));
      return true;
    } catch (error) {
      console.error(chalk.red('\n❌ Integration tests failed:'), error.message);
      return false;
    }
  }

  async testConfiguration() {
    console.log(chalk.yellow('\n1. Testing Configuration...'));
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['src/index.js', 'test'], {
        cwd: path.join(__dirname, '../'),
        stdio: 'pipe'
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0 && output.includes('AI connection test passed')) {
          console.log(chalk.green('✓ Configuration test passed'));
          resolve();
        } else {
          reject(new Error(`Configuration test failed with code ${code}: ${output}`));
        }
      });
    });
  }

  async testPhase1() {
    console.log(chalk.yellow('\n2. Testing Phase 1 - Code Analysis...'));
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', [
        'src/index.js', 
        'generate', 
        'test/test-project', 
        '--phase', '1',
        '--requirement', '测试登录流程和主要页面导航'
      ], {
        cwd: path.join(__dirname, '../'),
        stdio: 'pipe'
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0 && output.includes('Phase 1 completed')) {
          console.log(chalk.green('✓ Phase 1 test passed'));
          resolve();
        } else {
          reject(new Error(`Phase 1 test failed with code ${code}: ${output}`));
        }
      });
    });
  }

  async testFullPipeline() {
    console.log(chalk.yellow('\n3. Testing Full Pipeline (without validation)...'));
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', [
        'src/index.js', 
        'generate', 
        'test/test-project', 
        '--skip-validation',
        '--requirement', '测试登录流程和主要页面导航',
        '--output', 'test/'
      ], {
        cwd: path.join(__dirname, '../'),
        stdio: 'pipe'
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0 && output.includes('All phases completed successfully')) {
          console.log(chalk.green('✓ Full pipeline test passed'));
          resolve();
        } else {
          reject(new Error(`Full pipeline test failed with code ${code}: ${output}`));
        }
      });
    });
  }

  async verifyGeneratedFiles() {
    console.log(chalk.yellow('\n4. Verifying Generated Files...'));
    
    const expectedFiles = [
      'generated-tests/pages/Page.js',
      'generated-tests/pages/LoginPage.js',
      'generated-tests/pages/DashboardPage.js',
      'generated-tests/pages/ProfilePage.js',
      'generated-tests/tests/ui-tests.spec.js',
      'generated-tests/playwright.config.js',
      'generated-tests/package.json'
    ];

    const basePath = path.join(__dirname, '../test/');
    
    for (const file of expectedFiles) {
      const filePath = path.join(basePath, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Expected file not found: ${file}`);
      }
    }

    // Verify file contents
    const testFile = path.join(basePath, 'generated-tests/tests/ui-tests.spec.js');
    const testContent = await fs.readFile(testFile, 'utf-8');
    
    if (!testContent.includes('test(')) {
      throw new Error('Generated test file does not contain valid test cases');
    }

    console.log(chalk.green('✓ All expected files generated successfully'));
  }

  async cleanup() {
    console.log(chalk.yellow('\n5. Cleaning up test files...'));
    
    const testOutputPath = path.join(__dirname, '../test/generated-tests');
    if (await fs.pathExists(testOutputPath)) {
      await fs.remove(testOutputPath);
    }
    
    console.log(chalk.green('✓ Cleanup completed'));
  }
}

// Run integration tests if this file is executed directly
if (require.main === module) {
  const test = new IntegrationTest();
  test.runTests().then(success => {
    if (success) {
      console.log(chalk.green('\n🎉 Integration tests completed successfully!'));
      process.exit(0);
    } else {
      console.log(chalk.red('\n💥 Integration tests failed!'));
      process.exit(1);
    }
  }).catch(error => {
    console.error(chalk.red('\n💥 Integration tests failed:'), error);
    process.exit(1);
  });
}

module.exports = IntegrationTest;