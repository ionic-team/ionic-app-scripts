import { BuildContext, TaskInfo, TsFiles, TsFile } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { setModulePathsCache, writeFileAsync } from './util/helpers';
import { emit, EventType } from './util/events';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars } from './util/config';
import { basename, dirname, join } from 'path';
import * as webpackApi from 'webpack';
import { mkdirs } from 'fs-extra';

import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();
const INCREMENTAL_BUILD_FAILED = 'incremental_build_failed';
const INCREMENTAL_BUILD_SUCCESS = 'incremental_build_success';

export function webpack(context: BuildContext, configFile: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('webpack');

  return webpackWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function webpackUpdate(event: string, path: string, context: BuildContext, configFile: string) {
  const logger = new Logger('webpack update');
  const files = updateFile(context.fileChanged, context.tsFiles);
  const webpackConfig = getWebpackConfig(context, configFile);
  return writeFilesToDisk(files, context)
    .then(() => {
      Logger.debug('Wrote updated file to disk');
      return runWebpackIncrementalBuild(false, webpackConfig);
    }).then((stats: any) => {
      Logger.debug('Incremental Build Done');
      return webpackBuildComplete(stats, context, webpackConfig);
    }).then(() => {
      return logger.finish();
    }).catch(err => {
      throw logger.fail(err);
    });
}


export function webpackWorker(context: BuildContext, configFile: string): Promise<any> {
  const webpackConfig = getWebpackConfig(context, configFile);

  // in order to use watch mode, we need to write the
  // transpiled files to disk, so go ahead and do that
  let files = createFileList(context.tsFiles);
  return writeFilesToDisk(files, context)
    .then(() => {
      Logger.debug('Wrote .js files to disk');
      if (context.isProd) {
        return runWebpackFullBuild(webpackConfig);
      } else {
        return runWebpackIncrementalBuild(true, webpackConfig);
      }
    }).then((stats: any) => {
      return webpackBuildComplete(stats, context, webpackConfig);
    });
}

function webpackBuildComplete(stats: any, context: BuildContext, webpackConfig: WebpackConfig) {
  // set the module files used in this bundle
  // this reference can be used elsewhere in the build (sass)
  const files = stats.compilation.modules.map((webpackObj: any) => {
    if (webpackObj.resource) {
      return webpackObj.resource;
    } else {
      return webpackObj.context;
    }
  }).filter((path: string) => {
    // just make sure the path is not null
    return path && path.length > 0;
  });

  context.moduleFiles = files;

  // async cache all the module paths so we don't need
  // to always bundle to know which modules are used
  setModulePathsCache(context.moduleFiles);

  emit(EventType.FileChange, getOutputDest(context, webpackConfig));
  return Promise.resolve();
}

function runWebpackFullBuild(config: WebpackConfig) {
  return new Promise((resolve, reject) => {
    const callback = (err: Error, stats: any) => {
      if (err) {
        reject(new BuildError(err));
      } else {
        resolve(stats);
      }
    };

    const compiler = webpackApi(config);
    compiler.run(callback);
  });
}

function runWebpackIncrementalBuild(initializeWatch: boolean, config: WebpackConfig) {
  return new Promise((resolve, reject) => {
    // start listening for events, remove listeners once an event is received
    eventEmitter.on(INCREMENTAL_BUILD_FAILED, (err: Error) => {
      eventEmitter.removeAllListeners();
      reject(new BuildError(err));
    });

    eventEmitter.on(INCREMENTAL_BUILD_SUCCESS, (stats: any) => {
      eventEmitter.removeAllListeners();
      resolve(stats);
    });

    if (initializeWatch) {
      startWebpackWatch(config);
    }

  });
}

function startWebpackWatch(config: WebpackConfig) {
  const compiler = webpackApi(config);
  compiler.watch({}, (err: Error, stats: any) => {
    if (err) {
      eventEmitter.emit(INCREMENTAL_BUILD_FAILED, err);
    } else {
      eventEmitter.emit(INCREMENTAL_BUILD_SUCCESS, stats);
    }
  });
}

export function getWebpackConfig(context: BuildContext, configFile: string): WebpackConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  let webpackConfig: WebpackConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  webpackConfig.entry = replacePathVars(context, webpackConfig.entry);
  webpackConfig.output.path = replacePathVars(context, webpackConfig.output.path);

  return webpackConfig;
}


export function getOutputDest(context: BuildContext, webpackConfig: WebpackConfig) {
  return join(webpackConfig.output.path, webpackConfig.output.filename);
}

function writeFilesToDisk(files: TsFile[], context: BuildContext) {
  let promises: Promise<any>[] = [];
  for (const file of files) {
    const filePath = transformPath(file.input, context);
    promises.push(writeIndividualFile(filePath, file.output, file.map));
  }
  return Promise.all(promises);
}

function writeIndividualFile(filePath: string, content: string, sourcemap: string) {
  return ensureDirectoriesExist(filePath)
    .then(() => {
      return Promise.all([
        writeFileAsync(filePath, content),
        writeFileAsync(filePath + '.map', sourcemap)
      ]);
    });
}

function transformPath(originalPath: string, context: BuildContext) {
  const tmpPath = originalPath.replace(context.srcDir, context.tmpDir);
  const fileName = basename(tmpPath, '.ts');
  return join(dirname(tmpPath), fileName + '.js');
}

function ensureDirectoriesExist(path: string) {
  return new Promise((resolve, reject) => {
    const directoryName = dirname(path);
    mkdirs(directoryName, err => {
      if (err) {
        reject(new BuildError(err));
      } else {
        resolve();
      }
    });
  });
}

function createFileList(tsFiles: TsFiles) {
  let files: TsFile[] = [];
  for ( let key in tsFiles ) {
    let file = tsFiles[key];
    file.input = key;
    files.push(file);
  }
  return files;
}

function updateFile(fileChangedPath: string, tsFiles: TsFiles) {
  let files: TsFile[] = [];
  let file = tsFiles[fileChangedPath];
  file.input = fileChangedPath;
  files.push(file);
  return files;
}

const taskInfo: TaskInfo = {
  fullArgConfig: '--webpack',
  shortArgConfig: '-w',
  envConfig: 'ionic_webpack',
  defaultConfigFile: 'webpack.config'
};


export interface WebpackConfig {
  // https://www.npmjs.com/package/webpack
  devtool: string;
  entry: string;
  output: WebpackOutputObject;
}

export interface WebpackOutputObject {
  path: string;
  filename: string;
}
