import { BuildContext, TaskInfo } from './interfaces';
import { generateContext, fillConfigDefaults, Logger } from './util';


export function uglifyjs(context?: BuildContext) {
  const logger = new Logger('uglifyjs');
  context = generateContext(context);
  fillConfigDefaults(context, UGLIFY_TASK_INFO);



  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}

const UGLIFY_TASK_INFO: TaskInfo = {
  contextProperty: 'uglifyjsConfig',
  fullArgOption: '--uglifyjs',
  shortArgOption: '-u',
  defaultConfigFilename: 'uglifyjs.config'
};
