import { BuildContext, generateContext, fillConfigDefaults, Logger, TaskInfo } from './util';


export function uglifyjs(context?: BuildContext, uglifyJsConfig?: UglifyJsConfig) {
  context = generateContext(context);
  uglifyJsConfig = fillConfigDefaults(context, uglifyJsConfig, UGLIFY_TASK_INFO);

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


export interface UglifyJsConfig {
  // https://www.npmjs.com/package/uglify-js
}
