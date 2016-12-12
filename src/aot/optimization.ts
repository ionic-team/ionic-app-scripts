import { removeDecorators } from '../util/typescript-utils';

export function optimizeJavascript(filePath: string, fileContent: string) {
  fileContent = removeDecorators(filePath, fileContent);
  fileContent = purgeDecoratorStatements(filePath, fileContent, ['@angular']);
  // TODO - needs more testing to fully understand
  // fileContent = purgeCtorStatements(filePath, fileContent, ['@angular']);
  fileContent = purgeKnownContent(filePath, fileContent, ['@angular']);

  return fileContent;
}

export function purgeDecoratorStatements(filePath: string, fileContent: string, exclusions: string[]) {
  const exclude = shouldExclude(filePath, exclusions);
  if (exclude) {
    return fileContent.replace(DECORATORS_REGEX, '');
  }
  return fileContent;
}

export function purgeCtorStatements(filePath: string, fileContent: string, exclusions: string[]) {
  const exclude = shouldExclude(filePath, exclusions);
  if (exclude) {
    return fileContent.replace(CTOR_PARAM_REGEX, '');
  }
  return fileContent;
}

export function purgeKnownContent(filePath: string, fileContent: string, exclusions: string[]) {
  const exclude = shouldExclude(filePath, exclusions);
  if (exclude) {
    return fileContent.replace(TREE_SHAKEABLE_IMPORTS, '');
  }
  return fileContent;
}

function shouldExclude(filePath: string, exclusions: string[]) {
  for (const exclusion in exclusions) {
    if (filePath.includes(exclusion)) {
      return true;
    }
  }
  return false;
}

const DECORATORS_REGEX = /(.+)\.decorators[\s\S\n]*?([\s\S\n]*?)];/igm;
const CTOR_PARAM_REGEX = /(.+).ctorParameters[\s\S\n]*?([\s\S\n]*?)];/igm;
const TREE_SHAKEABLE_IMPORTS = /\/\* AoT Remove Start[\s\S\n]*?([\s\S\n]*?)AoT Remove End \*\//igm;
