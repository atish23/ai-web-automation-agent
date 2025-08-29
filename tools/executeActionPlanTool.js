import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

const executeActionPlanTool = tool({
  name: 'execute_action_plan',
  description: 'Executes a series of actions from the action plan',
  parameters: z.object({
    actionPlan: z.string().describe('JSON string containing the action plan'),
  }),
  async execute({ actionPlan }) {
    const timer = new Timer('execute_action_plan');
    Logger.info('Executing action plan');

    if (!global.page) throw new Error('Browser not initialized');

    try {
      let plan = JSON.parse(actionPlan);
      const actions = plan.actions || plan;

      if (!Array.isArray(actions)) {
        throw new Error('Actions must be an array');
      }

      Logger.info(`Starting execution of ${actions.length} actions`);
      
      // Show initial progress
      await BrowserUIAnimator.showProgressBar(global.page, 0, `Executing ${actions.length} actions...`);

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const progress = Math.round((i / actions.length) * 100);
        
        Logger.info(`Executing step ${action.step}: ${action.action}`);
        await BrowserUIAnimator.showProgressBar(global.page, progress, `Step ${i + 1}/${actions.length}: ${action.action}`);

        if (action.action === 'click') {
          await BrowserUIAnimator.showClickAnimation(global.page, action.coordinates.x, action.coordinates.y);
          await BrowserUIAnimator.showStatusBadge(global.page, `Clicking at (${action.coordinates.x}, ${action.coordinates.y})`);
          await global.page.mouse.click(action.coordinates.x, action.coordinates.y);
          await global.page.waitForTimeout(300); // Reduced from 800ms

        } else if (action.action === 'fill') {
          // Super fast form filling
          await BrowserUIAnimator.showClickAnimation(global.page, action.coordinates.x, action.coordinates.y);
          await BrowserUIAnimator.showStatusBadge(global.page, `Filling field with "${action.data}"`);
          await global.page.mouse.click(action.coordinates.x, action.coordinates.y);
          await global.page.waitForTimeout(50); // Reduced from 200ms

          await global.page.mouse.click(action.coordinates.x, action.coordinates.y, { clickCount: 3 });
          await global.page.waitForTimeout(20); // Reduced from 50ms
          await global.page.keyboard.press('Delete');

          await global.page.keyboard.type(action.data, { delay: 50 }); // Reduced from 100ms
          await global.page.waitForTimeout(100); // Reduced from 200ms

        } else if (action.action === 'navigate') {
          await BrowserUIAnimator.showStatusBadge(global.page, `Navigating to ${action.data}`);
          await global.page.goto(action.data, { waitUntil: 'domcontentloaded' }); // Faster navigation
        }

        Logger.success(`Completed step ${action.step}`);
      }
      
      // Show completion
      await BrowserUIAnimator.showProgressBar(global.page, 100, 'All actions completed!');
      await BrowserUIAnimator.showStatusBadge(global.page, 'Execution finished successfully!');

      const duration = timer.end();
      Logger.tool('execute_action_plan', 'completed', duration, {
        stepsExecuted: actions.length
      });

      return `Successfully executed ${actions.length} actions`;
    } catch (error) {
      const duration = timer.end();
      Logger.tool('execute_action_plan', 'failed', duration, { error: error.message });
      throw error;
    }
  }
});

export default executeActionPlanTool;
