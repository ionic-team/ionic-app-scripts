import { dirname, join, relative } from 'path';
import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { changeExtension, convertFilePathToNgFactoryPath, escapeStringForRegex } from '../util/helpers';
import { TreeShakeCalcResults } from '../util/interfaces';

export function calculateUnusedComponents(dependencyMap: Map<string, Set<string>>): TreeShakeCalcResults {
  return calculateUnusedComponentsImpl(dependencyMap, process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT]);
}

export function calculateUnusedComponentsImpl(dependencyMap: Map<string, Set<string>>, importee: string): any {
  const filteredMap = filterMap(dependencyMap);
  processImportTree(filteredMap, importee);
  calculateUnusedIonicProviders(filteredMap);
  return generateResults(filteredMap);
}

function generateResults(dependencyMap: Map<string, Set<string>>) {
  const toPurgeMap = new Map<string, Set<string>>();
  const updatedMap = new Map<string, Set<string>>();
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if ((importeeSet && importeeSet.size > 0) || requiredModule(modulePath)) {
      updatedMap.set(modulePath, importeeSet);
    } else {
      toPurgeMap.set(modulePath, importeeSet);
    }
  });
  return {
    updatedDependencyMap: updatedMap,
    purgedModules: toPurgeMap
  };
}

function requiredModule(modulePath: string) {
  const mainJsFile = changeExtension(process.env[Constants.ENV_APP_ENTRY_POINT], '.js');
  const appModule = changeExtension(process.env[Constants.ENV_APP_NG_MODULE_PATH], '.js');
  const appModuleNgFactory = getAppModuleNgFactoryPath();
  return modulePath === mainJsFile || modulePath === appModule || modulePath === appModuleNgFactory;
}

function filterMap(dependencyMap: Map<string, Set<string>>) {
  const filteredMap = new Map<string, Set<string>>();
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
     if (isIonicComponentOrAppSource(modulePath)) {
       filteredMap.set(modulePath, importeeSet);
     }
  });
  return filteredMap;
}

function processImportTree(dependencyMap: Map<string, Set<string>>, importee: string) {
  const importees: string[] = [];
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if (importeeSet && importeeSet.has(importee)) {
      importeeSet.delete(importee);
      // if it importer by an `ngfactory` file, we probably aren't going to be able to purge it
      let ngFactoryImportee = false;
      const importeeList = Array.from(importeeSet);
      for (const entry of importeeList) {
        if (isNgFactory(entry)) {
          ngFactoryImportee = true;
          break;
        }
      }
      if (!ngFactoryImportee) {
        importees.push(modulePath);
      }
    }
  });
  importees.forEach(importee => processImportTree(dependencyMap, importee));
}

function calculateUnusedIonicProviders(dependencyMap: Map<string, Set<string>>) {


  processIonicProviders(dependencyMap, process.env[Constants.ENV_ACTION_SHEET_CONTROLLER_PATH]);
  processIonicProviders(dependencyMap, process.env[Constants.ENV_ALERT_CONTROLLER_PATH]);
  processIonicProviders(dependencyMap, process.env[Constants.ENV_LOADING_CONTROLLER_PATH]);
  processIonicProviders(dependencyMap, process.env[Constants.ENV_MODAL_CONTROLLER_PATH]);
  processIonicProviders(dependencyMap, process.env[Constants.ENV_PICKER_CONTROLLER_PATH]);
  processIonicProviders(dependencyMap, process.env[Constants.ENV_POPOVER_CONTROLLER_PATH]);
  processIonicProviders(dependencyMap, process.env[Constants.ENV_TOAST_CONTROLLER_PATH]);

  // check if the controllers were deleted, if so, purge the component too
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_ACTION_SHEET_CONTROLLER_PATH], process.env[Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH]);
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_ALERT_CONTROLLER_PATH], process.env[Constants.ENV_ALERT_COMPONENT_FACTORY_PATH]);
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_LOADING_CONTROLLER_PATH], process.env[Constants.ENV_LOADING_COMPONENT_FACTORY_PATH]);
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_MODAL_CONTROLLER_PATH], process.env[Constants.ENV_MODAL_COMPONENT_FACTORY_PATH]);
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_PICKER_CONTROLLER_PATH], process.env[Constants.ENV_PICKER_COMPONENT_FACTORY_PATH]);
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_POPOVER_CONTROLLER_PATH], process.env[Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH]);
  processIonicProviderComponents(dependencyMap, process.env[Constants.ENV_TOAST_CONTROLLER_PATH], process.env[Constants.ENV_TOAST_COMPONENT_FACTORY_PATH]);
}

function processIonicProviderComponents(dependencyMap: Map<string, Set<string>>, providerPath: string, componentPath: string) {
  const importeeSet = dependencyMap.get(providerPath);
  if (importeeSet && importeeSet.size === 0) {
    processIonicProviders(dependencyMap, componentPath);
  }
}

function getAppModuleNgFactoryPath() {
  const appNgModulePath = process.env[Constants.ENV_APP_NG_MODULE_PATH];
  return convertFilePathToNgFactoryPath(appNgModulePath);
}

function processIonicProviders(dependencyMap: Map<string, Set<string>>, providerPath: string) {
  const importeeSet = dependencyMap.get(providerPath);
  const appModuleNgFactoryPath = getAppModuleNgFactoryPath();
  // we can only purge an ionic provider if it is imported from one module, which is the AppModuleNgFactory
  if (importeeSet && importeeSet.size === 1 && importeeSet.has(appModuleNgFactoryPath)) {
    importeeSet.delete(appModuleNgFactoryPath);
    // loop over the dependency map and remove this provider from importee sets
    processImportTreeForProviders(dependencyMap, providerPath);
  }
}

function processImportTreeForProviders(dependencyMap: Map<string, Set<string>>, importee: string) {
  const importees: string[] = [];
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if (importeeSet.has(importee)) {
      importeeSet.delete(importee);
      importees.push(modulePath);
    }
  });
  importees.forEach(importee => processImportTreeForProviders(dependencyMap, importee));
}

export function isIonicComponentOrAppSource(modulePath: string) {
  // for now, just use a simple filter of if a file is in ionic-angular/components
  const ionicAngularComponentDir = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components');
  const srcDir = process.env[Constants.ENV_VAR_SRC_DIR];
  return modulePath.indexOf(ionicAngularComponentDir) >= 0 || modulePath.indexOf(srcDir) >= 0;
}

export function isNgFactory(modulePath: string) {
  return modulePath.indexOf('.ngfactory.') >= 0;
}

export function purgeUnusedImportsAndExportsFromIndex(indexFilePath: string, indexFileContent: string, modulePathsToPurge: string[] ) {
  for (const modulePath of modulePathsToPurge) {
    // I cannot get the './' prefix to show up when using path api
    Logger.debug(`[treeshake] purgeUnusedImportsFromIndex: Removing ${modulePath} from ${indexFilePath}`);
    const extensionless = changeExtension(modulePath, '');
    const importPath = './' + relative(dirname(indexFilePath), extensionless);
    const importRegex = generateImportRegex(importPath);
    const results = importRegex.exec(indexFileContent);
    if (results) {
      let namedImports: string = null;
      if (results.length >= 2) {
        namedImports = results[1];
      }
      indexFileContent = indexFileContent.replace(importRegex, '');
      const exportRegex = generateExportRegex(importPath);
      const exportResults = exportRegex.exec(indexFileContent);
      if (exportResults) {
        indexFileContent = indexFileContent.replace(exportRegex, '');
      }
    }
  }
  return indexFileContent;
}

function generateImportRegex(relativeImportPath: string) {
  const cleansedString = escapeStringForRegex(relativeImportPath);
  return new RegExp(`import.*?{(.+)}.*?from.*?'${cleansedString}';`);
}

function generateExportRegex(relativeExportPath: string) {
  const cleansedString = escapeStringForRegex(relativeExportPath);
  return new RegExp(`export.*?{(.+)}.*?from.*?'${cleansedString}';`);
}
