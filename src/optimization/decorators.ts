import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';

export function purgeDecorators(filePath: string, fileContent: string) {
  return purgeIndexDecorator(filePath, fileContent);
}

export function purgeIndexDecorator(filePath: string, fileContent: string) {
  if (process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT] === filePath) {
    Logger.debug(`Purging decorators for ${filePath}`);
    return fileContent.replace(DECORATORS_REGEX, '');
  }
  return fileContent;
}

const DECORATORS_REGEX = /IonicModule.decorators.=[\s\S\n]*?([\s\S\n]*?)];/igm;
