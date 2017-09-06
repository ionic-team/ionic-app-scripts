import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { buildOptimizer, purify } from '@angular-devkit/build-optimizer';

import { Logger } from './logger/logger';
import { getUserConfigFile} from './util/config';
import * as Constants from './util/constants';
import { changeExtension } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { AotCompiler } from './aot/aot-compiler';



export function ngc(context: BuildContext, configFile?: string) {
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

export function ngcWorker(context: BuildContext, configFile: string): Promise<any> {
  return runNgc(context, configFile);
}

export function runNgc(context: BuildContext, configFile: string): Promise<any> {
  const compiler = new AotCompiler(context, { entryPoint: process.env[Constants.ENV_APP_ENTRY_POINT],
    rootDir: context.rootDir,
    tsConfigPath: process.env[Constants.ENV_TS_CONFIG],
    appNgModuleClass: process.env[Constants.ENV_APP_NG_MODULE_CLASS],
    appNgModulePath: process.env[Constants.ENV_APP_NG_MODULE_PATH]
  });
  return compiler.compile();
}

const taskInfo: TaskInfo = {
  fullArg: '--ngc',
  shortArg: '-n',
  envVar: 'IONIC_NGC',
  packageConfig: 'ionic_ngc',
  defaultConfigFile: null
};
