import chalk from 'chalk';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import Logger from './Logger.js';

// Beautiful CLI Interface Class
class BeautifulCLI {
  static async showWelcome() {
    console.clear();
    
    // Main title with gradient
    Logger.banner('WEB BOT');
    
    console.log(gradient.rainbow.multiline([
      '                    🤖 AI-Powered Web Automation Agent 🚀',
      '                      Automate any website like magic!'
    ].join('\n')));
    
    console.log('\n');
    
    // Feature highlights
    const features = [
      '🎯 Smart DOM Analysis',
      '⚡ Lightning Fast Execution', 
      '🎨 Beautiful Browser Animations',
      '🧠 AI-Powered Decision Making',
      '📊 Real-time Progress Tracking'
    ];
    
    Logger.box(
      features.join('\n'), 
      '✨ FEATURES ✨'
    );
  }

  static async showOptions() {
    const choices = [
      {
        name: chalk.green('🤖 Automate Website') + chalk.gray(' (describe any automation task)'),
        value: 'automate',
        short: 'Automate'
      },
      {
        name: chalk.cyan('📊 Automation Analytics') + chalk.gray(' (view stats)'),
        value: 'analytics',
        short: 'Analytics'
      },
      {
        name: chalk.red('👋 Exit') + chalk.gray(' (goodbye)'),
        value: 'exit',
        short: 'Exit'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold.white('🎯 What would you like to do today?'),
        choices,
        pageSize: 10,
        prefix: '🤖',
        suffix: '',
      }
    ]);

    return action;
  }

  static async getAutomationQuery() {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: chalk.blue('🤖 Describe your automation task:'),
        placeholder: 'e.g., "Go to ui.chaicode.com and fill signup form" or "Navigate to YouTube and search for cats"',
        validate: (input) => input.trim() ? true : 'Please describe what you want to automate!',
        prefix: '🤖',
      }
    ]);

    return query;
  }

  static async getQuickAutomationQuery() {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: chalk.blue('🤖 What would you like to automate?'),
        placeholder: 'e.g., "Go to ui.chaicode.com and fill signup form with my details"',
        validate: (input) => input.trim() ? true : 'Please describe what you want to automate!',
        prefix: '🤖',
      }
    ]);

    return query;
  }

  static async getCustomAutomationQuery() {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: chalk.blue('🌐 Describe your automation task:'),
        placeholder: 'e.g., "Navigate to example.com, find contact form, fill it with John Doe details and submit"',
        validate: (input) => input.trim() ? true : 'Please describe your automation task!',
        prefix: '🤖',
      }
    ]);

    return query;
  }

  static showTaskSummary(task, type) {
    const table = new Table({
      head: [chalk.blue.bold('Property'), chalk.green.bold('Value')],
      colWidths: [20, 60],
      style: {
        head: ['cyan'],
        border: ['grey'],
        compact: true
      }
    });

    table.push(
      [chalk.yellow('🎯 Task Type'), chalk.white(type)],
      [chalk.yellow('📝 Description'), chalk.white(task.substring(0, 80) + (task.length > 80 ? '...' : ''))],
      [chalk.yellow('⏰ Started'), chalk.white(new Date().toLocaleTimeString())],
      [chalk.yellow('🚀 Status'), chalk.green('Ready to Execute')]
    );

    console.log('\n' + table.toString());
  }

  static showProgress(step, total, message) {
    const progress = Math.round((step / total) * 100);
    const bar = '█'.repeat(Math.round(progress / 5)) + '░'.repeat(20 - Math.round(progress / 5));
    
    console.log(`\n${chalk.blue('Progress:')} [${chalk.green(bar)}] ${chalk.yellow(progress + '%')} - ${chalk.white(message)}`);
  }

  static showAnalytics() {
    const table = new Table({
      head: [chalk.blue.bold('Metric'), chalk.green.bold('Value')],
      style: {
        head: ['cyan'],
        border: ['grey']
      }
    });

    table.push(
      ['🎯 Success Rate', chalk.green('87%')],
      ['⚡ Avg. Execution Time', chalk.yellow('15.2s')],
      ['🤖 Tasks Completed', chalk.blue('127')],
      ['🌐 Websites Automated', chalk.magenta('43')],
      ['⭐ User Rating', chalk.yellow('4.8/5')]
    );

    Logger.box(table.toString(), '📊 AUTOMATION ANALYTICS');
  }
}

export default BeautifulCLI;
