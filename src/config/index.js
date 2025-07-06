const dotenv = require('dotenv');

dotenv.config();

const config = {
  // Test Configuration
  test: {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
    retries: 3,
    puppeteerOptions: {
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },

  // File patterns for different frameworks
  frameworks: {
    react: {
      routeFiles: ['**/routes/**/*.{js,jsx,ts,tsx}', '**/App.{js,jsx,ts,tsx}', '**/router.{js,jsx,ts,tsx}'],
      componentFiles: ['**/components/**/*.{js,jsx,ts,tsx}', '**/pages/**/*.{js,jsx,ts,tsx}'],
      configFiles: ['package.json', 'tsconfig.json', 'vite.config.{js,ts}', 'webpack.config.{js,ts}']
    },
    vue: {
      routeFiles: ['**/router/**/*.{js,ts}', '**/routes/**/*.{js,ts}'],
      componentFiles: ['**/components/**/*.vue', '**/pages/**/*.vue', '**/views/**/*.vue'],
      configFiles: ['package.json', 'vue.config.{js,ts}', 'vite.config.{js,ts}']
    },
    angular: {
      routeFiles: ['**/*-routing.module.ts', '**/app-routing.module.ts'],
      componentFiles: ['**/components/**/*.ts', '**/pages/**/*.ts'],
      configFiles: ['angular.json', 'package.json', 'tsconfig.json']
    }
  },

  // Output paths
  output: {
    testDir: './test-results',
    screenshotDir: './screenshots',
    reportDir: './reports'
  }
};

module.exports = config;