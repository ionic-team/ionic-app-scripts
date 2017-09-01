import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { buildOptimizer, purify } from '@angular-devkit/build-optimizer';

import { Logger } from './logger/logger';
import { getUserConfigFile} from './util/config';
import * as Constants from './util/constants';
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
  return runNgc(context, configFile)
    .then(() => {
      runNgo(context);
    });
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

export function runNgo(context: BuildContext) {
  context.fileCache.getAll().forEach(file => {
    if (file.path.endsWith('.js')) {
      const sourceMap = context.fileCache.get(file.path + '.map');
      const output = buildOptimizer({
        content: file.content,
        emitSourceMap: true,
        inputFilePath: file.path,
        outputFilePath: file.path
      });
      if (output && output.content && output.content.length) {
        file.content = output.content;
      }
      if (output && output.sourceMap && sourceMap) {
        /*const sourceMapObj = JSON.parse(sourceMap.content);
        // If there's a previous sourcemap, we have to chain them.
        // See https://github.com/mozilla/source-map/issues/216#issuecomment-150839869 for a simple
        // source map chaining example.
        // Use http://sokra.github.io/source-map-visualization/ to validate sourcemaps make sense.
        output.sourceMap.sources = [sourceMapObj.file];
        const consumer = new SourceMapConsumer(output.sourceMap);
        const generator = SourceMapGenerator.fromSourceMap(consumer);
        generator.applySourceMap(new SourceMapConsumer(sourceMapObj));
        const newSourceMap = generator.toJSON();
        sourceMap.content = JSON.stringify(newSourceMap);
        */
        sourceMap.content = JSON.stringify(output.sourceMap);
      }
      // run purify
      file.content = purify(file.content);
    }
  });
}

const taskInfo: TaskInfo = {
  fullArg: '--ngc',
  shortArg: '-n',
  envVar: 'IONIC_NGC',
  packageConfig: 'ionic_ngc',
  defaultConfigFile: null
};
