import { tool } from '@openai/agents';
import { z } from 'zod';
import OpenAI from 'openai';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

// Initialize OpenAI client
const openai = new OpenAI();

const matchTaskWithElementsTool = tool({
  name: 'match_task_with_elements',
  description: 'Matches automation task with elements and creates action plan',
  parameters: z.object({
    task: z.string().describe('The automation task'),
    elements: z.string().describe('JSON string of relevant elements'),
    formData: z.string().nullable().describe('JSON string of form data if available'),
  }),
  async execute({ task, elements, formData = '{}' }) {
    const timer = new Timer('match_task_with_elements');
    Logger.info('Matching task with elements', { task });

    try {
      // Show loader while waiting for AI to create action plan
      if (global.page) {
        await BrowserUIAnimator.showLoader(global.page, 'Creating action plan...');
      }
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Task: "${task}"
          
          Available elements: ${elements}
          Form data: ${formData}
          
          Create a precise action plan in VALID JSON format. MUST be complete and well-formed JSON.
          
          Example format:
          {
            "actions": [
              {
                "step": 1,
                "action": "fill",
                "element_index": 0,
                "coordinates": {"x": 100, "y": 200},
                "data": "John",
                "description": "Fill first name field"
              },
              {
                "step": 2,
                "action": "click",
                "element_index": 1,
                "coordinates": {"x": 300, "y": 400},
                "data": "",
                "description": "Click submit button"
              }
            ]
          }
          
          For signup tasks:
          1. Fill first name with "John" 
          2. Fill last name with "Doe"
          3. Fill email with "john@example.com"
          4. Fill password fields if present with "SecurePass123!"
          5. Click submit/create account button
          
          Return ONLY the JSON object. Ensure it's complete and valid JSON.`
        }],
        max_completion_tokens: 800,
        response_format: { type: "json_object" }
      });
      
      // Hide loader after API response
      if (global.page) {
        await BrowserUIAnimator.hideLoader(global.page);
      }
      
      const result = response.choices[0].message.content || '{"actions": []}';
      const duration = timer.end();

      Logger.tool('match_task_with_elements', 'completed', duration, {
        tokensUsed: response.usage?.total_tokens || 0,
        resultLength: result.length
      });

      // Log the generated action plan for debugging
      Logger.info('Generated action plan');

      return result;
    } catch (error) {
      const duration = timer.end();
      Logger.tool('match_task_with_elements', 'failed', duration, { error: error.message });
      throw error;
    }
  }
});

export default matchTaskWithElementsTool;
