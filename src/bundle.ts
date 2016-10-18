import { BuildContext } from './util/interfaces';
import { BuildError } from './util/logger';
import { generateContext } from './util/config';
import { rollup, rollupUpdate, getRollupConfig, getOutputDest } from './rollup';


export function bundle(context?: BuildContext, configFile?: string) {
  context = generateContext(context);

  return rollup(context, configFile)
    .catch(err => {
      throw new BuildError(err);
    });
}


export function bundleUpdate(event: string, filePath: string, context: BuildContext) {
  return rollupUpdate(event, filePath, context)
    .catch(err => {
      throw new BuildError(err);
    });
}


export function buildJsSourceMaps(context: BuildContext) {
  const rollupConfig = getRollupConfig(context, null);
  return rollupConfig.sourceMap;
}


export function getJsOutputDest(context: BuildContext) {
  const rollupConfig = getRollupConfig(context, null);
  return getOutputDest(context, rollupConfig);
}
