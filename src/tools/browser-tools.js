import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class BrowserTools {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launch(options = {}) {
    try {
      this.browser = await puppeteer.launch({
        headless: options.headless !== false,
        devtools: options.devtools || false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...options
      });
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });
      return true;
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }

  async navigateTo(url) {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      return true;
    } catch (error) {
      throw new Error(`Failed to navigate to ${url}: ${error.message}`);
    }
  }

  async getPageInfo() {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }

      const html = await this.page.content();
      const $ = cheerio.load(html);
      
      // Extract basic page information
      const title = await this.page.title();
      const url = this.page.url();
      
      // Find forms
      const forms = [];
      $('form').each((i, form) => {
        const $form = $(form);
        const formInfo = {
          action: $form.attr('action') || '',
          method: $form.attr('method') || 'GET',
          inputs: []
        };
        
        $form.find('input, select, textarea').each((j, input) => {
          const $input = $(input);
          formInfo.inputs.push({
            type: $input.attr('type') || 'text',
            name: $input.attr('name') || '',
            id: $input.attr('id') || '',
            placeholder: $input.attr('placeholder') || '',
            required: $input.attr('required') !== undefined
          });
        });
        
        forms.push(formInfo);
      });

      // Find interactive elements
      const interactiveElements = [];
      $('button, a[href], input[type="submit"], input[type="button"]').each((i, el) => {
        const $el = $(el);
        interactiveElements.push({
          tag: el.tagName.toLowerCase(),
          text: $el.text().trim(),
          href: $el.attr('href') || '',
          type: $el.attr('type') || '',
          id: $el.attr('id') || '',
          class: $el.attr('class') || '',
          selector: this.generateSelector($el, $)
        });
      });

      return {
        title,
        url,
        forms,
        interactiveElements: interactiveElements.slice(0, 20) // Limit to first 20 elements
      };
    } catch (error) {
      throw new Error(`Failed to get page info: ${error.message}`);
    }
  }

  generateSelector($element, $) {
    const tag = $element.prop('tagName').toLowerCase();
    const id = $element.attr('id');
    const className = $element.attr('class');
    
    if (id) {
      return `#${id}`;
    }
    
    if (className) {
      const firstClass = className.split(' ')[0];
      return `.${firstClass}`;
    }
    
    // Generate a more specific selector
    const parent = $element.parent();
    if (parent.length > 0) {
      const parentTag = parent.prop('tagName').toLowerCase();
      const index = parent.children(tag).index($element);
      return `${parentTag} ${tag}:nth-child(${index + 1})`;
    }
    
    return tag;
  }

  async screenshot(path) {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }
      await this.page.screenshot({ path, fullPage: true });
      return path;
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }

  async waitForSelector(selector, timeout = 5000) {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      throw new Error(`Failed to wait for selector ${selector}: ${error.message}`);
    }
  }

  async click(selector) {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }
      await this.page.click(selector);
      return true;
    } catch (error) {
      throw new Error(`Failed to click ${selector}: ${error.message}`);
    }
  }

  async type(selector, text) {
    try {
      if (!this.page) {
        throw new Error('Browser not launched. Call launch() first.');
      }
      await this.page.type(selector, text);
      return true;
    } catch (error) {
      throw new Error(`Failed to type in ${selector}: ${error.message}`);
    }
  }
}