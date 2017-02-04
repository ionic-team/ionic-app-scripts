import { dirname, join, relative } from 'path';
import * as Constants from '../util/constants';
import { changeExtension, escapeStringForRegex, getBooleanPropertyValue } from '../util/helpers';
import { TreeShakeCalcResults } from '../util/interfaces';

export function calculateTreeShakeResults(dependencyMap: Map<string, Set<string>>): TreeShakeCalcResults {
  if (getBooleanPropertyValue(Constants.ENV_ENABLE_MANUAL_TREESHAKING)) {
    // we aren't mature enough to analyze anything other than the index file right now
    return purgeModulesWithOneImportee(dependencyMap, process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT], false);
  }
  return {
    updatedDependencyMap: dependencyMap,
    purgedModules: new Map<string, Set<string>>()
  };
}

function purgeModulesWithOneImportee(dependencyMap: Map<string, Set<string>>, importee: string, recursive: boolean = false): TreeShakeCalcResults {
  // find all modules with a single importee that is equal to the provided importee
  const dependenciesToInspect: string[] = [];
  const keysToDelete: string[] = [];
  const potentiallyPurgedModules = new Map<string, Set<string>>();
  const actualPurgedModules = new Map<string, Set<string>>();

  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if (importeeSet.has(importee)) {
      importeeSet.delete(importee);
      dependenciesToInspect.push(modulePath);
      const set = !!potentiallyPurgedModules.get(modulePath) ? potentiallyPurgedModules.get(modulePath) : new Set();
      set.add(importee);
      potentiallyPurgedModules.set(modulePath, set);
    }
  });

  if (dependenciesToInspect.length && recursive) {
    dependenciesToInspect.forEach(dependencyToInspect => purgeModulesWithOneImportee(dependencyMap, dependencyToInspect, recursive));
  } else {
    // sweet, the recusion is done, so now remove anything from the map with zero importees
    dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
      if (importeeSet.size === 0 && meetsFilter(modulePath)) {
        keysToDelete.push(modulePath);
      }
    });

    keysToDelete.forEach(key => {
      dependencyMap.delete(key);
      const set = potentiallyPurgedModules.get(key);
      actualPurgedModules.set(key, set);
    });
  }

  return {
   updatedDependencyMap: dependencyMap,
   purgedModules: actualPurgedModules
  };
}

export function meetsFilter(modulePath: string) {
  // for now, just use a simple filter of if a file is in ionic-angular/components
  const componentDir = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components');
  return modulePath.indexOf(componentDir) >= 0;
}

export function purgeUnusedImportsFromIndex(indexFilePath: string, indexFileContent: string, modulePathsToPurge: string[] ) {
  for (const modulePath of modulePathsToPurge) {
    // I cannot get the './' prefix to show up when using path api
    console.log('Dropping imports from: ', modulePath);
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
