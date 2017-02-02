import { Logger } from '../logger/logger';

export function optimizeJavascript(filePath: string, fileContent: string) {
  fileContent = purgeDecoratorStatements(filePath, fileContent, ['ionic-angular/index.js']);
  return fileContent;
}

export function purgeDecoratorStatements(filePath: string, fileContent: string, inclusions: string[]) {
  const include = shouldInclude(filePath, inclusions);
  if (include) {
    Logger.debug(`Purging decorators for ${filePath}`);
    return fileContent.replace(DECORATORS_REGEX, '');
  }
  return fileContent;
}

/*export function purgeKnownContent(filePath: string, fileContent: string, exclusions: string[]) {
  const exclude = shouldExclude(filePath, exclusions);
  if (exclude) {
    return fileContent.replace(TREE_SHAKEABLE_IMPORTS, '');
  }
  return fileContent;
}
*/

function shouldInclude(filePath: string, inclusions: string[]) {
  // TODO - make this more robust
  for (const inclusion of inclusions) {

    if (filePath.includes(inclusion)) {
      return true;
    }
  }
  return false;
}

const DECORATORS_REGEX = /(.+)\.decorators[\s\S\n]*?([\s\S\n]*?)];/igm;
