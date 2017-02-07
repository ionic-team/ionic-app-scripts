import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { getBooleanPropertyValue } from '../util/helpers';

export function purgeDecorators(filePath: string, fileContent: string) {
  if (getBooleanPropertyValue(Constants.ENV_EXPERIMENTAL_PURGE_DECORATORS)) {
    fileContent = purgeDecoratorStatementsImpl(filePath, fileContent, ['ionic-angular/index.js']);
  }
  return fileContent;
}

export function purgeDecoratorStatementsImpl(filePath: string, fileContent: string, inclusions: string[]) {
  const include = shouldInclude(filePath, inclusions);
  if (include) {
    Logger.debug(`Purging decorators for ${filePath}`);
    return fileContent.replace(DECORATORS_REGEX, '');
  }
  return fileContent;
}

function shouldInclude(filePath: string, inclusions: string[]) {
  // TODO - make this more robust
  for (const inclusion of inclusions) {

    if (filePath.includes(inclusion)) {
      return true;
    }
  }
  return false;
}

const DECORATORS_REGEX = /IonicModule.decorators.=[\s\S\n]*?([\s\S\n]*?)];/igm;
