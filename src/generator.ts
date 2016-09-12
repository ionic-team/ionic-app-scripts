import { BuildContext, TaskInfo } from './interfaces';
import { generateContext, fillConfigDefaults, Logger } from './util';


export function generator(context?: BuildContext) {
  context = generateContext(context);
  fillConfigDefaults(context, GENERATOR_TASK_INFO);

  const logger = new Logger('generator');


  console.log('templatesDir', context.generatorConfig.templatesDir)


  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}

const GENERATOR_TASK_INFO: TaskInfo = {
  contextProperty: 'generatorConfig',
  fullArgConfig: '--generator',
  shortArgConfig: '-g',
  envConfig: 'ionic_generator',
  defaultConfigFilename: 'generator.config'
};
