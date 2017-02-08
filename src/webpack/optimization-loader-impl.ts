import { normalize, resolve } from 'path';
import { readAndCacheFile} from '../util/helpers';
import { Logger } from '../logger/logger';

/* This loader is purely for caching stuff */

export function optimizationLoader(source: string, map: any, webpackContex: any) {
  webpackContex.cacheable();
  var callback = webpackContex.async();

  const absolutePath = resolve(normalize(webpackContex.resourcePath));
  Logger.debug(`[Webpack] optimization: processing the following file: ${absolutePath}`);

  return readAndCacheFile(absolutePath).then((fileContent: string) => {
    callback(null, source, map);
  }).catch(err => {
    Logger.debug(`[Webpack] optimization: Encountered an unexpected error: ${err.message}`);
    callback(err);
  });
}
