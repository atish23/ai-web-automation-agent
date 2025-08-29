import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';

const analyzeFormDOMTool = tool({
  name: 'analyze_form_dom',
  description: 'Analyzes forms using DOM inspection instead of screenshots',
  parameters: z.object({
    task: z.string().describe('The automation task'),
  }),
  async execute({ task }) {
    const timer = new Timer('analyze_form_dom');
    Logger.info('Analyzing forms using DOM inspection');

    if (!global.page) throw new Error('Browser not initialized');

    try {
      const formData = await global.page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        const formsData = [];

        forms.forEach((form, formIndex) => {
          const fields = [];
          const buttons = [];

          // Only collect essential field data
          form.querySelectorAll('input, textarea, select').forEach((field) => {
            const rect = field.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              fields.push({
                name: field.name || field.id || '',
                type: field.type || field.tagName.toLowerCase(),
                placeholder: field.placeholder || '',
                coordinates: {
                  x: Math.round(rect.x + rect.width / 2),
                  y: Math.round(rect.y + rect.height / 2)
                }
              });
            }
          });

          // Only collect essential button data
          form.querySelectorAll('button, input[type="submit"]').forEach((btn) => {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              buttons.push({
                text: btn.textContent?.trim() || btn.value || '',
                type: btn.type || 'button',
                coordinates: {
                  x: Math.round(rect.x + rect.width / 2),
                  y: Math.round(rect.y + rect.height / 2)
                }
              });
            }
          });

          formsData.push({
            formIndex,
            fields,
            buttons
          });
        });

        return {
          formsFound: formsData.length,
          forms: formsData
        };
      });

      const duration = timer.end();
      Logger.tool('analyze_form_dom', 'completed', duration, {
        formsFound: formData.formsFound
      });

      return JSON.stringify(formData, null, 2);
    } catch (error) {
      const duration = timer.end();
      Logger.tool('analyze_form_dom', 'failed', duration, { error: error.message });
      throw error;
    }
  }
});

export default analyzeFormDOMTool;
