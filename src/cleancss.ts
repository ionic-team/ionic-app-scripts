import { join } from 'path';
import { BuildContext, TaskInfo } from './util/interfaces';
import { generateContext, fillConfigDefaults } from './util/config';
import { Logger } from './util/logger';
import { readFileAsync, writeFileAsync } from './util/helpers';
import * as cleanCss from 'clean-css';


export function cleancss(context?: BuildContext, cleanCssConfig?: CleanCssConfig) {
  context = generateContext(context);
  cleanCssConfig = fillConfigDefaults(context, cleanCssConfig, CLEANCSS_TASK_INFO);

  const logger = new Logger('cleancss');

  const sourceFile = join(context.buildDir, cleanCssConfig.sourceFileName);
  const destFileName = join(context.buildDir, cleanCssConfig.destFileName);

  return readFileAsync(sourceFile).then((fileContent: string) => {
    Logger.debug(`cleancss read: ${sourceFile}`);
    return runCleanCss(fileContent);

  }).then((output) => {
    Logger.debug(`cleancss write: ${destFileName}`);
    return writeFileAsync(destFileName, output.styles);

  }).then(() => {
    return logger.finish();

  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}

function runCleanCss(fileContent: string): Promise<cleanCss.Output> {
  return new Promise( (resolve, reject) => {
    const minifier = new cleanCss();
    minifier.minify(fileContent, (err, minified) => {
      if (err) {
        reject(err);
      } else if ( minified.errors && minified.errors.length > 0) {
        // just return the first error for now I guess
        reject(new Error(minified.errors[0]));
      } else {
        resolve(minified);
      }
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
