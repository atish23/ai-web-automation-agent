import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { chromium } from 'playwright';
import OpenAI from 'openai';
import 'dotenv/config';
import readline from 'readline';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import Table from 'cli-table3';

// Import our modular classes
import Logger from './classes/Logger.js';
import Timer from './classes/Timer.js';
import BrowserUIAnimator from './classes/BrowserUIAnimator.js';
import BeautifulCLI from './classes/BeautifulCLI.js';

// Initialize OpenAI client
const openai = new OpenAI();

let browser;
let page;

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
        max_tokens: 50
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

// Update run function with beautiful progress display
async function automateWebsite(task) {
  const overallTimer = new Timer('automateWebsite');
  
  Logger.separator('=', 80);
  Logger.info('STARTING DOM-BASED WEBSITE AUTOMATION', { task });
  Logger.separator('=', 80);

  try {
    // Show beautiful loader if page is available
    if (page) {
      await BrowserUIAnimator.showLoader(page, 'AI Agent Processing...');
    }
    
    // Create progress spinner
    const spinner = ora({
      text: chalk.blue('🧠 AI Agent is thinking...'),
      color: 'blue',
      spinner: 'dots12'
    }).start();
    
    const result = await run(websiteAutomationAgent, task, {
      maxTurns: 10, // Reduced from 15 for faster completion
    });
    
    spinner.stop();
    
    // Hide loader when done
    if (page) {
      await BrowserUIAnimator.hideLoader(page);
      await BrowserUIAnimator.showStatusBadge(page, 'Task completed!');
    }

    const totalDuration = overallTimer.end();
    
    Logger.separator('=', 80);
    Logger.success('AUTOMATION COMPLETED SUCCESSFULLY');
    Logger.separator('=', 80);

    // Beautiful success display
    const successTable = new Table({
      head: [chalk.green.bold('Metric'), chalk.blue.bold('Value')],
      style: {
        head: ['green'],
        border: ['grey']
      }
    });

    successTable.push(
      ['🤖 Agent', result.lastAgent.name],
      ['⏱️  Total Duration', `${totalDuration}ms`],
      ['📊 Steps Executed', result.history.length.toString()],
      ['📝 Output Length', (result.finalOutput?.length || 0).toString() + ' chars'],
      ['✅ Status', 'SUCCESS']
    );

    Logger.box(successTable.toString(), '🎉 EXECUTION SUMMARY');

    console.log('\n' + gradient.rainbow('='.repeat(50)));
    console.log(gradient.rainbow('🎉 FINAL OUTPUT 🎉'));
    console.log(gradient.rainbow('='.repeat(50)));
    console.log(chalk.white(result.finalOutput));
    console.log(gradient.rainbow('='.repeat(50)));

    return result;

  } catch (error) {
    const totalDuration = overallTimer.end();
    
    Logger.separator('=', 80);
    Logger.error('AUTOMATION FAILED');
    Logger.separator('=', 80);
    
    const errorTable = new Table({
      head: [chalk.red.bold('Error Detail'), chalk.yellow.bold('Value')],
      style: {
        head: ['red'],
        border: ['grey']
      }
    });

    errorTable.push(
      ['🎯 Task', task.substring(0, 50) + '...'],
      ['⏱️  Duration', `${totalDuration}ms`],
      ['❌ Error', error.message],
      ['🔍 Type', error.constructor.name]
    );

    Logger.box(errorTable.toString(), '🚨 ERROR ANALYSIS');
    
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
    Logger.separator('=', 80);
  }
}

async function getUserInput() {
  await BeautifulCLI.showWelcome();

  const action = await BeautifulCLI.showOptions();

  switch (action) {
    case 'automate':
      const automationQuery = await BeautifulCLI.getAutomationQuery();

      BeautifulCLI.showTaskSummary(automationQuery, 'Website Automation');
      return {
        type: 'automation',
        task: automationQuery
      };

    case 'analytics':
      BeautifulCLI.showAnalytics();
      console.log(chalk.yellow('\n📊 Analytics displayed! Press any key to continue...'));
      await inquirer.prompt([{
        type: 'confirm',
        name: 'continue',
        message: 'Return to main menu?',
        default: true
      }]);
      return await getUserInput(); // Recursive call to show menu again

    case 'exit':
      console.log(gradient.rainbow('\n👋 Thank you for using Web Automation Agent!'));
      console.log(chalk.green('🚀 Happy automating! ✨\n'));
      process.exit(0);

    default:
      console.log(chalk.red('❌ Invalid option selected.'));
      return await getUserInput();
  }
}

async function runInteractiveAutomation() {
  try {
    const userInput = await getUserInput();
    
    Logger.info('User selected automation task', userInput);
    
    // Beautiful execution start
    console.log('\n');
    Logger.separator('🚀', 60);
    console.log(gradient.rainbow.multiline([
      '                    🤖 STARTING AUTOMATION 🚀',
      '                      Sit back and watch the magic!'
    ].join('\n')));
    Logger.separator('🚀', 60);
    
    // Show task details in a beautiful box
    Logger.box(
      `${chalk.blue('🎯 Task:')} ${chalk.white(userInput.task.trim())}\n\n` +
      `${chalk.green('⏰ Started:')} ${chalk.white(new Date().toLocaleString())}\n` +
      `${chalk.yellow('🤖 Agent:')} ${chalk.white('DOM-Based Automation Agent')}\n` +
      `${chalk.magenta('🚀 Status:')} ${chalk.white('Initializing...')}`,
      '🚀 EXECUTION DETAILS'
    );
    
    // Start spinner for execution
    const spinner = ora({
      text: chalk.blue('🤖 AI Agent is analyzing the task...'),
      color: 'cyan',
      spinner: 'dots12'
    }).start();
    
    // Small delay for effect
    setTimeout(() => {
      spinner.text = chalk.green('🚀 Launching browser and starting automation...');
    }, 1000);
    
    setTimeout(() => {
      spinner.stop();
    }, 2000);
    
    await automateWebsite(userInput.task);
    
  } catch (error) {
    Logger.error('Interactive automation failed', {
      error: error.message,
      stack: error.stack.split('\n').slice(0, 5).join('\n')
    });
    
    // Beautiful error display
    Logger.box(
      `${chalk.red.bold('❌ AUTOMATION FAILED')}\n\n` +
      `${chalk.yellow('Error:')} ${chalk.white(error.message)}\n` +
      `${chalk.yellow('Time:')} ${chalk.white(new Date().toLocaleString())}\n\n` +
      `${chalk.blue('💡 Tip:')} Check the logs above for detailed error information.`,
      '🚨 ERROR DETAILS'
    );
    
    process.exit(1);
  }
}

// Application Entry Point with Beautiful Startup
console.clear(); // Clear the console for a clean start

// Show loading animation
const startupSpinner = ora({
  text: chalk.blue('🚀 Initializing Web Automation Agent...'),
  color: 'cyan',
  spinner: 'dots12'
}).start();

// Simulate startup time for effect
setTimeout(() => {
  startupSpinner.text = chalk.green('✅ Loading AI modules...');
}, 500);

setTimeout(() => {
  startupSpinner.text = chalk.yellow('⚡ Preparing browser engine...');
}, 1000);

setTimeout(() => {
  startupSpinner.text = chalk.magenta('🎨 Initializing UI components...');
}, 1500);

setTimeout(() => {
  startupSpinner.stop();
  
  Logger.info('DOM-Based Automation Agent starting');
  Logger.info('Environment check', {
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    openaiApiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Missing'
  });

  // Start interactive automation after startup
  runInteractiveAutomation();
}, 2000);

// Graceful shutdown with beautiful messages
process.on('SIGINT', async () => {
  console.log('\n');
  Logger.warn('Received SIGINT, shutting down gracefully');
  
  const shutdownSpinner = ora({
    text: chalk.red('🛑 Shutting down gracefully...'),
    color: 'red',
    spinner: 'dots12'
  }).start();
  
  setTimeout(async () => {
    shutdownSpinner.text = chalk.yellow('💾 Saving session data...');
    if (browser) {
      await browser.close();
    }
    
    setTimeout(() => {
      shutdownSpinner.stop();
      console.log(gradient.rainbow('\n👋 Goodbye! Thanks for using Web Automation Agent! ✨'));
      process.exit(0);
    }, 1000);
  }, 500);
});

process.on('SIGTERM', async () => {
  console.log('\n');
  Logger.warn('Received SIGTERM, shutting down gracefully');
  
  if (browser) {
    await browser.close();
  }
  
  console.log(gradient.rainbow('\n👋 Process terminated gracefully! ✨'));
  process.exit(0);
});

export { automateWebsite, websiteAutomationAgent };
