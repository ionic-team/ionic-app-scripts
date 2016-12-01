import { Logger } from './logger/logger';
import { generateContext, getUserConfigFile} from './util/config';
import { BuildContext, TaskInfo } from './util/interfaces';
import { AotCompiler } from './aot/aot-compiler';

export function ngc(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('ngc');

  return ngcWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}

export function ngcWorker(context: BuildContext, configFile: string) {
  const compiler = new AotCompiler(context, { entryPoint: process.env.IONIC_APP_ENTRY_POINT_PATH, rootDir: context.rootDir, tsConfigPath: process.env.IONIC_TS_CONFIG_PATH });
  return compiler.compile();
}

const taskInfo: TaskInfo = {
  fullArg: '--ngc',
  shortArg: '-n',
  envVar: 'IONIC_NGC',
  packageConfig: 'ionic_ngc',
  defaultConfigFile: null
};
