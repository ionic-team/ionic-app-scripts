import { accessSync } from 'fs-extra';
import { BuildContext, BuildOptions, TaskInfo } from './interfaces';
import { join } from 'path';
import { objectAssign } from './helpers';


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

  context.rootDir = context.rootDir || getConfigValueDefaults('--rootDir', null, ENV_VAR_ROOT_DIR, processCwd, context);
  setProcessEnvVar(ENV_VAR_ROOT_DIR, context.rootDir);

  context.tmpDir = context.tmpDir || getConfigValueDefaults('--tmpDir', null, ENV_VAR_TMP_DIR, join(context.rootDir, TMP_DIR), context);
  setProcessEnvVar(ENV_VAR_TMP_DIR, context.tmpDir);

  context.srcDir = context.srcDir || getConfigValueDefaults('--srcDir', null, ENV_VAR_SRC_DIR, join(context.rootDir, SRC_DIR), context);
  setProcessEnvVar(ENV_VAR_SRC_DIR, context.srcDir);

  context.wwwDir = context.wwwDir || getConfigValueDefaults('--wwwDir', null, ENV_VAR_WWW_DIR, join(context.rootDir, WWW_DIR), context);
  setProcessEnvVar(ENV_VAR_WWW_DIR, context.wwwDir);

  context.buildDir = context.buildDir || getConfigValueDefaults('--buildDir', null, ENV_VAR_BUILD_DIR, join(context.wwwDir, BUILD_DIR), context);
  setProcessEnvVar(ENV_VAR_BUILD_DIR, context.buildDir);

  checkDebugMode();

  return context;
}


export function generateBuildOptions(options?: BuildOptions): BuildOptions {
  if (!options) {
    options = {};
  }

  if (typeof options.isProd !== 'boolean') {
    options.isProd = !(hasArg('--dev', '-d') || (getEnvVariable(ENV_VAR_IONIC_DEV) === 'true'));
  }

  setIonicEnvironment(options.isProd);

  if (typeof options.isWatch !== 'boolean') {
    options.isWatch = hasArg('--watch', '-w');
  }

  return options;
}


export function fillConfigDefaults(context: BuildContext, userConfig: any, task: TaskInfo): any {
  // if the context property wasn't already set, then see if a config file
  // was supplied by the user as an arg or env variable
  if (!userConfig) {
    userConfig = getConfigFileData(task.fullArgConfig, task.shortArgConfig, task.envConfig, null, context);
  }

  const defaultConfig = require(join('..', '..', 'config', task.defaultConfigFilename));

  // always assign any default values which were not already supplied by the user
  return objectAssign({}, defaultConfig, userConfig);
}


function getConfigFileData(fullName: string, shortName: string, envVarName: string, defaultValue: string, context: BuildContext): any {
  // see if the user supplied a value for where to look up their config file
  const configFilePath = getConfigValueDefaults(fullName, shortName, envVarName, null, context);

  if (configFilePath) {
    try {
      // create a fresh copy of the config each time
      const config = require(configFilePath);
      return objectAssign({}, config);

    } catch (e) {
      console.error(`Config file "${configFilePath}" not found. Using defaults instead.`);
      console.error(e);
    }
  }

  return null;
}


export function getConfigValueDefaults(argFullName: string, argShortName: string, envVarName: string, defaultValue: string, context: BuildContext) {
  // first see if the value was set in the command-line args
  const argValue = getArgValue(argFullName, argShortName);
  if (argValue) {
    return join(context.rootDir, argValue);
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the npm package.json config
  const envVar = getEnvVariable(envVarName);
  if (envVar) {
    return join(context.rootDir, envVar);
  }

  // return the default if nothing above was found
  return defaultValue;
}


function getEnvVariable(envVarName: string): string {
  // see if it was set in npm package.json config
  // which ends up as an env variable prefixed with "npm_package_config_"

  let val = getProcessEnvVar('npm_package_config_' + envVarName);
  if (val !== undefined) {
    return val;
  }

  // next see if it was just set as an environment variables
  val = getProcessEnvVar(envVarName);
  if (val !== undefined) {
    return val;
  }

  return null;
}


function getArgValue(fullName: string, shortName: string): string {
  for (var i = 2; i < processArgv.length; i++) {
    var arg = processArgv[i];
    if (arg === fullName || (shortName && arg === shortName)) {
      var val = processArgv[i + 1];
      if (val !== undefined && val !== '') {
        return val;
      }
    }
  }
  return null;
}


export function hasArg(fullName: string, shortName: string = null): boolean {
  return !!(processArgv.some(a => a === fullName) || (shortName !== null && processArgv.some(a => a === shortName)));
}


export function replacePathVars(context: BuildContext, filePath: string) {
  return filePath.replace('{{SRC}}', context.srcDir)
    .replace('{{WWW}}', context.wwwDir)
    .replace('{{TMP}}', context.tmpDir)
    .replace('{{ROOT}}', context.rootDir)
    .replace('{{BUILD}}', context.buildDir);
}


export function getNodeBinExecutable(context: BuildContext, cmd: string) {
  let cmdPath = join(context.rootDir, 'node_modules', '.bin', cmd);

  try {
    accessSync(cmdPath);
  } catch (e) {
    cmdPath = null;
  }

  return cmdPath;
}


let checkedDebug = false;
function checkDebugMode() {
  if (!checkedDebug) {
    if (hasArg('--debug') || getEnvVariable('ionic_debug_mode') === 'true') {
      processEnv.ionic_debug_mode = 'true';
    }
    checkedDebug = true;
  }
}


export function isDebugMode() {
  return (processEnv.ionic_debug_mode === 'true');
}


export function setIonicEnvironment(isProd: boolean) {
  setProcessEnvVar(ENV_VAR_IONIC_ENV, (isProd ? ENV_VAR_PROD : ENV_VAR_DEV));
}


export function getRootDir() {
  return getProcessEnvVar(ENV_VAR_ROOT_DIR);
}


let processArgv: string[];
export function setProcessArgs(argv: string[]) {
  processArgv = argv;
}
setProcessArgs(process.argv);

export function addArgv(value: string) {
  processArgv.push(value);
}

let processEnv: any;
export function setProcessEnv(env: any) {
  processEnv = env;
}
setProcessEnv(process.env);

export function setProcessEnvVar(key: string, value: any) {
  processEnv[key] = value;
}

export function getProcessEnvVar(key: string): string {
  const val = processEnv[key];
  if (typeof val === 'boolean') {
    // ensure this always returns a string
    return val.toString();
  }
  return val;
}

let processCwd: string;
export function setCwd(cwd: string) {
  processCwd = cwd;
}
setCwd(process.cwd());


const BUILD_DIR = 'build';
const SRC_DIR = 'src';
const TMP_DIR = '.tmp';
const WWW_DIR = 'www';

const ENV_VAR_PROD = 'prod';
const ENV_VAR_DEV = 'dev';

const ENV_VAR_IONIC_ENV = 'IONIC_ENV';
const ENV_VAR_IONIC_DEV = 'ionic_dev';
const ENV_VAR_ROOT_DIR = 'ionic_root_dir';
const ENV_VAR_TMP_DIR = 'ionic_tmp_dir';
const ENV_VAR_SRC_DIR = 'ionic_src_dir';
const ENV_VAR_WWW_DIR = 'ionic_www_dir';
const ENV_VAR_BUILD_DIR = 'ionic_build_dir';
