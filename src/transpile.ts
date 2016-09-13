import { BuildContext, generateContext, Logger } from './util';
import { join } from 'path';


export function transpile(context?: BuildContext) {
  context = generateContext(context);

  const logger = new Logger('transpile');

  return transpileApp(context).then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}


export function transpileUpdate(event: string, path: string, context: BuildContext) {
  return transpile(context);
}


export function transpileApp(context: BuildContext) {
  const srcFile = join(context.buildDir, 'main.es6.js');
  const destFile = join(context.buildDir, 'main.js');

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
        reject(`Transpiling from ES6 to ES5 encountered an error`);
      } else {
        resolve();
      }
    });

  });

}
