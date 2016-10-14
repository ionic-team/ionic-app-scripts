import { cacheTranspiledTsFiles, setModulePathsCache } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars } from './util/config';

import * as wp from 'webpack';


export function webpack(context: BuildContext, configFile: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  cacheTranspiledTsFiles(context.tsFiles);

  const logger = new Logger('webpack');

  return createWebpackBundle(context, configFile).then(() => {
    logger.finish();
  }).catch(err => {
    throw logger.fail(err);
  });
}

export function webpackUpdate(event: string, path: string, context: BuildContext, configFile: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);
  const logger = new Logger('bundle update');

  cacheTranspiledTsFiles(context.tsFiles);

  return createWebpackBundle(context, configFile).then(() => {
    logger.finish();
  }).catch(err => {
    throw logger.fail(err);
  });
}


export function createWebpackBundle(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const webpackConfig = getWebpackConfig(context, configFile);
      const compiler = wp(webpackConfig);
      compiler.run((err: Error, stats: any) => {
        if (err) {
          reject(err);
        } else {

          // set the module files used in this bundle
          // this reference can be used elsewhere in the build (sass)
          context.moduleFiles = stats.compilation.modules.map((obj: any) => {
            return obj.resource;
          });

          // async cache all the module paths so we don't need
          // to always bundle to know which modules are used
          setModulePathsCache(context.moduleFiles);

          resolve();
        }
      });
    } catch (e) {
      reject(new BuildError(e));
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

const taskInfo: TaskInfo = {
  fullArgConfig: '--webpack',
  shortArgConfig: '-wp',
  envConfig: 'ionic_webpack',
  defaultConfigFile: 'webpack.config'
};


export interface WebpackConfig {
  // https://www.npmjs.com/package/webpack
  devtool: string;
  entry: string;
  output: any;
}
