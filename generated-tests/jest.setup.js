// Jest setup file for Puppeteer tests

// Increase default timeout for Puppeteer operations
jest.setTimeout(30000);

// Global error handler for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add custom matchers if needed
expect.extend({
  toBeVisible: async (received) => {
    const pass = await received.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    });
    
    return {
      pass,
      message: () => pass
        ? `expected element not to be visible`
        : `expected element to be visible`
    };
  }
});