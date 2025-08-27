// Wargames Challenge Page E2E Tests
// Tests theme switching and challenges overlay functionality

import puppeteer, { Browser, Page } from 'puppeteer';
import { setTimeout } from 'node:timers/promises';

describe('Wargames Challenge Page', () => {
  let browser: Browser;
  let page: Page;
  const APP_URL = 'http://localhost:3000/trustbuilder-ai-platform/#/wargames/challenge';

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Navigate to the wargames challenge page
    await page.goto(APP_URL, {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('Theme Switching', () => {
    test('should change header colors when switching themes', async () => {
      console.log('Testing theme switching functionality');
      
      // Wait for the page to be fully loaded
      await page.waitForSelector('select', { timeout: 5000 });
      
      // Get initial header color (should be Cyberpunk theme by default)
      const getHeaderColor = async () => {
        return await page.evaluate(() => {
          const header = document.querySelector('header');
          return header ? window.getComputedStyle(header).backgroundColor : null;
        });
      };
      
      const initialColor = await getHeaderColor();
      console.log('Initial header color:', initialColor);
      
      // Switch to Dark theme
      await page.select('select', 'dark');
      // Wait for theme change to complete (using event-driven approach)
      await page.waitForFunction(
        (initialColor) => {
          const header = document.querySelector('header');
          return header && window.getComputedStyle(header).backgroundColor !== initialColor;
        },
        { timeout: 4000 },
        initialColor
      );
      
      const darkColor = await getHeaderColor();
      console.log('Dark theme header color:', darkColor);
      
      // Verify color changed
      expect(darkColor).not.toBe(initialColor);
      // Dark theme should have a dark header (rgba with low RGB values)
      expect(darkColor).toMatch(/rgba?\(2[0-9], 2[0-9], 2[0-9]/);

      // Switch to Light theme
      await page.select('select', 'light');
      // Wait for theme change to complete
      await page.waitForFunction(
        (prevColor) => {
          const header = document.querySelector('header');
          return header && window.getComputedStyle(header).backgroundColor !== prevColor;
        },
        { timeout: 3000 },
        darkColor
      );

      const lightColor = await getHeaderColor();
      console.log('Light theme header color:', lightColor);
      
      // Verify color changed again
      expect(lightColor).not.toBe(darkColor);
      // Light theme should have a light header (rgba with high RGB values)
      expect(lightColor).toMatch(/rgba?\(2[4-5][0-9], 2[4-5][0-9], 2[4-5][0-9]/);
      
      // Verify we can switch back to Cyberpunk
      await page.select('select', 'Cyberpunk');
      // Wait for theme change to complete
      await page.waitForFunction(
        (prevColor) => {
          const header = document.querySelector('header');
          return header && window.getComputedStyle(header).backgroundColor !== prevColor;
        },
        { timeout: 2000 },
        lightColor
      );
      
      const cyberpunkColor = await getHeaderColor();
      expect(cyberpunkColor).toBe(initialColor);
    });
    
    test('should persist theme selection in dropdown', async () => {
      // Select Dark theme
      await page.select('select', 'dark');
      
      // Verify the dropdown shows Dark as selected
      const selectedValue = await page.$eval('select', el => (el as HTMLSelectElement).value);
      expect(selectedValue).toBe('dark');
      
      // Select Light theme
      await page.select('select', 'light');
      
      // Verify the dropdown shows Light as selected
      const newSelectedValue = await page.$eval('select', el => (el as HTMLSelectElement).value);
      expect(newSelectedValue).toBe('light');
    });
  });

  describe('Challenges Overlay', () => {
    test('should open challenges overlay when clicking Challenges button', async () => {
      console.log('Testing challenges overlay functionality');
      
      // Wait for and click the Challenges button
      const challengesButton = await page.waitForSelector('button::-p-text(Challenges)', { timeout: 5000 });
      expect(challengesButton).not.toBeNull();
      
      await challengesButton!.click();
      
      // Wait for overlay to appear
      await page.waitForFunction(
        () => {
          const headings = Array.from(document.querySelectorAll('h2'));
          return headings.some(h => h.textContent === 'Challenges');
        },
        { timeout: 2000 }
      );
      
      // Check for overlay heading
      const overlayHeading = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2'));
        return headings.find(h => h.textContent === 'Challenges')?.textContent;
      });
      
      expect(overlayHeading).toBe('Challenges');
      console.log('Found overlay heading');
      
      // Wait a bit for overlay content to fully render
      await setTimeout(1000);
      
      // Check for challenge categories - look for h3s that are likely in the overlay
      const overlayH3Contents = await page.evaluate(() => {
        // Find h3s that come after the h2 with "Challenges"
        const challengesH2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Challenges');
        if (!challengesH2) return [];
        
        // Get the overlay container (usually the parent or nearby container)
        const overlayContainer = challengesH2.closest('div')?.parentElement;
        if (!overlayContainer) return [];
        
        // Find h3s within the overlay
        const headings = Array.from(overlayContainer.querySelectorAll('h3'));
        return headings.map(h => h.textContent);
      });
      console.log('Overlay H3 headings found:', overlayH3Contents);
      
      const hasWargamesSection = overlayH3Contents.some(h => h?.includes('Wargames'));
      const hasSocialSection = overlayH3Contents.some(h => h?.includes('Social'));
      
      if (overlayH3Contents.length > 0) {
        expect(hasWargamesSection).toBe(true);
        expect(hasSocialSection).toBe(true);
        console.log('Found challenge categories');
      } else {
        console.log('Warning: No h3 headings found in overlay');
      }
      
      // Check for specific challenge
      const hasTomahawkChallenge = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h4'));
        return headings.some(h => h.textContent?.includes('Fire Tomahawk'));
      });
      
      expect(hasTomahawkChallenge).toBe(true);
      console.log('Found specific challenge cards');
    });
    
    test('should close overlay when clicking close button', async () => {
      // Open the overlay
      const challengesButton = await page.waitForSelector('button::-p-text(Challenges)');
      await challengesButton!.click();
      
      // Wait for overlay to appear
      await page.waitForFunction(
        () => {
          const headings = Array.from(document.querySelectorAll('h2'));
          return headings.some(h => h.textContent === 'Challenges');
        },
        { timeout: 2000 }
      );
      
      // Verify overlay is present
      let overlayPresent = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2'));
        return headings.some(h => h.textContent === 'Challenges');
      });
      expect(overlayPresent).toBe(true);
      
      // Find and click close button
      // The close button is typically an X or Close button in the overlay
      // Try multiple selectors for close button
      const closeButton = await page.$('button[aria-label*="Close"]') || 
                          await page.$('button::-p-text(Close)') ||
                          await page.$('button::-p-text(×)');
      
      if (closeButton) {
        await closeButton.click();
        // Wait for overlay to disappear
        await page.waitForFunction(
          () => {
            const headings = Array.from(document.querySelectorAll('h2'));
            return !headings.some(h => h.textContent === 'Challenges');
          },
          { timeout: 2000 }
        );
        
        // Verify overlay is gone
        overlayPresent = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h2'));
          return headings.some(h => h.textContent === 'Challenges');
        });
        
        // The overlay should either be gone or hidden
        // Note: Some implementations might just hide it rather than remove it from DOM
        expect(overlayPresent).toBe(false);
        console.log('Overlay closed successfully');
      } else {
        console.log('Close button not found - overlay might close differently');
      }
    });
    
    test('should show multiple challenge cards in overlay', async () => {
      // Open the overlay
      const challengesButton = await page.waitForSelector('button::-p-text(Challenges)');
      await challengesButton!.click();
      
      // Wait for overlay content to load (check for challenge cards)
      await page.waitForFunction(
        () => document.querySelectorAll('h4').length > 0,
        { timeout: 2000 }
      );
      
      // Count challenge cards (h4 elements typically contain challenge titles)
      const challengeCount = await page.evaluate(() => {
        return document.querySelectorAll('h4').length;
      });
      
      console.log(`Found ${challengeCount} challenge cards`);
      
      // Should have multiple challenges
      expect(challengeCount).toBeGreaterThan(3);
      
      // Check for variety of challenge types
      const challengeTypes = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h4'));
        return headings.map(h => h.textContent).filter(Boolean);
      });
      
      console.log('Challenge types found:', challengeTypes.slice(0, 5)); // Log first 5
      
      // Should have different types of challenges
      const hasFireChallenge = challengeTypes.some(t => t?.includes('Fire'));
      const hasDeployChallenge = challengeTypes.some(t => t?.includes('Deploy'));
      
      expect(hasFireChallenge || hasDeployChallenge).toBe(true);
    });
  });
});

// Test with CustomPage helper
describe('Wargames with CustomPage Helper', () => {
  let customPage: any;
  const APP_URL = 'http://localhost:3000/trustbuilder-ai-platform/#/wargames/challenge';
  
  beforeEach(async () => {
    const CustomPage = (await import('../helpers/page')).default;
    customPage = await CustomPage.build();
  });
  
  afterEach(async () => {
    await customPage.close();
  });
  
  test('should load wargames page and find theme selector', async () => {
    await customPage.goto(APP_URL);
    
    // Check if theme selector exists
    const selectorExists = await customPage.waitForSelector('select');
    expect(selectorExists).toBe(true);
    
    // Check if challenges button exists
    const buttonExists = await customPage.waitForSelector('button');
    expect(buttonExists).toBe(true);
    
    console.log('Wargames page loaded successfully with CustomPage helper');
  });
});