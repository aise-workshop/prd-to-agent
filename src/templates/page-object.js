// Page Object Model Template
class {{PageName}} {
  constructor(page) {
    this.page = page;
    this.url = '{{pageUrl}}';
    this.selectors = {
      {{selectors}}
    };
  }

  async navigate() {
    await this.page.goto(this.url);
    await this.page.waitForSelector('body');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  {{methods}}

  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `screenshots/${name}.png`, 
      fullPage: true 
    });
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async isElementVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  async clickElement(selector) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
  }

  async fillInput(selector, value) {
    await this.page.waitForSelector(selector);
    await this.page.fill(selector, value);
  }

  async getText(selector) {
    await this.page.waitForSelector(selector);
    return await this.page.textContent(selector);
  }

  async waitForNavigation(expectedUrl) {
    await this.page.waitForURL(expectedUrl);
  }
}

module.exports = {{PageName}};