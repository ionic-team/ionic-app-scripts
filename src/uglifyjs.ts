import { BuildContext, TaskInfo } from './util/interfaces';
import { fillConfigDefaults, generateContext } from './util/config';
import { join } from 'path';
import { BuildError, Logger } from './util/logger';
import { writeFileAsync } from './util/helpers';
import * as uglify from 'uglify-js';


export function uglifyjs(context?: BuildContext, uglifyJsConfig?: UglifyJsConfig) {
  context = generateContext(context);
  uglifyJsConfig = fillConfigDefaults(context, uglifyJsConfig, UGLIFY_TASK_INFO);

  const logger = new Logger('uglifyjs');

  return runUglify(context, uglifyJsConfig).then(() => {
    return logger.finish();

  }).catch(err => {
    throw logger.fail(err);
  });
}


function runUglify(context: BuildContext, uglifyJsConfig: UglifyJsConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // provide a full path for the config options
      uglifyJsConfig.sourceFile = join(context.buildDir, uglifyJsConfig.sourceFile);
      uglifyJsConfig.inSourceMap = join(context.buildDir, uglifyJsConfig.inSourceMap);
      uglifyJsConfig.destFileName = join(context.buildDir, uglifyJsConfig.destFileName);

      const minifiedOutputPath = join(context.buildDir, uglifyJsConfig.outSourceMap);
      const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);

      const writeFilePromises: Promise<any>[] = [
        writeFileAsync(uglifyJsConfig.destFileName, minifyOutput.code),
        writeFileAsync(minifiedOutputPath, minifyOutput.map)
      ];

      return Promise.all(writeFilePromises).then(() => {
        resolve();
      });

    } catch (e) {
      reject(new BuildError(e));
    }
  });
}


function runUglifyInternal(uglifyJsConfig: UglifyJsConfig): uglify.MinifyOutput {
  return uglify.minify(uglifyJsConfig.sourceFile, {
    compress: uglifyJsConfig.compress,
    mangle: uglifyJsConfig.mangle,
    outSourceMap: uglifyJsConfig.outSourceMap
  });
}


const UGLIFY_TASK_INFO: TaskInfo = {
  fullArgConfig: '--uglifyjs',
  shortArgConfig: '-u',
  envConfig: 'ionic_uglifyjs',
  defaultConfigFilename: 'uglifyjs.config'
};


export interface UglifyJsConfig {
  // https://www.npmjs.com/package/uglify-js
  sourceFile: string;
  destFileName: string;
  inSourceMap: string;
  outSourceMap: string;
  mangle: boolean;
  compress: boolean;
  comments: boolean;
}
