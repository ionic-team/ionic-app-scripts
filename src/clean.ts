import { BuildContext } from './interfaces';
import { generateContext, Logger } from './util';
import { emptyDirSync } from 'fs-extra';


export function clean(context?: BuildContext) {
  const logger = new Logger('clean');

  try {
    context = generateContext(context);
    emptyDirSync(context.wwwDir);
    logger.finish();

  } catch (e) {
    logger.fail(`Error cleaning ${context.wwwDir}, ${e}`);
  }
}
