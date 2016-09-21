import { BuildContext, BuildOptions, generateContext, generateBuildOptions, getNodeBinExecutable, Logger } from './util';
import { join } from 'path';
import { emptyDirSync, outputJsonSync, readJsonSync, unlink } from 'fs-extra';


export function tsc(context?: BuildContext, options?: BuildOptions) {
  context = generateContext(context);
  options = generateBuildOptions(options);

  const logger = new Logger('typescript' + (options.isWatch ? ' watch' : ''));

  return runTsc(context, options).then(() => {
    if (options.isWatch) {
      return logger.ready();
    }
    return logger.finish();
  });
}


function runTsc(context: BuildContext, options: BuildOptions) {
  return new Promise((resolve, reject) => {

    // ensure the tmp directory is ready to go
    try {
      emptyDirSync(context.tmpDir);
    } catch (e) {
      reject(`tmpDir error: ${e}`);
      return false;
    }

    const tscCmd = getNodeBinExecutable(context, 'tsc');
    if (!tscCmd) {
      reject(`Unable to find typescript "tsc" command: ${tscCmd}`);
      return false;
    }

    const files: string[] = [];
    if (options.isProd) {
      files.push(join(context.srcDir, context.mainEntryProd));
    } else {
      files.push(join(context.srcDir, context.mainEntryDev));
    }

    const tmpTsConfigPath = createTmpTsConfig(context, files);

    const tscCmdArgs: string[] = [
      '--project', tmpTsConfigPath
    ];
    if (options.isWatch) {
      tscCmdArgs.push('--watch');
    }

    // would love to not use spawn here but import and run ngc directly
    const spawn = require('cross-spawn');
    const cp = spawn(tscCmd, tscCmdArgs);
    let watchLogger: Logger;

    cp.on('error', (err: string) => {
      reject(`tsc error: ${err}`);
    });

    cp.stdout.on('data', (data: string) => {
      data = data.toString();

      if (options.isWatch) {
        if (hasWords(data, 'starting', 'compilation')) {
          watchLogger = new Logger('typescript compilation');
          return;

        } else if (hasWords(data, 'compilation', 'complete')) {
          if (watchLogger) {
            watchLogger.finish();
            watchLogger = null;
          }

          resolve();
          return;
        }
      }
      Logger.info(data);
    });

    cp.stderr.on('data', (data: string) => {
      Logger.error(data);
    });

    cp.on('close', (data: string) => {
      unlink(tmpTsConfigPath);
      resolve();
    });

  });
}

function hasWords(data: string, ...words: string[]) {
  data = data.toString().toLowerCase();
  for (var i = 0; i < words.length; i++) {
    if (data.indexOf(words[i]) < 0) {
      return false;
    }
  }
  return true;
}

function createTmpTsConfig(context: BuildContext, files: string[]) {
  // create the tsconfig from the original src
  const tsConfig = getSrcTsConfig(context);

  // compile to a tmp directory
  tsConfig.compilerOptions.outDir = context.tmpDir;

  // force what files to include
  if (Array.isArray(tsConfig.files)) {
    tsConfig.files = tsConfig.files.concat(files);
  } else {
    tsConfig.files = files;
  }

  const tmpTsConfigPath = getTmpTsConfigPath(context);

  // save the modified copy into the tmp directory
  outputJsonSync(tmpTsConfigPath, tsConfig);

  return tmpTsConfigPath;
}


export function getSrcTsConfig(context: BuildContext): TsConfig {
  let srcTsConfig: TsConfig = null;
  const srcTsConfigPath = join(context.rootDir, TS_CONFIG_FILE);

  try {
    srcTsConfig = readJsonSync(srcTsConfigPath);
  } catch (e) {
    throw new Error(`Error reading tsconfig file "${srcTsConfigPath}", ${e}`);
  }

  if (!srcTsConfig) {
    throw new Error(`Invalid tsconfig file "${srcTsConfigPath}"`);
  }

  if (!srcTsConfig.compilerOptions) {
    throw new Error('TSConfig is missing necessary compiler options');
  }

  return srcTsConfig;
}


function getTmpTsConfigPath(context: BuildContext) {
  return join(context.rootDir, 'tsconfig.tmp.json');
}


export interface TsConfig {
  // https://www.typescriptlang.org/docs/handbook/compiler-options.html
  compilerOptions: {
    module: string;
    removeComments: boolean;
    outDir: string;
    target: string;
  };
  files: string[];
  exclude: string[];
}


const TS_CONFIG_FILE = 'tsconfig.json';
