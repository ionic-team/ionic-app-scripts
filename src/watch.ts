import { BuildContext, TaskInfo } from './interfaces';
import { generateContext, fillConfigDefaults, Logger } from './util';


export function watch(context?: BuildContext) {
  context = generateContext(context);
  fillConfigDefaults(context, WATCH_TASK_INFO);

  const logger = new Logger('watch');



  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}

const WATCH_TASK_INFO: TaskInfo = {
  contextProperty: 'watchConfig',
  fullArgConfig: '--watch',
  shortArgConfig: '-w',
  envConfig: 'ionic_watch',
  defaultConfigFilename: 'watch.config'
};
