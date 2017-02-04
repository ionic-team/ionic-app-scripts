import { Logger } from './logger/logger';
import { BuildError } from './util/errors';
import { BuildContext, ChangedFile } from './util/interfaces';
import { dependencyTree } from './dependency-tree';
import { deepLinking, deepLinkingUpdate } from './deep-linking';

export function preprocess(context: BuildContext) {
  const logger = new Logger(`preprocess`);
  return preprocessWorker(context).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}


function preprocessWorker(context: BuildContext) {
  return deepLinking(context)
    .then(() => {
      return dependencyTree(context, null);
    });
}

export function preprocessUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const promises: Promise<any>[] = [];
  promises.push(deepLinkingUpdate(changedFiles, context));
  return Promise.all(promises);
}
