import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { chromium } from 'playwright';
import OpenAI from 'openai';
import 'dotenv/config';
import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import Table from 'cli-table3';

// Import our modular classes
import Logger from './classes/Logger.js';
import Timer from './classes/Timer.js';
import BrowserUIAnimator from './classes/BrowserUIAnimator.js';
import BeautifulCLI from './classes/BeautifulCLI.js';
import UserInterface from './ui/UserInterface.js';

// Import Tools
import analyzeTaskTool from './tools/analyzeTaskTool.js';
import openBrowserTool from './tools/openBrowserTool.js';
import analyzeFormDOMTool from './tools/analyzeFormDOMTool.js';
import findRelevantElementsTool from './tools/findRelevantElementsTool.js';
import matchTaskWithElementsTool from './tools/matchTaskWithElementsTool.js';
import clickAtCoordinatesTool from './tools/clickAtCoordinatesTool.js';
import fillFieldAtCoordinatesTool from './tools/fillFieldAtCoordinatesTool.js';
import executeActionPlanTool from './tools/executeActionPlanTool.js';
import checkExecutionStatusTool from './tools/checkExecutionStatusTool.js';
import checkLinksTool from './tools/checkLinksTool.js';
import waitAndScrollTool from './tools/waitAndScrollTool.js';

// Initialize OpenAI client
const openai = new OpenAI();

let browser;
let page;

// Make browser and page globally accessible for tools
global.browser = browser;
global.page = page;

// Main Website Automation Agent
const websiteAutomationAgent = new Agent({
  name: 'DOM-Based Website Automation Agent',
  instructions: ({ input }) => `
    You are an expert website automation agent. Your goal is to complete the following task as efficiently as possible:

    TASK: "${input}"

    For this task, follow these steps:
    1. analyze_task — Understand the task and extract key requirements and come up with a plan.
    2. open_browser — Navigate to the relevant website.
    3. check_links — Check all links on the page and consider their relevance to the task.
    4. If a relevant link is found, interact with it as needed (e.g., click, follow).
    5. wait_and_scroll — Wait for dynamic content to load and scroll to see more content.
    6. analyze_form_dom — Analyze the DOM for forms relevant to the task.
    7. If no form is found: find_relevant_elements → click_at_coordinates → analyze_form_dom.
    8. match_task_with_elements — Map task requirements to page elements.
    9. fill_field_at_coordinates — Fill in fields as needed.
    10. execute_action_plan — Perform the necessary actions to complete the task.
    11. check_execution_status — Verify if the task was completed successfully.

    IMPORTANT: After performing search actions or navigating to result pages, always use wait_and_scroll to:
    - Wait for dynamic content to load (3-5 seconds)
    - Scroll down multiple times to load more results
    - Allow lazy-loaded content to appear

    Always adapt your actions to the specific requirements of the task. Be immediate, efficient, and ensure you wait for content to fully load before proceeding.
  `,
  tools: [
    analyzeTaskTool,
    openBrowserTool,
    checkLinksTool,
    waitAndScrollTool,
    analyzeFormDOMTool,
    findRelevantElementsTool,
    clickAtCoordinatesTool,
    matchTaskWithElementsTool,
    fillFieldAtCoordinatesTool,
    executeActionPlanTool,
    checkExecutionStatusTool,
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
    if (global.page) {
      await BrowserUIAnimator.showLoader(global.page, 'AI Agent Processing...');
    }
    
    // Create progress spinner
    const spinner = ora({
      text: chalk.blue('🧠 AI Agent is thinking...'),
      color: 'blue',
      spinner: 'dots12'
    }).start();
    
    const result = await run(websiteAutomationAgent, task, {
      maxTurns: 20,
    });
    
    spinner.stop();
    
    // Hide loader when done
    if (global.page) {
      await BrowserUIAnimator.hideLoader(global.page);
      await BrowserUIAnimator.showStatusBadge(global.page, 'Task completed!');
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
    if (global.browser) {
      try {
        Logger.debug('Closing browser');
        await global.browser.close();
        Logger.info('Browser closed successfully');
      } catch (closeError) {
        Logger.warn('Error during browser cleanup', { error: closeError.message });
      }
    }
    Logger.info('Cleanup completed');
    Logger.separator('=', 80);
  }
}

// Application Entry Point with Beautiful Startup
UserInterface.setupGracefulShutdown();
UserInterface.startupAnimation(() => {
  UserInterface.runInteractiveAutomation(automateWebsite);
});

export { automateWebsite, websiteAutomationAgent };
