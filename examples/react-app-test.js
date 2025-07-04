const { UITestGenerator } = require('../src/index');

async function generateReactTests() {
  const generator = new UITestGenerator();
  
  const results = await generator.run({
    mode: 'full',
    projectPath: '/path/to/your/react/app',
    userRequirement: `
      Test the e-commerce application with the following scenarios:
      1. User registration and login flow
      2. Browse product catalog and search functionality
      3. Add items to shopping cart
      4. Update cart quantities and remove items
      5. Complete checkout process with payment
      6. View order history and details
    `,
    targetUrl: 'http://localhost:3000',
    maxIterations: 3,
    testOutputDir: './generated-tests/react-e-commerce'
  });

  console.log('Test generation completed!');
  console.log('Generated files:', results.phase3?.testFiles?.length || 0);
}

// Run the example
generateReactTests().catch(console.error);