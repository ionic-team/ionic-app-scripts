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
    const lines = Logger.wordWrap(msg.join(' '));
    lines.forEach(line => {
      console.log(line);
    });
  }

  /**
   * Prints out a dim colored timestamp prefix.
   */
  static info(...msg: any[]) {
    const lines = Logger.wordWrap(msg.join(' '));
    if (lines.length) {
      let prefix = timePrefix();
      lines[0] = chalk.dim(prefix) + lines[0].substr(prefix.length);
    }
    lines.forEach(line => {
      console.log(line);
    });
  }

  /**
   * Prints out a yellow colored timestamp prefix.
   */
  static warn(...msg: any[]) {
    const lines = Logger.wordWrap(msg.join(' '));
    if (lines.length) {
      let prefix = timePrefix();
      lines[0] = prefix + lines[0].substr(prefix.length);
    }
    lines.forEach(line => {
      console.warn(chalk.yellow(line));
    });
  }

  /**
   * Prints out a error colored timestamp prefix.
   */
  static error(...msg: any[]) {
    const lines = Logger.wordWrap(msg.join(' '));
    if (lines.length) {
      let prefix = timePrefix();
      lines[0] = prefix + lines[0].substr(prefix.length);
      if (isDebugMode()) {
        lines[0] += memoryUsage();
      }
    }
    lines.forEach(line => {
      console.error(chalk.red(line));
    });
  }

  /**
   * Prints out a blue colored DEBUG prefix. Only prints out when debug mode.
   */
  static debug(...msg: any[]) {
    if (isDebugMode()) {
      msg.push(memoryUsage());

      const lines = Logger.wordWrap(msg.join(' '));
      if (lines.length) {
        let prefix = '[ DEBUG! ]';
        lines[0] = prefix + lines[0].substr(prefix.length);
      }
      lines.forEach(line => {
        console.log(chalk.cyan(line));
      });
    }
  }

  static printErrorLines(errorLines: PrintLine[]) {
    removeWhitespaceIndent(errorLines);

    errorLines.forEach(l => {
      let msg = 'L' + l.lineNumber + ':  ';
      while (msg.length < Logger.LEFT_PADDING.length) {
        msg = ' ' + msg;
      }
      msg = chalk.dim(msg) + Logger.jsSyntaxHighlight(l.text);
      console.log(msg);
    });

    Logger.newLine();
  }

  static highlightError(errorLine: string, errorCharStart: number, errorCharLength: number) {
    let rightSideChars = errorLine.length - errorCharStart + errorCharLength - 1;
    while (errorLine.length + Logger.LEFT_PADDING.length > Logger.MAX_LEN) {
      if (errorCharStart > (errorLine.length - errorCharStart + errorCharLength) && errorCharStart > 5) {
        // larger on left side
        errorLine = errorLine.substr(1);
        errorCharStart--;

      } else if (rightSideChars > 1) {
        // larger on right side
        errorLine = errorLine.substr(0, errorLine.length - 1);
        rightSideChars--;

      } else {
        break;
      }
    }

    const lineChars = errorLine.split('');
    for (var i = 0; i < lineChars.length; i++) {
      if (i >= errorCharStart && i < errorCharStart + errorCharLength) {
        lineChars[i] = chalk.bgRed(lineChars[i]);
      }
    }

    return lineChars.join('');
  }

  static wordWrap(text: string) {
    const output: string[] = [];
    let msgWords = text.toString().replace(/\s/gm, ' ').split(' ');

    let msgLine = '';
    msgWords.filter(m => m.length).forEach(m => {
      msgLine += m + ' ';
      if ((Logger.LEFT_PADDING.length + msgLine.length) > Logger.MAX_LEN) {
        output.push(Logger.LEFT_PADDING + msgLine);
        msgLine = '';
      }
    });
    if (msgLine.length) {
      output.push(Logger.LEFT_PADDING + msgLine);
    }
    return output;
  }


  static meaningfulLine(line: string) {
    if (line) {
      line = line.trim();
      if (line.length) {
        return (MEH_LINES.indexOf(line) < 0);
      }
    }
    return false;
  }


  static jsSyntaxHighlight(text: string) {
    if (text.trim().startsWith('//')) {
      return chalk.dim(text);
    }

    const words = text.split(' ').map(word => {
      if (JS_KEYWORDS.indexOf(word) > -1) {
        return chalk.cyan(word);
      }
      return word;
    });

    return words.join(' ');
  }


  static formatHeader(task: string, filename: string, rootDir: string, startLineNumber: number = null, endLineNumber: number = null) {
    let header = `${task}: `;
    filename = filename.replace(rootDir, '');
    if (/\/|\\/.test(filename.charAt(0))) {
      filename = filename.substr(1);
    }
    if (filename.length > 80) {
      filename = '...' + filename.substr(filename.length - 80);
    }

    if (startLineNumber !== null && startLineNumber > 0) {
      header += filename + ', ';

      if (endLineNumber !== null && endLineNumber > startLineNumber) {
        header += `lines: ${startLineNumber} - ${endLineNumber}`;
      } else {
        header += `line: ${startLineNumber}`;
      }
    }

    return header;
  }


  static newLine() {
    console.log('');
  }

  static LEFT_PADDING = '            ';
  static MAX_LEN = 100;

}


function removeWhitespaceIndent(lines: PrintLine[]) {
  for (var i = 0; i < 100; i++) {
    if (!eachLineHasLeadingWhitespace(lines)) {
      return;
    }
    for (var i = 0; i < lines.length; i++) {
      lines[i].text = lines[i].text.substr(1);
      if (!lines[i].text.length) {
        return;
      }
    }
  }
}


function eachLineHasLeadingWhitespace(lines: PrintLine[]) {
  if (!lines.length) {
    return false;
  }
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].text.length < 1) {
      return false;
    }
    var firstChar = lines[i].text.charAt(0);
    if (firstChar !== ' ' && firstChar !== '\t') {
      return false;
    }
  }
  return true;
}


function timePrefix() {
  const date = new Date();
  return '[' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ']';
}


function memoryUsage() {
  return chalk.dim(` MEM: ${(process.memoryUsage().rss / 1000000).toFixed(1)}MB`);
}


export function getAppScriptsVersion() {
  let rtn = '';
  try {
    const packageJson = readJSONSync(join(__dirname, '..', '..', 'package.json'));
    rtn = packageJson.version || '';
  } catch (e) {}
  return rtn;
}


export interface PrintLine {
  lineNumber: number;
  text: string;
}


const JS_KEYWORDS = [
  'as',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
];

const MEH_LINES = [';', ':', '{', '}', '(', ')', '/**', '/*', '*/', '*', '({', '})'];

