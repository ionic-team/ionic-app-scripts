import { BuildContext, TaskInfo } from './interfaces';
import { join } from 'path';


/**
 * Create a context object which is used by all the build tasks.
 * If config data wasn't already provided in the context, then
 * try to get the data from the command line arguments. Use the
 * defaults when no config data was provided.
 */
export function generateContext(context?: BuildContext): BuildContext {
  if (!context) {
    context = {
      runCompress: false
    };
  }

  context.rootDir = context.rootDir || getArgValue('--rootDir', '-r', process.cwd());

  context.tmpDir = context.tmpDir || getArgValue('--tmpDir', null, join(context.rootDir, TMP_DIR));

  context.configDir = context.configDir || getArgValue('--configDir', null, join(context.rootDir, CONFIG_DIR));

  context.srcDir = context.srcDir || getArgValue('--srcDir', null, join(context.rootDir, SRC_DIR));

  context.wwwDir = context.wwwDir || getArgValue('--wwwDir', null, join(context.rootDir, WWW_DIR));

  context.buildDir = context.buildDir || getArgValue('--buildDir', null, join(context.wwwDir, BUILD_DIR));

  if (typeof context.isDebugMode !== 'boolean') {
    (<any>global).isDebugMode = context.isDebugMode = isDebugMode();
    if (context.isDebugMode) {
      Logger.debug('Debugging enabled');
    }
  }

  return context;
}

export function fillConfigDefaults(context: BuildContext, taskConfig: TaskInfo): any {
  const defaultConfig = require(join('..', 'config', taskConfig.defaultConfigFilename));

  if (!(<any>context)[taskConfig.contextProperty]) {
    (<any>context)[taskConfig.contextProperty] = getArgConfigFile(taskConfig.fullArgConfig, taskConfig.shortArgConfig) || {};
  }

  assignDefaults((<any>context)[taskConfig.contextProperty], defaultConfig);
}


export function getArgConfigFile(fullName: string, shortName?: string): any {
  const configFile = getArgValue(fullName, shortName, null);

  if (configFile) {
    try {
      return require(configFile);
    } catch (e) {
      Logger.error(`Config "${configFile}" not found. Using defaults instead.`);
    }
  }

  return null;
}


export function getArgValue(fullName: string, shortName: string, defaultValue: string): string {
  for (var i = 2; i < argvLen; i++) {
    var arg = argv[i];
    if (arg === fullName || (shortName && arg === shortName)) {
      var val = argv[i + 1];
      if (val !== undefined && val !== '') {
        return val;
      }
    }
  }
  return defaultValue;
}


export function assignDefaults(userConfig: any, defaultConfig: any) {
  if (userConfig && defaultConfig) {
    for (var key in defaultConfig) {
      if (!Object.prototype.hasOwnProperty.call(userConfig, key)) {
        userConfig[key] = defaultConfig[key];
      }
    }
  }
}


export function replacePathVars(context: BuildContext, filePath: string) {
  return filePath.replace('{{SRC}}', context.srcDir)
                 .replace('{{WWW}}', context.wwwDir)
                 .replace('{{TMP}}', context.tmpDir)
                 .replace('{{ROOT}}', context.rootDir)
                 .replace('{{BUILD}}', context.buildDir);
}


export function isDebugMode() {
  return !!argv.find(a => a === '--debug' || a === '-d');
}


export class Logger {
  private start: number;
  private scope: string;

  constructor(scope: string) {
    this.start = Date.now();
    this.scope = scope;
    Logger.info(`${scope} started ...`);
  }

  finish() {
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

    Logger.info(`${this.scope} finished ${time}`);
    return true;
  }

  fail(msg: string) {
    Logger.info(`${this.scope} failed:  ${msg}`);
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
    if ((<any>global).isDebugMode) {
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


const argv = process.argv;
const argvLen = argv.length;

const BUILD_DIR = 'build';
const CONFIG_DIR = 'config';
const SRC_DIR = 'src';
const TMP_DIR = '.tmp';
const WWW_DIR = 'www';
