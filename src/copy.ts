import { BuildContext, TaskInfo } from './interfaces';
import { fillConfigDefaults, generateContext, Logger, replacePathVars } from './util';
import { copy as fsCopy } from 'fs-extra';


export function copy(context?: BuildContext) {
  context = generateContext(context);
  fillConfigDefaults(context, COPY_TASK_INFO);

  const logger = new Logger('copy');

  const promises: Promise<any>[] = [];

  context.copyConfig.include.forEach(copyOptions => {
    promises.push(
      copyFiles(context, copyOptions.src, copyOptions.dest, copyOptions.filter)
    );
  });

  return Promise.all(promises).then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}


function copyFiles(context: BuildContext, src: string, dest: string, filter?: any) {
  src = replacePathVars(context, src);
  dest = replacePathVars(context, dest);
  const opts = {
    filter: filter
  };

  return new Promise((resolve: any, reject: any) => {
    fsCopy(src, dest, opts, (err) => {
      if (err) {
        const msg = `Error copying "${src}" to "${dest}": ${err}`;
        if (msg.indexOf('ENOENT') < 0) {
          reject(`Error copying "${src}" to "${dest}": ${err}`);
          return;
        }
      }
      resolve();
    });
  });
}


const COPY_TASK_INFO: TaskInfo = {
  contextProperty: 'copyConfig',
  fullArgOption: '--copy',
  shortArgOption: '-c',
  defaultConfigFilename: 'copy.config'
};
