import { extname } from 'path';
import { Logger } from './logger/logger';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { readAndCacheFile } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { runWebpackFullBuild, WebpackConfig } from './webpack';
import { purgeDecorators } from './optimization/decorators';
import { calculateTreeShakeResults, purgeUnusedImportsFromIndex } from './optimization/treeshake';

export function optimization(context: BuildContext, configFile: string) {
  const logger = new Logger(`optimization`);
  return optimizationWorker(context, configFile).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}

function optimizationWorker(context: BuildContext, configFile: string) {
  const webpackConfig = getConfig(context, configFile);
  return runWebpackFullBuild(webpackConfig).then((stats: any) => {
    const dependencyMap = processStats(context, stats);

    // remove decorators
    removeDecorators(context);
    // remove unused component imports

    const results = calculateTreeShakeResults(dependencyMap);
    return purgeUnusedImports(context, results.purgedModules);
  });
}

function removeDecorators(context: BuildContext) {
  const jsFiles = context.fileCache.getAll().filter(file => extname(file.path) === '.js');
  jsFiles.forEach(jsFile => {
    jsFile.content = purgeDecorators(jsFile.path, jsFile.content);
  });
}

function purgeUnusedImports(context: BuildContext, purgeDependencyMap: Map<string, Set<string>>) {
  // for now, restrict this to components in the ionic-angular/index.js file
  const indexFilePath = process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT];
  const file = context.fileCache.get(indexFilePath);
  const modulesToPurge: string[] = [];
  purgeDependencyMap.forEach((set: Set<string>, moduleToPurge: string) => {
    modulesToPurge.push(moduleToPurge);
  });

  const updatedFileContent = purgeUnusedImportsFromIndex(indexFilePath, file.content, modulesToPurge);
  context.fileCache.set(indexFilePath, { path: indexFilePath, content: updatedFileContent });
}

function processStats(context: BuildContext, stats: any) {
  const statsObj = stats.toJson({
    source: false,
    timings: false,
    version: false,
    errorDetails: false,
    chunks: false,
    chunkModules: false
  });
  return processStatsImpl(context, statsObj);
}

function processStatsImpl(context: BuildContext, webpackStats: WebpackStats) {
  const dependencyMap = new Map<string, Set<string>>();
  webpackStats.modules.forEach(webpackModule => {
    const moduleId = purgeWebpackPrefixFromPath(webpackModule.identifier);
    const dependencySet = new Set<string>();
    webpackModule.reasons.forEach(webpackDependency => {
      const depId = purgeWebpackPrefixFromPath(webpackDependency.moduleIdentifier);
      dependencySet.add(depId);
    });
    dependencyMap.set(moduleId, dependencySet);
  });

  // printDependencyMap(dependencyMap);
  return dependencyMap;
}

export function purgeWebpackPrefixFromPath(filePath: string) {
  const purgedPath = filePath.replace(process.env[Constants.ENV_OPTIMIZATION_LOADER], '');
  return purgedPath.replace('!', '');
}

function printDependencyMap(map: Map<string, Set<string>>) {
  map.forEach((dependencySet: Set<string>, filePath: string) => {
    console.log('\n\n');
    console.log(`${filePath} is imported by the following files:`);
    dependencySet.forEach((importeePath: string) => {
      console.log(`   ${importeePath}`);
    });
  });
}

export function getConfig(context: BuildContext, configFile: string): WebpackConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  let webpackConfig: WebpackConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  webpackConfig.entry = replacePathVars(context, webpackConfig.entry);
  webpackConfig.output.path = replacePathVars(context, webpackConfig.output.path);

  return webpackConfig;
}

const taskInfo: TaskInfo = {
  fullArg: '--optimization',
  shortArg: '-dt',
  envVar: 'IONIC_DEPENDENCY_TREE',
  packageConfig: 'ionic_dependency_tree',
  defaultConfigFile: 'optimization.config'
};

interface WebpackStats {
  modules: WebpackModule[];
};

interface WebpackModule {
  identifier: string;
  reasons: WebpackDependency[];
};

interface WebpackDependency {
  moduleIdentifier: string;
};
