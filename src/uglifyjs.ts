import { BuildContext, TaskInfo } from './interfaces';
import { generateContext, fillConfigDefaults, Logger } from './util';


export function uglifyjs(context?: BuildContext) {
  context = generateContext(context);
  fillConfigDefaults(context, UGLIFY_TASK_INFO);

  const logger = new Logger('uglifyjs');



  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}

const UGLIFY_TASK_INFO: TaskInfo = {
  contextProperty: 'uglifyjsConfig',
  fullArgConfig: '--uglifyjs',
  shortArgConfig: '-u',
  envConfig: 'ionic_uglifyjs',
  defaultConfigFilename: 'uglifyjs.config'
};
