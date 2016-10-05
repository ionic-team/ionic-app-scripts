import { join } from 'path';
import { isDebugMode } from './config';
import { readJSONSync } from 'fs-extra';


export class Logger {
  private start: number;
  private scope: string;

  constructor(scope: string) {
    if (!printedAppScriptsVersion) {
      printedAppScriptsVersion = true;
      Logger.info(`ionic-app-scripts ${getAppScriptsVersion()}`);
    }

    this.start = Date.now();
    this.scope = scope;
    Logger.info(`${scope} started ...`);
  }

  ready() {
    return this.completed('ready');
  }

  finish() {
    return this.completed('finished');
  }

  private completed(msg: string) {
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

    Logger.info(`${this.scope} ${msg} ${time}`);
    return true;
  }

  fail(err: Error, msg: string = null, printExceptionStack = true) {
    let printMessage = true;
    if (err && (err as any).hasBeenHandled === true) {
      // the exception has been handled, so don't print the message
      printMessage = false;
    }

    if (printMessage) {
      if (msg) {
        Logger.error(`${this.scope} failed:  ${msg}`);
      }

      if (err) {
        if (err.message) {
          Logger.error(`${this.scope} failed:  ${err.message}`);
        }
        if (typeof err === 'string') {
          Logger.error(err);
        }
        if (printExceptionStack && err.stack) {
          Logger.error(err.stack);
        }
      }
    }

    if (err) {
      (err as any).hasBeenHandled = true;
    }

    return false;
  }

  static info(...msg: string[]) {
    print('info', msg.join(' '));
  }

  static warn(...msg: string[]) {
    print('warn', msg.join(' '));
  }

  static error(...msg: string[]) {
    print('error', msg.join(' '));
  }

  static debug(...msg: string[]) {
    if (isDebugMode()) {
      msg.push(`- Memory: ${(process.memoryUsage().rss / 1000000).toFixed(2)}MB`);
      print('log', msg.join(' '), ' DEBUG! ');
    }
  }

}

function print(type: string, msg: string, prefix?: string) {
  const date = new Date();
  if (!prefix) {
    prefix = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
  }
  (<any>console)[type](`[${prefix}]  ${msg}`);
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
