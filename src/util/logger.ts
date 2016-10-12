import { join } from 'path';
import { isDebugMode } from './config';
import { readJSONSync } from 'fs-extra';
import * as chalk from 'chalk';


export class BuildError extends Error {
  hasBeenLogged = false;

  constructor(err?: any) {
    super();
    if (err) {
      if (err.message) {
        this.message = err.message;
      } else if (err) {
        this.message = err;
      }
      if (err.stack) {
        this.stack = err.stack;
      }
      if (err.name) {
        this.name = err.name;
      }
      if (typeof err.hasBeenLogged === 'boolean') {
        this.hasBeenLogged = err.hasBeenLogged;
      }
    }
  }

  toJson() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
      hasBeenLogged: this.hasBeenLogged
    };
  }

}


export class Logger {
  private start: number;
  private scope: string;

  constructor(scope: string) {
    if (!printedAppScriptsVersion) {
      printedAppScriptsVersion = true;
      Logger.info(chalk.cyan(`ionic-app-scripts ${getAppScriptsVersion()}`));
    }

    this.start = Date.now();
    this.scope = scope;
    let msg = `${scope} started ${chalk.dim('...')}`;
    if (isDebugMode()) {
      msg += memoryUsage();
    }
    Logger.info(msg);
  }

  ready(chalkColor?: Function) {
    this.completed('ready', chalkColor);
  }

  finish(chalkColor?: Function) {
    this.completed('finished', chalkColor);
  }

  private completed(msg: string, chalkColor: Function) {
    let duration = Date.now() - this.start;
    let time: string;

    if (duration > 1000) {
      time = 'in ' + (duration / 1000).toFixed(2) + ' s';

    } else {
      let ms = parseFloat((duration).toFixed(3));
      if (ms > 0) {
        time = 'in ' + duration + ' ms';
      } else {
        time = 'in less than 1 ms';
      }
    }

    msg = `${this.scope} ${msg}`;
    if (chalkColor) {
      msg = chalkColor(msg);
    }

    msg += ' ' + chalk.dim(time);

    if (isDebugMode()) {
      msg += memoryUsage();
    }

    Logger.info(msg);
  }

  fail(err: BuildError) {
    if (err) {
      if (err instanceof BuildError) {
        let failedMsg = `${this.scope} failed`;
        if (err.message) {
          failedMsg += `: ${err.message}`;
        }

        if (!err.hasBeenLogged) {
          Logger.error(`${failedMsg}`);

          err.hasBeenLogged = true;

          if (err.stack && isDebugMode()) {
            Logger.debug(err.stack);
          }

        } else if (isDebugMode()) {
          Logger.debug(`${failedMsg}`);
        }
        return err;
      }
    }

    return err;
  }

  /**
   * Does not print out a time prefix or color any text. Only prefix
   * with whitespace so the message is lined up with timestamped logs.
   */
  static log(...msg: any[]) {
    console.log(`            ${msg.join(' ')}`);
  }

  /**
   * Prints out a dim colored timestamp prefix.
   */
  static info(...msg: any[]) {
    console.log(`${chalk.dim(timePrefix())}  ${msg.join(' ')}`);
  }

  /**
   * Prints out a yellow colored timestamp prefix.
   */
  static warn(...msg: any[]) {
    console.warn(chalk.yellow(`${timePrefix()}  ${msg.join(' ')}`));
  }

  /**
   * Prints out a error colored timestamp prefix.
   */
  static error(...msg: any[]) {
    let errMsg = chalk.red(`${timePrefix()}  ${msg.join(' ')}`);
    if (isDebugMode()) {
      errMsg += memoryUsage();
    }
    console.error(errMsg);
  }

  /**
   * Prints out a blue colored DEBUG prefix. Only prints out when debug mode.
   */
  static debug(...msg: any[]) {
    if (isDebugMode()) {
      msg.push(memoryUsage());
      console.log(`${chalk.cyan('[ DEBUG! ]')}  ${msg.join(' ')}`);
    }
  }

}

function timePrefix() {
  const date = new Date();
  return '[' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ']';
}

function memoryUsage() {
  return chalk.dim(` MEM: ${(process.memoryUsage().rss / 1000000).toFixed(1)}MB`);
}

let printedAppScriptsVersion = false;
function getAppScriptsVersion() {
  let rtn = '';
  try {
    const packageJson = readJSONSync(join(__dirname, '..', '..', 'package.json'));
    rtn = packageJson.version || '';
  } catch (e) {}
  return rtn;
}
