import { join } from 'path';
import { readFile, writeFile } from 'fs';

/**
 * Create a context object which is used by all the build tasks.
 * Filling the config data uses the following hierarchy, which will
 * keep going down the list until it, or if it, finds data.
 *
 * 1) Get from the passed in context variable
 * 2) Get from the config file set using the command-line args
 * 3) Get from npm package.json config
 * 4) Get environment variables
 *
 * Lastly, Ionic's default configs will always fill in any data
 * which is missing from the user's data.
 */
export function generateContext(context?: BuildContext): BuildContext {
  if (!context) {
    context = {};
  }

  context.rootDir = context.rootDir || getConfigValueDefaults('--rootDir', null, 'ionic_root_dir', process.cwd());

  context.tmpDir = context.tmpDir || getConfigValueDefaults('--tmpDir', null, 'ionic_tmp_dir', join(context.rootDir, TMP_DIR));

  context.srcDir = context.srcDir || getConfigValueDefaults('--srcDir', null, 'ionic_src_dir', join(context.rootDir, SRC_DIR));

  context.wwwDir = context.wwwDir || getConfigValueDefaults('--wwwDir', null, 'ionic_www_dir', join(context.rootDir, WWW_DIR));

  context.buildDir = context.buildDir || getConfigValueDefaults('--buildDir', null, 'ionic_build_dir', join(context.wwwDir, BUILD_DIR));

  checkDebugMode();

  return context;
}


export function fillConfigDefaults(context: BuildContext, config: any, task: TaskInfo): any {
  // if the context property wasn't already set, then see if a config file
  // was been supplied by the user as an arg or env variable
  (<any>context)[task.contextProperty] = config;
  if (!(<any>context)[task.contextProperty]) {
    (<any>context)[task.contextProperty] = getConfigFileData(task.fullArgConfig, task.shortArgConfig, task.envConfig, null) || {};
  }

  const defaultConfig = require(join('..', 'config', task.defaultConfigFilename));

  // always assign any default values which were not already supplied by the user
  assignDefaults((<any>context)[task.contextProperty], defaultConfig);

  return (<any>context)[task.contextProperty];
}


function getConfigFileData(fullName: string, shortName: string, envVarName: string, defaultValue: string): any {
  // see if the user supplied a value for where to look up their config file
  const configFilePath = getConfigValueDefaults(fullName, shortName, envVarName, null);

  if (configFilePath) {
    try {
      return require(configFilePath);
    } catch (e) {
      Logger.error(`Config file "${configFilePath}" not found. Using defaults instead.`);
      Logger.error(e);
    }
  }

  return null;
}


function getConfigValueDefaults(argFullName: string, argShortName: string, envVarName: string, defaultValue: string) {
  // first see if the value was set in the command-line args
  const argValue = getArgValue(argFullName, argShortName);
  if (argValue) {
    return argValue;
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the npm package.json config
  const envVar = getEnvVariable(envVarName);
  if (envVar) {
    return envVar;
  }

  // return the default if nothing above was found
  return defaultValue;
}


function getEnvVariable(envVarName: string): string {
  // see if it was set in npm package.json config
  // which ends up as an env variable prefixed with "npm_package_config_"
  envVarName = 'npm_package_config_' + envVarName;
  if (process.env[envVarName] !== undefined) {
    return process.env[envVarName];
  }

  // next see if it was just set as an environment variables
  if (process.env[envVarName] !== undefined) {
    return process.env[envVarName];
  }

  return null;
}


function getArgValue(fullName: string, shortName: string): string {
  for (var i = 2; i < argvLen; i++) {
    var arg = argv[i];
    if (arg === fullName || (shortName && arg === shortName)) {
      var val = argv[i + 1];
      if (val !== undefined && val !== '') {
        return val;
      }
    }
  }
  return null;
}


function assignDefaults(userConfig: any, defaultConfig: any) {
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

export function writeFileAsync(filePath: string, content: string): Promise<any> {
  return new Promise( (resolve, reject) => {
    writeFile(filePath, content, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function readFileAsync(filePath: string): Promise<string> {
  return new Promise( (resolve, reject) => {
    readFile(filePath, function(err, buffer) {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString());
      }
    });
  });
}


let checkedDebug = false;
function checkDebugMode() {
  if (!checkedDebug) {
    if (argv.some(a => a === '--debug') || getEnvVariable('ionic_debug_mode') === 'true') {
      process.env.ionic_debug_mode = 'true';
    }

    if (isDebugMode()) {
      Logger.debug('Debugging enabled');
    }
    checkedDebug = true;
  }
}


function isDebugMode() {
  return (process.env.ionic_debug_mode === 'true');
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
    if (isDebugMode()) {
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
const SRC_DIR = 'src';
const TMP_DIR = '.tmp';
const WWW_DIR = 'www';


export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  buildDir?: string;
  moduleFiles?: string[];
}


export interface BuildOptions {
  runCompress?: boolean;
}


export interface TaskInfo {
  contextProperty: string;
  fullArgConfig: string;
  shortArgConfig: string;
  envConfig: string;
  defaultConfigFilename: string;
}
