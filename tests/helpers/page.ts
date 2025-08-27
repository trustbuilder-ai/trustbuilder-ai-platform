// Custom Page helper class based on documented patterns
// Provides a simplified wrapper around Puppeteer's Page object

import puppeteer, { Browser, Page } from 'puppeteer';

class CustomPage {
  browser: Browser | null = null;
  page: Page | null = null;

  // Static build method from documented pattern - launches browser and creates page
  static async build(headless: boolean = true): Promise<CustomPage> {
    const browser = await puppeteer.launch({
      headless: headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Common args for CI environments
    });
    
    const page = await browser.newPage();
    const customPage = new CustomPage();
    customPage.browser = browser;
    customPage.page = page;
    
    return customPage;
  }

  // Navigate to URL - using 'domcontentloaded' instead of 'networkidle0' for faster navigation
  async goto(url: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
    console.log(`Navigation complete for: ${url}`);
  }

  // Get element text content (documented pattern using $eval)
  async getContentsOf(selector: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    return await this.page.$eval(selector, el => el.textContent || '');
  }

  // Wait for selector (standard Puppeteer pattern) - reduced timeout for faster failures
  async waitForSelector(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    try {
      console.log(`Waiting for selector: ${selector}`);
      await this.page.waitForSelector(selector, { timeout: 3000 });
      console.log(`Found selector: ${selector}`);
      return true;
    } catch (error) {
      console.log(`Selector not found after 3s: ${selector}`);
      return false;
    }
  }

  // Click element
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.click(selector);
  }

  // Type into element
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.type(selector, text);
  }

  // Close browser
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // ============= AUTH SCAFFOLDING (from documented examples) - NOT IMPLEMENTED YET =============
  // This is scaffolding for future authentication testing when needed
  
  /*
  async login(userId?: string): Promise<void> {
    // Documented pattern: Create session and set cookies to bypass OAuth
    // This would use sessionFactory pattern from documentation
    
    // Example implementation from documentation:
    // const user = await userFactory();
    // const { session, sig } = sessionFactory(user);
    // 
    // await this.page.setCookie({ name: 'session', value: session });
    // await this.page.setCookie({ name: 'session.sig', value: sig });
    // await this.page.goto('http://localhost:3000');
    // await this.page.waitForSelector('a[href="/auth/logout"]');
    
    throw new Error('Login not implemented - routes do not require authentication yet');
  }
  */

  // ============= API TESTING METHODS (from documented examples) - SCAFFOLDING =============
  
  /*
  async get(path: string): Promise<any> {
    // Documented pattern for API testing
    if (!this.page) throw new Error('Page not initialized');
    return await this.page.evaluate((path) => {
      return fetch(path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json());
    }, path);
  }

  async post(path: string, data: any): Promise<any> {
    // Documented pattern for API testing
    if (!this.page) throw new Error('Page not initialized');
    return await this.page.evaluate((path, data) => {
      return fetch(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json());
    }, path, data);
  }
  */
}

export default CustomPage;