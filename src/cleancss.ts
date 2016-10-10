import { join } from 'path';
import { BuildContext, TaskInfo } from './util/interfaces';
import { generateContext, fillConfigDefaults } from './util/config';
import { BuildError, Logger } from './util/logger';
import { readFileAsync, writeFileAsync } from './util/helpers';
import * as cleanCss from 'clean-css';


export function cleancss(context?: BuildContext, cleanCssConfig?: CleanCssConfig) {
  context = generateContext(context);
  cleanCssConfig = fillConfigDefaults(context, cleanCssConfig, CLEANCSS_TASK_INFO);

  const logger = new Logger('cleancss');

  const srcFile = join(context.buildDir, cleanCssConfig.sourceFileName);
  const destFile = join(context.buildDir, cleanCssConfig.destFileName);

  return runCleanCss(srcFile, destFile).then(() => {
    return logger.finish();

  }).catch(err => {
    throw logger.fail(err);
  });
}


function runCleanCss(srcFile: string, destFile: string): Promise<any> {
  return new Promise((resolve, reject) => {

    Logger.debug(`cleancss read: ${srcFile}`);
    readFileAsync(srcFile).then(fileContent => {
      const minifier = new cleanCss();
      minifier.minify(fileContent, (err, minified) => {
        if (err) {
          reject(new BuildError(err));

        } else if ( minified.errors && minified.errors.length > 0) {
          // just return the first error for now I guess
          minified.errors.forEach(e => {
            Logger.error(e);
          });
          reject(new BuildError());

        } else {
          Logger.debug(`cleancss write: ${destFile}`);
          writeFileAsync(destFile, minified.styles).then(() => {
            resolve();
          });
        }
      });
    });

  });
}

const CLEANCSS_TASK_INFO: TaskInfo = {
  fullArgConfig: '--cleancss',
  shortArgConfig: '-e',
  envConfig: 'ionic_cleancss',
  defaultConfigFilename: 'cleancss.config'
};


export interface CleanCssConfig {
  // https://www.npmjs.com/package/clean-css
  sourceFileName: string;
  // sourceSourceMapName: string;
  destFileName: string;
  // destSourceMapName: string;
}
