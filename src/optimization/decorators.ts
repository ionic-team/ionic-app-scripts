import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';

export function purgeDecorators(filePath: string, fileContent: string) {
  return purgeIndexDecorator(filePath, fileContent);
}

export function purgeIndexDecorator(filePath: string, fileContent: string) {
  if (process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT] === filePath) {
    Logger.debug(`Purging index file decorator for ${filePath}`);
    const DECORATORS_REGEX = getDecoratorRegex();
    const matches = DECORATORS_REGEX.exec(fileContent);
    if (matches && matches.length) {
      return fileContent.replace(matches[0], `/*${matches[0]}*/`);
    }
  }
  return fileContent;
}

export function getDecoratorRegex() {
  return /IonicModule.decorators.=[\s\S\n]*?([\s\S\n]*?)];/igm;
}
