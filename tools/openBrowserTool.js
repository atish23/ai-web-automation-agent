import { z } from 'zod';
import { tool } from '@openai/agents';
import { chromium } from 'playwright';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

const openBrowserTool = tool({
  name: 'open_browser',
  description: 'Opens browser and navigates to URL',
  parameters: z.object({
    url: z.string().describe('URL to navigate to'),
  }),
  async execute({ url }) {
    const timer = new Timer('open_browser');
    Logger.info('Opening browser and navigating to URL', { url });

    try {
      if (!global.browser) {
        Logger.debug('Launching new browser with animations');
        global.browser = await chromium.launch({
          headless: false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--window-size=1200,800',           // Mid-size window (1200x800)
            '--window-position=100,50',         // Position from top-left
            '--force-device-scale-factor=0.8',  // Zoom out to 80% 
            '--disable-blink-features=AutomationControlled', // Faster automation
            '--disable-features=VizDisplayCompositor' // Faster rendering
          ]
        });
        global.page = await global.browser.newPage();
        await global.page.setViewportSize({ width: 1200, height: 800 }); // Match window size
      } else {
        Logger.debug('Using existing browser');
      }

      Logger.debug('Navigating to URL', { url });
      await global.page.goto(url, { waitUntil: 'domcontentloaded' });

      // Inject animation CSS and show initial status
      await BrowserUIAnimator.injectAnimationCSS(global.page);
      await BrowserUIAnimator.showProgressBar(global.page, 20, 'Navigation Complete');
      await BrowserUIAnimator.showStatusBadge(global.page, 'Analyzing Page...');

      const duration = timer.end();
      Logger.tool('open_browser', 'completed', duration, { url });

      return `Navigated to ${url}`;
    } catch (error) {
      const duration = timer.end();
      Logger.tool('open_browser', 'failed', duration, { url, error: error.message });
      throw error;
    }
  }
});

export default openBrowserTool;
