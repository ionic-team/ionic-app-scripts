import { BuildContext } from './util/interfaces';
import { BuildError } from './util/logger';
import { generateContext } from './util/config';
import { rollup, rollupUpdate, getRollupConfig } from './rollup';
import { transpile, transpileUpdate } from './transpile';


export function bundle(context?: BuildContext, configFile?: string) {
  context = generateContext(context);

  const rollupConfig = getRollupConfig(context, configFile);
  context.jsSourceMaps = rollupConfig.sourceMap;

  return transpile(context).then(tsFiles => {
    return rollup(context, configFile, tsFiles);

  }).catch(err => {
    throw new BuildError(err);
  });
}


export function bundleUpdate(event: string, path: string, context: BuildContext) {
  const rollupConfig = getRollupConfig(context, null);
  context.jsSourceMaps = rollupConfig.sourceMap;

  return transpileUpdate(event, path, context)
    .then(tsFiles => {
      return rollupUpdate(event, path, context, tsFiles);
    })
    .catch(err => {
      throw new BuildError(err);
    });
}
