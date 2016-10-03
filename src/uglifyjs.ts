import { join } from 'path';
import * as uglify from 'uglify-js';
import { BuildContext, generateContext, fillConfigDefaults, Logger, TaskInfo, writeFileAsync } from './util';

export function uglifyjs(context?: BuildContext, uglifyJsConfig?: UglifyJsConfig) {
  context = generateContext(context);
  uglifyJsConfig = fillConfigDefaults(context, uglifyJsConfig, UGLIFY_TASK_INFO);

  const logger = new Logger('uglifyjs');

  return runUglify(context, uglifyJsConfig).then(() => {
    return logger.finish();
  }).catch((err: Error) => {
    logger.fail(err, err.message);
    return Promise.reject(err);
  });
}

function runUglify(context: BuildContext, uglifyJsConfig: UglifyJsConfig): Promise<any> {
  try {
    // provide a full path for the config options
    uglifyJsConfig.sourceFile = join(context.buildDir, uglifyJsConfig.sourceFile);
    uglifyJsConfig.inSourceMap = join(context.buildDir, uglifyJsConfig.inSourceMap);
    uglifyJsConfig.destFileName = join(context.buildDir, uglifyJsConfig.destFileName);
    const minifiedOutputPath = join(context.buildDir, uglifyJsConfig.outSourceMap);
    const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);
    let writeFilePromises: Promise<any>[] = [];
    writeFilePromises.push(writeFileAsync(uglifyJsConfig.destFileName, minifyOutput.code));
    writeFilePromises.push(writeFileAsync(minifiedOutputPath, minifyOutput.map));
    return Promise.all(writeFilePromises);
  } catch (ex) {
    return Promise.reject(ex);
  }
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
