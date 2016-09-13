import { BuildContext, generateContext, fillConfigDefaults, Logger, TaskInfo } from './util';


export function cleancss(context?: BuildContext, cleanCssConfig?: CleanCssConfig) {
  context = generateContext(context);
  cleanCssConfig = fillConfigDefaults(context, cleanCssConfig, CLEANCSS_TASK_INFO);

  const logger = new Logger('cleancss');


  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}

const CLEANCSS_TASK_INFO: TaskInfo = {
  contextProperty: 'cleancssConfig',
  fullArgConfig: '--cleancss',
  shortArgConfig: '-e',
  envConfig: 'ionic_cleancss',
  defaultConfigFilename: 'cleancss.config'
};


export interface CleanCssConfig {
  // https://www.npmjs.com/package/clean-css
}
