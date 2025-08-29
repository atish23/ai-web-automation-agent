import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

const clickAtCoordinatesTool = tool({
  name: 'click_at_coordinates',
  description: 'Clicks at specific coordinates on the page',
  parameters: z.object({
    x: z.number().describe('X coordinate'),
    y: z.number().describe('Y coordinate'),
  }),
  async execute({ x, y }) {
    const timer = new Timer('click_at_coordinates');
    Logger.info('Clicking at coordinates', { x, y });

    if (!global.page) throw new Error('Browser not initialized');

    try {
      // Show click animation and status
      await BrowserUIAnimator.showClickAnimation(global.page, x, y);
      await BrowserUIAnimator.showStatusBadge(global.page, `Clicking at (${x}, ${y})`);
      
      await global.page.mouse.click(x, y);
      
      // Show a brief loader for the wait
      if (global.page) {
        await BrowserUIAnimator.showLoader(global.page, 'Waiting for page response...');
      }
      await global.page.waitForTimeout(300); // Reduced from 800ms to 300ms
      if (global.page) {
        await BrowserUIAnimator.hideLoader(global.page);
      }
      
      // Show completion feedback
      await BrowserUIAnimator.showStatusBadge(global.page, 'Click completed!');

      const duration = timer.end();
      Logger.tool('click_at_coordinates', 'completed', duration, { x, y });

      return `Clicked at coordinates (${x}, ${y})`;
    } catch (error) {
      const duration = timer.end();
      Logger.tool('click_at_coordinates', 'failed', duration, { x, y, error: error.message });
      throw error;
    }
  }
});

export default clickAtCoordinatesTool;
