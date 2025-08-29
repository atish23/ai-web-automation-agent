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
      maxTurns: 10, // Reduced from 15 for faster completion
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
