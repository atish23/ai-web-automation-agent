import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { chromium } from 'playwright';
import OpenAI from 'openai';
import 'dotenv/config';
import readline from 'readline';

// Initialize OpenAI client
const openai = new OpenAI();

let browser;
let page;

// Enhanced Logging System
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  static info(message, data = null) { this.log('info', message, data); }
  static warn(message, data = null) { this.log('warn', message, data); }
  static error(message, data = null) { this.log('error', message, data); }
  static debug(message, data = null) { this.log('debug', message, data); }
  static success(message, data = null) { this.log('success', message, data); }

  static tool(toolName, status, duration = null, data = null) {
    this.log('tool', `${toolName} - ${status}`, {
      tool: toolName,
      status,
      duration: duration ? `${duration}ms` : null,
      ...data
    });
  }
}

class Timer {
  constructor(name) {
    this.name = name;
    this.startTime = performance.now();
  }

  end() {
    return Math.round(performance.now() - this.startTime);
  }
}

// Browser UI Animation Helper Class
class BrowserUIAnimator {
  static async injectAnimationCSS(page) {
    await page.addStyleTag({
      content: `
        /* Automation Visual Indicators */
        .automation-highlight {
          position: absolute;
          border: 3px solid #ff6b6b;
          border-radius: 8px;
          background: rgba(255, 107, 107, 0.1);
          pointer-events: none;
          z-index: 999999;
          animation: highlight-pulse 1s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        }
        
        .automation-click-indicator {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #4ecdc4;
          border-radius: 50%;
          background: rgba(78, 205, 196, 0.2);
          pointer-events: none;
          z-index: 999999;
          animation: click-ripple 0.8s ease-out;
          transform: translate(-50%, -50%);
        }
        
        .automation-typing-indicator {
          position: absolute;
          background: #45b7d1;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: Arial, sans-serif;
          pointer-events: none;
          z-index: 999999;
          animation: typing-bounce 0.5s ease-in-out infinite alternate;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .automation-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 4px;
          background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
          z-index: 999999;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }
        
        .automation-status-badge {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px 15px;
          border-radius: 25px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          z-index: 999999;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: status-fade-in 0.3s ease-in;
        }
        
        @keyframes highlight-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        
        @keyframes click-ripple {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
        }
        
        @keyframes typing-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-3px); }
        }
        
        @keyframes status-fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .automation-element-label {
          position: absolute;
          background: #2c3e50;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-family: Arial, sans-serif;
          pointer-events: none;
          z-index: 999999;
          white-space: nowrap;
        }
      `
    });
  }

  static async showProgressBar(page, progress, status) {
    await page.evaluate(({ progress, status }) => {
      // Remove existing progress bar
      const existing = document.querySelector('.automation-progress-bar');
      if (existing) existing.remove();

      // Create new progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'automation-progress-bar';
      progressBar.style.width = `${progress}%`;
      document.body.appendChild(progressBar);
    }, { progress, status });
  }

  static async showStatusBadge(page, status) {
    await page.evaluate((status) => {
      const existing = document.querySelector('.automation-status-badge');
      if (existing) existing.remove();

      const badge = document.createElement('div');
      badge.className = 'automation-status-badge';
      badge.textContent = `🤖 ${status}`;
      document.body.appendChild(badge);
    }, status);
  }

  static async highlightElement(page, x, y, label = '') {
    await page.evaluate(({ x, y, label }) => {
      const highlight = document.createElement('div');
      highlight.className = 'automation-highlight';
      
      // Position the highlight
      const element = document.elementFromPoint(x, y);
      if (element) {
        const rect = element.getBoundingClientRect();
        highlight.style.left = `${rect.left - 5}px`;
        highlight.style.top = `${rect.top - 5}px`;
        highlight.style.width = `${rect.width + 10}px`;
        highlight.style.height = `${rect.height + 10}px`;
      }

      document.body.appendChild(highlight);

      // Add label if provided
      if (label) {
        const labelEl = document.createElement('div');
        labelEl.className = 'automation-element-label';
        labelEl.textContent = label;
        labelEl.style.left = `${x + 10}px`;
        labelEl.style.top = `${y - 25}px`;
        document.body.appendChild(labelEl);

        setTimeout(() => labelEl.remove(), 2000);
      }

      // Remove highlight after animation
      setTimeout(() => highlight.remove(), 3000);
    }, { x, y, label });
  }

  static async showClickAnimation(page, x, y) {
    await page.evaluate(({ x, y }) => {
      const clickIndicator = document.createElement('div');
      clickIndicator.className = 'automation-click-indicator';
      clickIndicator.style.left = `${x}px`;
      clickIndicator.style.top = `${y}px`;
      document.body.appendChild(clickIndicator);

      setTimeout(() => clickIndicator.remove(), 800);
    }, { x, y });
  }

  static async showTypingAnimation(page, x, y, text) {
    await page.evaluate(({ x, y, text }) => {
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'automation-typing-indicator';
      typingIndicator.textContent = `✍️ Typing: ${text.substring(0, 20)}...`;
      typingIndicator.style.left = `${x + 10}px`;
      typingIndicator.style.top = `${y - 35}px`;
      document.body.appendChild(typingIndicator);

      setTimeout(() => typingIndicator.remove(), 2000);
    }, { x, y, text });
  }

  static async clearAllAnimations(page) {
    await page.evaluate(() => {
      document.querySelectorAll('.automation-highlight, .automation-click-indicator, .automation-typing-indicator, .automation-element-label').forEach(el => el.remove());
    });
  }

  // Show loader/spinner
  static async showLoader(page, message = 'Processing...') {
    await page.evaluate(({ message }) => {
      // Remove existing loader
      const existing = document.querySelector('#automation-loader');
      if (existing) existing.remove();

      const loader = document.createElement('div');
      loader.id = 'automation-loader';
      loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">${message}</div>
      `;
      loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 30px;
        border-radius: 15px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        font-weight: 500;
        text-align: center;
        z-index: 10003;
        backdrop-filter: blur(10px);
        animation: loaderFadeIn 0.3s ease-out;
      `;

      // Add spinner styles if not already present
      if (!document.querySelector('#loader-styles')) {
        const style = document.createElement('style');
        style.id = 'loader-styles';
        style.textContent = `
          .loader-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #2196F3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px auto;
          }
          .loader-text {
            color: #fff;
            font-size: 14px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes loaderFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes loaderFadeOut {
            from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(loader);
    }, { message });
  }

  // Hide loader
  static async hideLoader(page) {
    await page.evaluate(() => {
      const loader = document.querySelector('#automation-loader');
      if (loader) {
        loader.style.animation = 'loaderFadeOut 0.3s ease-in forwards';
        setTimeout(() => loader.remove(), 300);
      }
    });
  }
}

// Task Analysis Tool


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
      if (page) {
        await BrowserUIAnimator.showLoader(page, 'Analyzing task with AI...');
      }
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Task: "${task}". Brief analysis only (1 sentence).`
        }],
        max_tokens: 50 // Reduced from 100
      });
      
      // Hide loader after API response
      if (page) {
        await BrowserUIAnimator.hideLoader(page);
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
// Browser Control Tool
// 1. Speed up browser launch and navigation:

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
      if (!browser) {
        Logger.debug('Launching new browser with animations');
        browser = await chromium.launch({
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
        page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 800 }); // Match window size
      } else {
        Logger.debug('Using existing browser');
      }

      Logger.debug('Navigating to URL', { url });
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Inject animation CSS and show initial status
      await BrowserUIAnimator.injectAnimationCSS(page);
      await BrowserUIAnimator.showProgressBar(page, 20, 'Navigation Complete');
      await BrowserUIAnimator.showStatusBadge(page, 'Analyzing Page...');

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
// DOM-Based Form Analysis Tool
const analyzeFormDOMTool = tool({
  name: 'analyze_form_dom',
  description: 'Analyzes forms using DOM inspection instead of screenshots',
  parameters: z.object({
    task: z.string().describe('The automation task'),
  }),
  async execute({ task }) {
    const timer = new Timer('analyze_form_dom');
    Logger.info('Analyzing forms using DOM inspection');

    if (!page) throw new Error('Browser not initialized');

    try {
      const formData = await page.evaluate(() => {
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

// Smart Element Discovery Tool
const findRelevantElementsTool = tool({
  name: 'find_relevant_elements',
  description: 'Finds elements relevant to the automation task using DOM analysis',
  parameters: z.object({
    task: z.string().describe('The automation task to find elements for'),
  }),
  async execute({ task }) {
    const timer = new Timer('find_relevant_elements');
    Logger.info('Finding relevant elements');

    if (!page) throw new Error('Browser not initialized');

    try {
      const elementsData = await page.evaluate((userTask) => {
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

// Task-Element Matching Tool
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
      if (page) {
        await BrowserUIAnimator.showLoader(page, 'Creating action plan...');
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
        max_tokens: 800,
        response_format: { type: "json_object" }
      });
      
      // Hide loader after API response
      if (page) {
        await BrowserUIAnimator.hideLoader(page);
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

// Coordinate-based Interaction Tools
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

    if (!page) throw new Error('Browser not initialized');

    try {
      // Show click animation and status
      await BrowserUIAnimator.showClickAnimation(page, x, y);
      await BrowserUIAnimator.showStatusBadge(page, `Clicking at (${x}, ${y})`);
      
      await page.mouse.click(x, y);
      
      // Show a brief loader for the wait
      if (page) {
        await BrowserUIAnimator.showLoader(page, 'Waiting for page response...');
      }
      await page.waitForTimeout(300); // Reduced from 800ms to 300ms
      if (page) {
        await BrowserUIAnimator.hideLoader(page);
      }
      
      // Show completion feedback
      await BrowserUIAnimator.showStatusBadge(page, 'Click completed!');

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

    if (!page) throw new Error('Browser not initialized');

    try {
      // Show typing animation and status
      await BrowserUIAnimator.showClickAnimation(page, x, y);
      await BrowserUIAnimator.showStatusBadge(page, `Filling field at (${x}, ${y})`);
      
      // Single click to focus
      await page.mouse.click(x, y);
      await page.waitForTimeout(50); // Reduced from 200ms

      // Triple-click to select all content
      await page.mouse.click(x, y, { clickCount: 3 });
      await page.waitForTimeout(20); // Reduced from 50ms

      // Delete and type immediately
      await page.keyboard.press('Delete');
      await BrowserUIAnimator.showStatusBadge(page, `Typing: "${value}"`);
      await page.keyboard.type(value, { delay: 50 }); // Reduced from 100ms
      
      // Show a brief loader for the wait
      if (page) {
        await BrowserUIAnimator.showLoader(page, 'Processing input...');
      }
      await page.waitForTimeout(100); // Reduced from 200ms
      if (page) {
        await BrowserUIAnimator.hideLoader(page);
      }
      
      // Show completion feedback
      await BrowserUIAnimator.showStatusBadge(page, 'Field filled successfully!');

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

// Execute Action Plan Tool
// 4. Minimize delays in action execution:

const executeActionPlanTool = tool({
  name: 'execute_action_plan',
  description: 'Executes a series of actions from the action plan',
  parameters: z.object({
    actionPlan: z.string().describe('JSON string containing the action plan'),
  }),
  async execute({ actionPlan }) {
    const timer = new Timer('execute_action_plan');
    Logger.info('Executing action plan');

    if (!page) throw new Error('Browser not initialized');

    try {
      let plan = JSON.parse(actionPlan);
      const actions = plan.actions || plan;

      if (!Array.isArray(actions)) {
        throw new Error('Actions must be an array');
      }

      Logger.info(`Starting execution of ${actions.length} actions`);
      
      // Show initial progress
      await BrowserUIAnimator.showProgressBar(page, 0, `Executing ${actions.length} actions...`);

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const progress = Math.round((i / actions.length) * 100);
        
        Logger.info(`Executing step ${action.step}: ${action.action}`);
        await BrowserUIAnimator.showProgressBar(page, progress, `Step ${i + 1}/${actions.length}: ${action.action}`);

        if (action.action === 'click') {
          await BrowserUIAnimator.showClickAnimation(page, action.coordinates.x, action.coordinates.y);
          await BrowserUIAnimator.showStatusBadge(page, `Clicking at (${action.coordinates.x}, ${action.coordinates.y})`);
          await page.mouse.click(action.coordinates.x, action.coordinates.y);
          await page.waitForTimeout(300); // Reduced from 800ms

        } else if (action.action === 'fill') {
          // Super fast form filling
          await BrowserUIAnimator.showClickAnimation(page, action.coordinates.x, action.coordinates.y);
          await BrowserUIAnimator.showStatusBadge(page, `Filling field with "${action.data}"`);
          await page.mouse.click(action.coordinates.x, action.coordinates.y);
          await page.waitForTimeout(50); // Reduced from 200ms

          await page.mouse.click(action.coordinates.x, action.coordinates.y, { clickCount: 3 });
          await page.waitForTimeout(20); // Reduced from 50ms
          await page.keyboard.press('Delete');

          await page.keyboard.type(action.data, { delay: 50 }); // Reduced from 100ms
          await page.waitForTimeout(100); // Reduced from 200ms

        } else if (action.action === 'navigate') {
          await BrowserUIAnimator.showStatusBadge(page, `Navigating to ${action.data}`);
          await page.goto(action.data, { waitUntil: 'domcontentloaded' }); // Faster navigation
        }

        Logger.success(`Completed step ${action.step}`);
      }
      
      // Show completion
      await BrowserUIAnimator.showProgressBar(page, 100, 'All actions completed!');
      await BrowserUIAnimator.showStatusBadge(page, 'Execution finished successfully!');

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

// Execution Status Check Tool
// 6. Faster status checking:

const checkExecutionStatusTool = tool({
  name: 'check_execution_status',
  description: 'Checks if the automation task was completed successfully',
  parameters: z.object({}),
  async execute() {
    const timer = new Timer('check_execution_status');
    Logger.info('Checking execution status');

    if (!page) throw new Error('Browser not initialized');

    try {
      await page.waitForTimeout(500); // Reduced from 1000ms

      const status = await page.evaluate(() => {
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

// Main Website Automation Agent
// 7. Reduce maxTurns for faster completion:

const websiteAutomationAgent = new Agent({
  name: 'DOM-Based Website Automation Agent',
  instructions: `
    Execute these steps FAST:
    1. analyze_task 
    2. open_browser 
    3. analyze_form_dom 
    4. If no form: find_relevant_elements → click_at_coordinates → analyze_form_dom
    5. match_task_with_elements 
    6. execute_action_plan 
        
    Be IMMEDIATE and EFFICIENT. No delays.
  `,
  tools: [
    analyzeTaskTool,
    openBrowserTool,
    analyzeFormDOMTool,
    findRelevantElementsTool,
    matchTaskWithElementsTool,
    clickAtCoordinatesTool,
    fillFieldAtCoordinatesTool,
    executeActionPlanTool,
  ],
});

// Update run function with faster completion
async function automateWebsite(task) {
  const overallTimer = new Timer('automateWebsite');
  Logger.info('='.repeat(80));
  Logger.info('STARTING DOM-BASED WEBSITE AUTOMATION', { task });
  Logger.info('='.repeat(80));

  try {
    // Show loader if page is available
    if (page) {
      await BrowserUIAnimator.showLoader(page, 'AI Agent Processing...');
    }
    
    const result = await run(websiteAutomationAgent, task, {
      maxTurns: 10, // Reduced from 15 for faster completion
    });
    
    // Hide loader when done
    if (page) {
      await BrowserUIAnimator.hideLoader(page);
      await BrowserUIAnimator.showStatusBadge(page, 'Task completed!');
    }

    const totalDuration = overallTimer.end();
    Logger.success('='.repeat(80));
    Logger.success('AUTOMATION COMPLETED SUCCESSFULLY');
    Logger.success('='.repeat(80));

    Logger.success('Final Results', {
      agentName: result.lastAgent.name,
      totalDuration: `${totalDuration}ms`,
      historyLength: result.history.length,
      finalOutputLength: result.finalOutput?.length || 0
    });

    console.log('\n' + '='.repeat(50));
    console.log('FINAL OUTPUT:');
    console.log('='.repeat(50));
    console.log(result.finalOutput);
    console.log('='.repeat(50));

    return result;

  } catch (error) {
    const totalDuration = overallTimer.end();
    Logger.error('='.repeat(80));
    Logger.error('AUTOMATION FAILED');
    Logger.error('='.repeat(80));
    Logger.error('Automation failure details', {
      task,
      totalDuration: `${totalDuration}ms`,
      error: error.message,
      type: error.constructor.name
    });
    throw error;
  } finally {
    Logger.info('Starting cleanup process');
    if (browser) {
      try {
        Logger.debug('Closing browser');
        await browser.close();
        Logger.info('Browser closed successfully');
      } catch (closeError) {
        Logger.warn('Error during browser cleanup', { error: closeError.message });
      }
    }
    Logger.info('Cleanup completed');
    Logger.info('='.repeat(80));
  }
}

// Interactive User Input System
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getUserInput() {
  console.log('\n' + '='.repeat(80));
  console.log('🤖 INTERACTIVE WEB AUTOMATION AGENT');
  console.log('='.repeat(80));
  
  while (true) {
    console.log('\nOptions:');
    console.log('1. Run predefined signup automation (ui.chaicode.com)');
    console.log('2. Custom website automation');
    console.log('3. Quick form filling');
    console.log('4. Exit');
    
    const choice = await askQuestion('\nSelect an option (1-4): ');
    
    switch (choice.trim()) {
      case '1':
        return {
          type: 'predefined',
          task: `
            Navigate to ui.chaicode.com, 
            find the sign up form link, 
            fill it with name "John Doe", 
            email "john@example.com", 
            and submit it
          `
        };
        
      case '2':
        const url = await askQuestion('Enter the website URL: ');
        const task = await askQuestion('Describe what you want to automate: ');
        const name = await askQuestion('Enter name to use (or press Enter for "John Doe"): ') || 'John Doe';
        const email = await askQuestion('Enter email to use (or press Enter for "john@example.com"): ') || 'john@example.com';
        
        return {
          type: 'custom',
          task: `Navigate to ${url}, ${task}. Use name "${name}" and email "${email}".`
        };
        
      case '3':
        const formUrl = await askQuestion('Enter the form URL: ');
        const formName = await askQuestion('Enter name for form: ') || 'John Doe';
        const formEmail = await askQuestion('Enter email for form: ') || 'john@example.com';
        const formPhone = await askQuestion('Enter phone (optional, press Enter to skip): ');
        const formCompany = await askQuestion('Enter company (optional, press Enter to skip): ');
        
        let quickTask = `Navigate to ${formUrl}, find and fill the form with name "${formName}", email "${formEmail}"`;
        if (formPhone) quickTask += `, phone "${formPhone}"`;
        if (formCompany) quickTask += `, company "${formCompany}"`;
        quickTask += ', and submit it.';
        
        return {
          type: 'quick_form',
          task: quickTask
        };
        
      case '4':
        console.log('👋 Goodbye!');
        rl.close();
        process.exit(0);
        
      default:
        console.log('❌ Invalid option. Please choose 1-4.');
        continue;
    }
  }
}

async function runInteractiveAutomation() {
  try {
    const userInput = await getUserInput();
    rl.close();
    
    Logger.info('User selected automation task', userInput);
    
    console.log('\n' + '🚀 Starting automation...');
    console.log('Task:', userInput.task);
    console.log('\n' + '='.repeat(80));
    
    await automateWebsite(userInput.task);
    
  } catch (error) {
    Logger.error('Interactive automation failed', {
      error: error.message,
      stack: error.stack.split('\n').slice(0, 5).join('\n')
    });
    
    console.log('\n❌ Automation failed. Check the logs above for details.');
    rl.close();
    process.exit(1);
  }
}

// Application Entry Point
Logger.info('DOM-Based Automation Agent starting');
Logger.info('Environment check', {
  nodeVersion: process.version,
  env: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Missing'
});

// Graceful shutdown
process.on('SIGINT', async () => {
  Logger.warn('Received SIGINT, shutting down gracefully');
  rl.close();
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.warn('Received SIGTERM, shutting down gracefully');
  rl.close();
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Start interactive automation
runInteractiveAutomation();

export { automateWebsite, websiteAutomationAgent };
