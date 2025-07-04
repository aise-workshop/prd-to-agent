const { UITestGenerator } = require('../src/index');

async function generateVueTests() {
  const generator = new UITestGenerator();
  
  const results = await generator.run({
    mode: 'full',
    projectPath: '/path/to/your/vue/app',
    userRequirement: `
      Test the admin dashboard application:
      1. Admin login with role-based access
      2. User management - create, edit, delete users
      3. Content management - publish and unpublish articles
      4. Analytics dashboard - view charts and export data
      5. Settings configuration - update app settings
      6. Audit log viewing and filtering
    `,
    targetUrl: 'http://localhost:8080',
    maxIterations: 2,
    testOutputDir: './generated-tests/vue-admin-dashboard'
  });

  console.log('Test generation completed!');
  console.log('Validation success rate:', results.phase2?.validationResults?.successRate || 0);
}

// Run the example
generateVueTests().catch(console.error);