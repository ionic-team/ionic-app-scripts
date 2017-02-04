import { Logger } from './logger/logger';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { readAndCacheFile } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { runWebpackFullBuild, WebpackConfig } from './webpack';
import { calculateTreeShakeResults, purgeUnusedImportsFromIndex } from './tree-shaking/utils';


export function dependencyTree(context: BuildContext, configFile: string) {
  const logger = new Logger(`dependency tree`);
  return dependencyTreeWorker(context, configFile).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}


function dependencyTreeWorker(context: BuildContext, configFile: string) {
  const webpackConfig = getConfig(context, configFile);
  return runWebpackFullBuild(webpackConfig).then((stats: any) => {
    const dependencyMap = processStats(context, stats);
    const results = calculateTreeShakeResults(dependencyMap);
    return purgeUnusedImports(context, results.purgedModules);
  });
}

function purgeUnusedImports(context: BuildContext, purgeDependencyMap: Map<string, Set<string>>) {
  // for now, restrict this to components in the ionic-angular/index.js file
  const indexFilePath = process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT];
  const modulesToPurge: string[] = [];
  purgeDependencyMap.forEach((set: Set<string>, moduleToPurge: string) => {
    modulesToPurge.push(moduleToPurge);
  });
  return readAndCacheFile(indexFilePath).then(fileContent => {
    const updatedFileContent = purgeUnusedImportsFromIndex(indexFilePath, fileContent, modulesToPurge);
    context.fileCache.set(indexFilePath, { path: indexFilePath, content: updatedFileContent });
  });
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
    const dependencySet = new Set<string>();
    webpackModule.reasons.forEach(webpackDependency => {
      dependencySet.add(webpackDependency.moduleIdentifier);
    });
    dependencyMap.set(webpackModule.identifier, dependencySet);
  });
  return dependencyMap;
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
  fullArg: '--dependencyTree',
  shortArg: '-dt',
  envVar: 'IONIC_DEPENDENCY_TREE',
  packageConfig: 'ionic_dependency_tree',
  defaultConfigFile: 'webpack-dependencytree.config'
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
