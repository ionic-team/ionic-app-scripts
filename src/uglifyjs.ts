import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { join } from 'path';
import { runWorker } from './worker-client';
import { writeFileAsync } from './util/helpers';
import * as uglify from 'uglify-js';


export function uglifyjs(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('uglifyjs');

  return runWorker('uglifyjs', 'uglifyjsWorker', context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function uglifyjsWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // provide a full path for the config options
      const uglifyJsConfig: UglifyJsConfig = fillConfigDefaults(configFile, taskInfo.defaultConfig);
      uglifyJsConfig.sourceFile = join(context.buildDir, uglifyJsConfig.sourceFile);
      uglifyJsConfig.inSourceMap = join(context.buildDir, uglifyJsConfig.inSourceMap);
      uglifyJsConfig.destFileName = join(context.buildDir, uglifyJsConfig.destFileName);

      const minifiedOutputPath = join(context.buildDir, uglifyJsConfig.outSourceMap);
      const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);

      const writeFilePromises = [
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


const taskInfo: TaskInfo = {
  fullArg: '--uglifyjs',
  shortArg: '-u',
  envVar: 'IONIC_UGLIFYJS',
  packageConfig: 'ionic_uglifyjs',
  defaultConfig: require('../config/uglifyjs.config.js')
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
