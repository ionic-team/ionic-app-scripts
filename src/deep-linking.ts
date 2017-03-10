
import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getStringPropertyValue, setParsedDeepLinkConfig } from './util/helpers';
import { BuildContext, ChangedFile, DeepLinkConfigEntry } from './util/interfaces';

import { convertDeepLinkConfigEntriesToString, getDeepLinkData, hasExistingDeepLinkConfig, updateAppNgModuleAndFactoryWithDeepLinkConfig } from './deep-linking/util';

/*
 * We want to cache a local, in-memory copy of the App's main NgModule file content.
 * Each time we do a build, a new DeepLinkConfig is generated and inserted into the
 * app's main NgModule. By keeping a copy of the original and using it to determine
 * if the developer had an existing config, we will get an accurate answer where
 * as the cached version of the App's main NgModule content will basically always
 * have a generated deep likn config in it.
*/
let cachedUnmodifiedAppNgModuleFileContent: string = null;

export function deepLinking(context: BuildContext) {
  const logger = new Logger(`deeplinks`);
  return deepLinkingWorker(context).then((deepLinkConfigEntries: DeepLinkConfigEntry[]) => {
      setParsedDeepLinkConfig(deepLinkConfigEntries);
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}


function deepLinkingWorker(context: BuildContext) {
  return deepLinkingWorkerImpl(context, null);
}

function deepLinkingWorkerImpl(context: BuildContext, changedFiles: ChangedFile[]) {
  return Promise.resolve().then(() => {
    const appNgModulePath = getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
    const appNgModuleFile = context.fileCache.get(appNgModulePath);
    if (!cachedUnmodifiedAppNgModuleFileContent) {
      cachedUnmodifiedAppNgModuleFileContent = appNgModuleFile.content;
    }
    const deepLinkConfigEntries = getDeepLinkData(appNgModulePath, context.fileCache, context.runAot);
    const hasExisting = hasExistingDeepLinkConfig(appNgModulePath, cachedUnmodifiedAppNgModuleFileContent);
    if (!hasExisting) {
      // only update the app's main ngModule if there isn't an existing config
      const deepLinkString = convertDeepLinkConfigEntriesToString(deepLinkConfigEntries);
      updateAppNgModuleAndFactoryWithDeepLinkConfig(context, deepLinkString, changedFiles, context.runAot);
    }
    return deepLinkConfigEntries;
  });
}

export function deepLinkingUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  // TODO, consider optimizing later
  const logger = new Logger('deeplinks update');
  return deepLinkingWorkerImpl(context, changedFiles).then((deepLinkConfigEntries: DeepLinkConfigEntry[]) => {
    setParsedDeepLinkConfig(deepLinkConfigEntries);
    logger.finish();
  }).catch((err: Error) => {
    const error = new BuildError(err.message);
    throw logger.fail(error);
  });
}

