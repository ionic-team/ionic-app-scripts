import { BuildContext, TaskInfo } from './interfaces';
import { generateContext, fillConfigDefaults, Logger } from './util';


export function cleancss(context?: BuildContext) {
  const logger = new Logger('cleancss');
  context = generateContext(context);
  fillConfigDefaults(context, CLEANCSS_TASK_INFO);


  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}

const CLEANCSS_TASK_INFO: TaskInfo = {
  contextProperty: 'cleancssConfig',
  fullArgOption: '--cleancss',
  shortArgOption: '-e',
  defaultConfigFilename: 'cleancss.config'
};
