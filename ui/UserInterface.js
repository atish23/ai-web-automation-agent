import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import inquirer from 'inquirer';
import Logger from '../classes/Logger.js';
import BeautifulCLI from '../classes/BeautifulCLI.js';

class UserInterface {
  static async getUserInput() {
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

      case 'exit':
        console.log(gradient.rainbow('\n👋 Thank you for using Web Automation Agent!'));
        console.log(chalk.green('🚀 Happy automating! ✨\n'));
        process.exit(0);

      default:
        console.log(chalk.red('❌ Invalid option selected.'));
        return await UserInterface.getUserInput();
    }
  }

  static async runInteractiveAutomation(automateWebsite) {
    try {
      const userInput = await UserInterface.getUserInput();
      
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

  static startupAnimation(callback) {
    // Clear console for clean start
    console.clear();

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

      // Execute callback after startup
      callback();
    }, 2000);
  }

  static setupGracefulShutdown() {
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
        if (global.browser) {
          await global.browser.close();
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
      
      if (global.browser) {
        await global.browser.close();
      }
      
      console.log(gradient.rainbow('\n👋 Process terminated gracefully! ✨'));
      process.exit(0);
    });
  }
}

export default UserInterface;
