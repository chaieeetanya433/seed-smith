import chalk from 'chalk';

class Logger {
  private verbose = false;

  setVerbose(value: boolean): void {
    this.verbose = value;
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ ') + message);
  }

  success(message: string): void {
    console.log(chalk.green('✓ ') + message);
  }

  warn(message: string): void {
    console.warn(chalk.yellow('⚠ ') + message);
  }

  error(message: string): void {
    console.error(chalk.red('✗ ') + message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('• ') + message);
    }
  }
}

export const logger = new Logger();
