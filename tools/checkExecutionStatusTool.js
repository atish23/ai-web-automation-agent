import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';

const checkExecutionStatusTool = tool({
  name: 'check_execution_status',
  description: 'Checks if the automation task was completed successfully',
  parameters: z.object({}),
  async execute() {
    const timer = new Timer('check_execution_status');
    Logger.info('Checking execution status');

    if (!global.page) throw new Error('Browser not initialized');

    try {
      await global.page.waitForTimeout(500); // Reduced from 1000ms

      const status = await global.page.evaluate(() => {
        const currentUrl = window.location.href;

        return {
          url: currentUrl,
          hasSuccessMessage: document.body.textContent.toLowerCase().includes('success'),
          hasErrorMessage: document.body.textContent.toLowerCase().includes('error'),
          urlChanged: !currentUrl.includes('signup')
        };
      });

      const duration = timer.end();
      Logger.tool('check_execution_status', 'completed', duration);

      return JSON.stringify(status, null, 2);
    } catch (error) {
      const duration = timer.end();
      Logger.tool('check_execution_status', 'failed', duration, { error: error.message });
      throw error;
    }
  }
});

export default checkExecutionStatusTool;
