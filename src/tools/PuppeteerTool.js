const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const BaseTool = require('./BaseTool');

class PuppeteerTool extends BaseTool {
  constructor() {
    super(
      'puppeteer',
      'Tool for browser automation, UI element extraction, and screenshot capture'
    );
    this.browser = null;
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['navigate', 'screenshot', 'extract_elements', 'click', 'type', 'wait', 'evaluate'],
          description: 'The action to perform'
        },
        url: {
          type: 'string',
          description: 'URL to navigate to'
        },
        selector: {
          type: 'string',
          description: 'CSS selector for element interaction'
        },
        text: {
          type: 'string',
          description: 'Text to type'
        },
        script: {
          type: 'string',
          description: 'JavaScript to evaluate in page context'
        },
        filename: {
          type: 'string',
          description: 'Filename for screenshot'
        },
        wait_time: {
          type: 'number',
          description: 'Time to wait in milliseconds'
        }
      },
      required: ['action']
    };
  }

  async execute(params) {
    this.validate(params);

    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser.newPage();
    
    try {
      switch (params.action) {
        case 'navigate':
          return await this.navigate(page, params.url);
        
        case 'screenshot':
          return await this.screenshot(page, params.filename);
        
        case 'extract_elements':
          return await this.extractElements(page, params.selector);
        
        case 'click':
          return await this.click(page, params.selector);
        
        case 'type':
          return await this.type(page, params.selector, params.text);
        
        case 'wait':
          return await this.wait(page, params.wait_time || 1000);
        
        case 'evaluate':
          return await this.evaluate(page, params.script);
        
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    } finally {
      await page.close();
    }
  }

  async launch() {
    const headless = process.env.PUPPETEER_HEADLESS !== 'false';
    this.browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async navigate(page, url) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      return {
        success: true,
        url: page.url(),
        title: await page.title()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async screenshot(page, filename = 'screenshot.png') {
    try {
      const screenshotPath = path.join('screenshots', filename);
      await fs.mkdir('screenshots', { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      return {
        success: true,
        path: screenshotPath,
        message: 'Screenshot captured successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async extractElements(page, selector = '*') {
    try {
      const elements = await page.evaluate((sel) => {
        const getSelector = (element) => {
          if (element.id) return `#${element.id}`;
          if (element.className) {
            const classes = element.className.split(' ').filter(c => c).join('.');
            if (classes) return `.${classes}`;
          }
          return element.tagName.toLowerCase();
        };

        const extractInfo = (element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            selector: getSelector(element),
            text: element.textContent?.trim().substring(0, 100),
            attributes: {
              id: element.id,
              class: element.className,
              href: element.href,
              type: element.type,
              name: element.name,
              placeholder: element.placeholder,
              'data-testid': element.getAttribute('data-testid')
            },
            position: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            visible: rect.width > 0 && rect.height > 0
          };
        };

        if (sel === '*') {
          // Extract interactive elements
          const interactiveSelectors = [
            'button',
            'a',
            'input',
            'select',
            'textarea',
            '[onclick]',
            '[data-testid]'
          ];
          
          const elements = [];
          interactiveSelectors.forEach(s => {
            document.querySelectorAll(s).forEach(el => {
              elements.push(extractInfo(el));
            });
          });
          
          return elements;
        } else {
          return Array.from(document.querySelectorAll(sel)).map(extractInfo);
        }
      }, selector);

      return {
        success: true,
        elements,
        count: elements.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async click(page, selector) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      return {
        success: true,
        selector,
        message: 'Element clicked successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async type(page, selector, text) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.type(selector, text);
      return {
        success: true,
        selector,
        text,
        message: 'Text typed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async wait(page, time) {
    await page.waitForTimeout(time);
    return {
      success: true,
      waited: time,
      message: `Waited for ${time}ms`
    };
  }

  async evaluate(page, script) {
    try {
      const result = await page.evaluate(script);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PuppeteerTool;