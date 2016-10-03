import { BuildContext, fillConfigDefaults, generateContext, Logger, TaskInfo } from './util';
import { join } from 'path';


export function transpile(context?: BuildContext) {
  context = generateContext(context);

  const logger = new Logger('transpile');

  return transpileApp(context).then(() => {
    return logger.finish();
  }).catch((err: Error) => {
    logger.fail(err, err.message);
    return Promise.reject(err);
  });
}


export function transpileUpdate(event: string, path: string, context: BuildContext) {
  Logger.debug(`transpileUpdate, event: ${event}, path: ${path}`);

  return transpile(context);
}

export function transpileApp(context: BuildContext, transpileConfig?: TranspileConfig) {
  transpileConfig = fillConfigDefaults(context, transpileConfig, TRANSPILE_TASK_INFO);
  const srcFile = join(context.buildDir, transpileConfig.source);
  const destFile = join(context.buildDir, transpileConfig.destFileName);

  return transpile6To5(context, srcFile, destFile);
}


export function transpile6To5(context: BuildContext, srcFile: string, destFile: string) {
  return new Promise((resolve, reject) => {

    const spawn = require('cross-spawn');
    const tscCmd = join(context.rootDir, 'node_modules', '.bin', 'tsc');
    const tscCmdArgs = [
      '--out', destFile,
      '--target', 'es5',
      '--allowJs',
      '--sourceMap',
      srcFile
    ];
    let hadAnError = false;

    const ls = spawn(tscCmd, tscCmdArgs);

    ls.stdout.on('data', (data: string) => {
      Logger.info(data);
    });

    ls.stderr.on('data', (data: string) => {
      Logger.error(`transpile error: ${data}`);
      hadAnError = true;
    });

    ls.on('close', (code: string) => {
      if (hadAnError) {
        reject(new Error(`Transpiling from ES6 to ES5 encountered an error`));
      } else {
        resolve();
      }
    });

  });
}

export interface TranspileConfig {
  source: string;
  destFileName: string;
}

const TRANSPILE_TASK_INFO: TaskInfo = {
  fullArgConfig: '--tsc',
  shortArgConfig: '-tsc',
  envConfig: 'ionic_transpile',
  defaultConfigFilename: 'transpile.config'
};
