import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

const fillFieldAtCoordinatesTool = tool({
  name: 'fill_field_at_coordinates',
  description: 'Fills a form field at specific coordinates',
  parameters: z.object({
    x: z.number().describe('X coordinate'),
    y: z.number().describe('Y coordinate'),
    value: z.string().describe('Value to fill'),
  }),
  async execute({ x, y, value }) {
    const timer = new Timer('fill_field_at_coordinates');
    Logger.info('Filling field at coordinates', { x, y, valueLength: value.length });

    if (!global.page) throw new Error('Browser not initialized');

    try {
      // Show typing animation and status
      await BrowserUIAnimator.showClickAnimation(global.page, x, y);
      await BrowserUIAnimator.showStatusBadge(global.page, `Filling field at (${x}, ${y})`);
      
      // Single click to focus
      await global.page.mouse.click(x, y);
      await global.page.waitForTimeout(50); // Reduced from 200ms

      // Triple-click to select all content
      await global.page.mouse.click(x, y, { clickCount: 3 });
      await global.page.waitForTimeout(20); // Reduced from 50ms

      // Delete and type immediately
      await global.page.keyboard.press('Delete');
      await BrowserUIAnimator.showStatusBadge(global.page, `Typing: "${value}"`);
      await global.page.keyboard.type(value, { delay: 50 }); // Reduced from 100ms
      
      // Show a brief loader for the wait
      if (global.page) {
        await BrowserUIAnimator.showLoader(global.page, 'Processing input...');
      }
      await global.page.waitForTimeout(100); // Reduced from 200ms
      if (global.page) {
        await BrowserUIAnimator.hideLoader(global.page);
      }
      
      // Show completion feedback
      await BrowserUIAnimator.showStatusBadge(global.page, 'Field filled successfully!');

      const duration = timer.end();
      Logger.tool('fill_field_at_coordinates', 'completed', duration, {
        x, y, valueLength: value.length
      });

      return `Filled field at (${x}, ${y}) with "${value}"`;
    } catch (error) {
      const duration = timer.end();
      Logger.tool('fill_field_at_coordinates', 'failed', duration, {
        x, y, error: error.message
      });
      throw error;
    }
  }
});

export default fillFieldAtCoordinatesTool;
