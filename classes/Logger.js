import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';

// Enhanced Logging System with Beautiful Colors
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let coloredLevel;
    
    switch (level.toLowerCase()) {
      case 'info':
        coloredLevel = chalk.blue.bold(`📍 ${level.toUpperCase()}`);
        break;
      case 'warn':
        coloredLevel = chalk.yellow.bold(`⚠️  ${level.toUpperCase()}`);
        break;
      case 'error':
        coloredLevel = chalk.red.bold(`❌ ${level.toUpperCase()}`);
        break;
      case 'debug':
        coloredLevel = chalk.gray.bold(`🔍 ${level.toUpperCase()}`);
        break;
      case 'success':
        coloredLevel = chalk.green.bold(`✅ ${level.toUpperCase()}`);
        break;
      case 'tool':
        coloredLevel = chalk.magenta.bold(`🔧 ${level.toUpperCase()}`);
        break;
      default:
        coloredLevel = chalk.white.bold(`📝 ${level.toUpperCase()}`);
    }
    
    console.log(`${chalk.gray(`[${timestamp}]`)} ${coloredLevel}: ${chalk.white(message)}`);
    if (data) {
      console.log(chalk.cyan('  📊 Data:'), chalk.dim(JSON.stringify(data, null, 2)));
    }
  }

  static info(message, data = null) { this.log('info', message, data); }
  static warn(message, data = null) { this.log('warn', message, data); }
  static error(message, data = null) { this.log('error', message, data); }
  static debug(message, data = null) { this.log('debug', message, data); }
  static success(message, data = null) { this.log('success', message, data); }

  static tool(toolName, status, duration = null, data = null) {
    const statusColor = status === 'completed' ? chalk.green('✅') : 
                       status === 'failed' ? chalk.red('❌') : 
                       chalk.yellow('⏳');
    
    this.log('tool', `${statusColor} ${chalk.bold(toolName)} - ${chalk.italic(status)}`, {
      tool: toolName,
      status,
      duration: duration ? `${duration}ms` : null,
      ...data
    });
  }

  static separator(char = '=', length = 80) {
    console.log(gradient.rainbow(char.repeat(length)));
  }

  static banner(text) {
    console.log(gradient.rainbow(figlet.textSync(text, { 
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })));
  }

  static box(content, title = '') {
    console.log(boxen(content, {
      title: title,
      titleAlignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
      backgroundColor: 'black'
    }));
  }
}

export default Logger;
