import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';

const findRelevantElementsTool = tool({
  name: 'find_relevant_elements',
  description: 'Finds elements relevant to the automation task using DOM analysis',
  parameters: z.object({
    task: z.string().describe('The automation task to find elements for'),
  }),
  async execute({ task }) {
    const timer = new Timer('find_relevant_elements');
    Logger.info('Finding relevant elements');

    if (!global.page) throw new Error('Browser not initialized');

    try {
      const elementsData = await global.page.evaluate((userTask) => {
        const taskLower = userTask.toLowerCase();
        const relevantElements = [];

        // Simplified selector - only most common interactive elements
        const elements = document.querySelectorAll('a, button, input[type="submit"]');

        elements.forEach((element) => {
          const rect = element.getBoundingClientRect();

          if (rect.width > 0 && rect.height > 0) {
            const text = element.textContent?.trim().toLowerCase() || '';
            let relevanceScore = 0;

            // Simplified scoring
            if (taskLower.includes('sign up') && text.includes('sign up')) relevanceScore += 15;
            if (taskLower.includes('submit') && element.type === 'submit') relevanceScore += 8;
            if (taskLower.includes('register') && text.includes('register')) relevanceScore += 10;
            if (taskLower.includes('create') && text.includes('create')) relevanceScore += 8;

            if (relevanceScore > 0) {
              relevantElements.push({
                text: element.textContent?.trim().substring(0, 50) || '',
                type: element.type || '',
                coordinates: {
                  x: Math.round(rect.x + rect.width / 2),
                  y: Math.round(rect.y + rect.height / 2)
                },
                relevanceScore
              });
            }
          }
        });

        return relevantElements
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 5);

      }, task);

      const duration = timer.end();
      Logger.tool('find_relevant_elements', 'completed', duration, {
        elementsFound: elementsData.length
      });

      return JSON.stringify(elementsData, null, 2);
    } catch (error) {
      const duration = timer.end();
      Logger.tool('find_relevant_elements', 'failed', duration, { error: error.message });
      throw error;
    }
  }
});

export default findRelevantElementsTool;
