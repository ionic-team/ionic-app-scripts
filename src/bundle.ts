import { BuildContext, ChangedFile, File } from './util/interfaces';
import { BuildError, IgnorableError } from './util/errors';
import { generateContext, BUNDLER_ROLLUP } from './util/config';
import { Logger } from './logger/logger';
import { rollup, rollupUpdate, getRollupConfig, getOutputDest as rollupGetOutputDest } from './rollup';
import { webpack, webpackUpdate, getWebpackConfig, getOutputDest as webpackGetOutputDest } from './webpack';
import * as path from 'path';

export function bundle(context?: BuildContext, configFile?: string) {
  context = generateContext(context);

  return bundleWorker(context, configFile)
    .catch((err: Error) => {
      throw new BuildError(err);
    });
}

function bundleWorker(context: BuildContext, configFile: string) {
  const isRollup = context.bundler === BUNDLER_ROLLUP;
  const config = getConfig(context, isRollup);

  return Promise.resolve()
    .then(() => {
      return getPreBundleHook(context, config, false, null);
    })
    .then(() => {
      if (isRollup) {
        return rollup(context, configFile);
      }

      return webpack(context, configFile);
    }).then(() => {
      return getPostBundleHook(context, config, false, null);
    });
}

function getPreBundleHook(context: BuildContext, config: any, isUpdate: boolean, changedFiles: ChangedFile[]) {
  if (process.env.IONIC_PRE_BUNDLE_HOOK) {
    return hookInternal(context, process.env.IONIC_PRE_BUNDLE_HOOK, 'pre-bundle hook', config, isUpdate, changedFiles);
  }
}

function getPostBundleHook(context: BuildContext, config: any, isUpdate: boolean, changedFiles: ChangedFile[]) {
  if (process.env.IONIC_POST_BUNDLE_HOOK) {
    return hookInternal(context, process.env.IONIC_POST_BUNDLE_HOOK, 'post-bundle hook', config, isUpdate, changedFiles);
  }
}

function hookInternal(context: BuildContext, environmentVariable: string, loggingTitle: string, config: any, isUpdate: boolean, changedFiles: ChangedFile[]) {
  return new Promise((resolve, reject) => {
    if (! environmentVariable || environmentVariable.length === 0) {
      // there isn't a hook, so just resolve right away
      resolve();
      return;
    }

    const pathToModule = path.resolve(environmentVariable);
    const hookFunction = require(pathToModule);
    const logger = new Logger(loggingTitle);

    let listOfFiles: File[] = null;
    if (changedFiles) {
      listOfFiles = changedFiles.map(changedFile => context.fileCache.get(changedFile.filePath));
    }

    hookFunction(context, isUpdate, listOfFiles, config)
      .then(() => {
        logger.finish();
        resolve();
      }).catch((err: Error) => {
        reject(logger.fail(err));
      });
  });
}

export function bundleUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const isRollup = context.bundler === BUNDLER_ROLLUP;
  const config = getConfig(context, isRollup);

  return Promise.resolve()
    .then(() => {
      return getPreBundleHook(context, config, true, changedFiles);
    })
    .then(() => {
      if (isRollup) {
        return rollupUpdate(changedFiles, context);
      }

      return webpackUpdate(changedFiles, context, null);
    }).then(() => {
      return getPostBundleHook(context, config, true, changedFiles);
    }).catch(err => {
      if (err instanceof IgnorableError) {
        throw err;
      }
      throw new BuildError(err);
    });
}


export function buildJsSourceMaps(context: BuildContext) {
  if (context.bundler === BUNDLER_ROLLUP) {
    const rollupConfig = getRollupConfig(context, null);
    return rollupConfig.sourceMap;
  }

  // TODO - read this from webpack config (could be multiple values)
  return true;
}


export function getJsOutputDest(context: BuildContext) {
  if (context.bundler === BUNDLER_ROLLUP) {
    const rollupConfig = getRollupConfig(context, null);
    return rollupGetOutputDest(context, rollupConfig);
  }

  const webpackConfig = getWebpackConfig(context, null);
  return webpackGetOutputDest(context, webpackConfig);
}

function getConfig(context: BuildContext, isRollup: boolean): any {
  if (isRollup) {
    return getRollupConfig(context, null);
  }
  return getWebpackConfig(context, null);
}
