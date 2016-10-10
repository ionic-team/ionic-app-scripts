import { BuildContext, TaskInfo } from './util/interfaces';
import { generateContext, fillConfigDefaults } from './util/config';
import { Logger } from './util/logger';


export function closure(context?: BuildContext, closureConfig?: ClosureConfig) {
  context = generateContext(context);
  closureConfig = fillConfigDefaults(context, closureConfig, CLOSURE_TASK_INFO);

  const logger = new Logger('closure');

  return Promise.resolve().then(() => {
    Logger.warn('Closer Compiler unsupported at this time.');
    return logger.finish();

  }).catch(err => {
    throw logger.fail(err);
  });
}


export function isClosureSupported(context: BuildContext) {
  // TODO: check for Java and compiler.jar executable
  return false;
}


const CLOSURE_TASK_INFO: TaskInfo = {
  fullArgConfig: '--closure',
  shortArgConfig: '-l',
  envConfig: 'ionic_closure',
  defaultConfigFilename: 'closure.config'
};


export interface ClosureConfig {
  // https://developers.google.com/closure/compiler/docs/gettingstarted_app
  executable: string;
}
