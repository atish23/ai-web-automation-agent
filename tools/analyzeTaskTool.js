import { tool } from '@openai/agents';
import { z } from 'zod';
import OpenAI from 'openai';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

// Initialize OpenAI client
const openai = new OpenAI();

const analyzeTaskTool = tool({
  name: 'analyze_task',
  description: 'Analyzes the automation task and breaks it down into actionable steps',
  parameters: z.object({
    task: z.string().describe('The automation task to analyze'),
  }),
  async execute({ task }) {
    const timer = new Timer('analyze_task');
    Logger.info('Starting task analysis');

    try {
      // Show loader while waiting for AI analysis
      if (global.page) {
        await BrowserUIAnimator.showLoader(global.page, 'Analyzing task with AI...');
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Task: "${task}". Brief analysis only (1 sentence).`
        }],
        max_tokens: 50
      });

      // Hide loader after API response
      if (global.page) {
        await BrowserUIAnimator.hideLoader(global.page);
      }

      const result = response.choices[0].message.content || 'Analysis failed';
      const duration = timer.end();

      Logger.tool('analyze_task', 'completed', duration, {
        tokensUsed: response.usage?.total_tokens || 0
      });

      return result;
    } catch (error) {
      const duration = timer.end();
      Logger.tool('analyze_task', 'failed', duration, { error: error.message });
      throw error;
    }
  }
});

export default analyzeTaskTool;