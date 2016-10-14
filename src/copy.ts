import { BuildContext, TaskInfo } from './util/interfaces';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars } from './util/config';
import { copy as fsCopy } from 'fs-extra';
import { BuildError, Logger } from './util/logger';


export function copy(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('copy');

  context.successfulCopy = false;

  return copyWorker(context, configFile)
    .then(() => {
      context.successfulCopy = true;
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function copyUpdate(event: string, path: string, context: BuildContext) {
  Logger.debug(`copyUpdate, event: ${event}, path: ${path}`);
  const configFile = getUserConfigFile(context, taskInfo, null);
  return copyWorker(context, configFile);
}


export function copyWorker(context: BuildContext, configFile: string) {
  const copyConfig: CopyConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  const promises: Promise<any>[] = [];

  copyConfig.include.forEach(copyOptions => {
    promises.push(
      copySrcToDest(context, copyOptions.src, copyOptions.dest, copyOptions.filter)
    );
  });

  return Promise.all(promises);
}


function copySrcToDest(context: BuildContext, src: string, dest: string, filter?: any) {
  src = replacePathVars(context, src);
  dest = replacePathVars(context, dest);
  const opts = {
    filter: filter,
    clobber: false
  };

  return new Promise((resolve: any, reject: any) => {
    fsCopy(src, dest, opts, (err) => {
      if (err) {
        const msg = `Error copying "${src}" to "${dest}": ${err}`;

        if (msg.indexOf('ENOENT') < 0 && msg.indexOf('EEXIST') < 0) {
          reject(new BuildError(`Error copying "${src}" to "${dest}": ${err}`));
          return;
        }
      }
      resolve();
    });
  });
}


const taskInfo: TaskInfo = {
  fullArgConfig: '--copy',
  shortArgConfig: '-y',
  envConfig: 'ionic_copy',
  defaultConfigFile: 'copy.config'
};


export interface CopyConfig {
  include: CopyOptions[];
}


export interface CopyOptions {
  // https://www.npmjs.com/package/fs-extra
  src: string;
  dest: string;
  filter: any;
}
