import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError } from './util/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { rollup, rollupUpdate, getRollupConfig, getOutputDest as rollupGetOutputDest } from './rollup';
import { getWebpackConfig, webpack, webpackUpdate, getOutputDest as webpackGetOutputDest } from './webpack';


export function bundle(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  const bundleConfig = getBundleConfig(context, configFile);

  return createBundle(context, configFile, bundleConfig)
    .catch((err: Error) => {
      throw new BuildError(err);
    });
}

function createBundle(context: BuildContext, configFile: string, bundleConfig: BundleConfig) {
  if (bundleConfig.useWebpack) {
    return webpack(context, configFile);
  } else {
    return rollup(context, configFile);
  }
}

export function bundleUpdate(event: string, path: string, context: BuildContext) {
  const bundleConfig = getBundleConfig(context, null);
  if (bundleConfig.useWebpack) {
    return webpackUpdate(event, path, context, null)
      .catch( (err: Error) => {
        throw new BuildError(err);
      });
  } else {
    return rollupUpdate(event, path, context)
      .catch( (err: Error) => {
        throw new BuildError(err);
      });
  }
}

export function buildJsSourceMaps(context: BuildContext) {
  const bundleConfig = getBundleConfig(context, null);
  if (bundleConfig.useWebpack) {
    // TODO - read this from webpack config (could be multiple values)
    return true;
  } else {
    const rollupConfig = getRollupConfig(context, null);
    return rollupConfig.sourceMap;
  }
}

export function getJsOutputDest(context: BuildContext) {
  const bundleConfig = getBundleConfig(context, null);
  if (bundleConfig.useWebpack) {
    const webpackConfig = getWebpackConfig(context, null);
    return webpackGetOutputDest(context, webpackConfig);
  } else {
    const rollupConfig = getRollupConfig(context, null);
    return rollupGetOutputDest(context, rollupConfig);
  }
}

function getBundleConfig(context: BuildContext, configFile: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);
  const bundleConfig: BundleConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  return bundleConfig;
}

const taskInfo: TaskInfo = {
  fullArgConfig: '--bundle',
  shortArgConfig: '-e',
  envConfig: 'ionic_bundle',
  defaultConfigFile: 'bundle.config'
};

export interface BundleConfig {
  useWebpack: boolean;
}
