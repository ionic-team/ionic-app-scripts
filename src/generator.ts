import { BuildContext, generateContext, fillConfigDefaults, Logger, TaskInfo } from './util';


export function generator(context?: BuildContext, generatorConfig?: GeneratorConfig) {
  context = generateContext(context);
  generatorConfig = fillConfigDefaults(context, generatorConfig, GENERATOR_TASK_INFO);

  const logger = new Logger('generator');


  console.log('templatesDir', generatorConfig.templatesDir);


  return Promise.resolve().then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}


const GENERATOR_TASK_INFO: TaskInfo = {
  fullArgConfig: '--generator',
  shortArgConfig: '-g',
  envConfig: 'ionic_generator',
  defaultConfigFilename: 'generator.config'
};


export interface GeneratorConfig {
  templatesDir: string;
}
