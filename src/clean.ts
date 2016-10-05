import { BuildContext } from './util/interfaces';
import { generateContext } from './util/config';
import { emptyDirSync } from 'fs-extra';
import { Logger } from './util/logger';


export function clean(context?: BuildContext) {
  context = generateContext(context);

  const logger = new Logger('clean');

  try {
    Logger.debug(`clean ${context.wwwDir}`);

    emptyDirSync(context.wwwDir);
    logger.finish();

  } catch (e) {
    logger.fail(e, `Error cleaning ${context.wwwDir}, ${e}`);
    throw e;
  }
}
