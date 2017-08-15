import { join, relative, basename } from 'path';
import { mkdirpSync } from 'fs-extra';
import * as Constants from './constants';
import { copyFileAsync, getBooleanPropertyValue, readDirAsync, unlinkAsync } from './helpers';
import { BuildContext } from './interfaces';

export function purgeSourceMapsIfNeeded(context: BuildContext): Promise<any> {
  if (getBooleanPropertyValue(Constants.ENV_VAR_GENERATE_SOURCE_MAP)) {
    // keep the source maps and just return
    return Promise.resolve([]);
  }
  return readDirAsync(context.buildDir).then((fileNames) => {
    const sourceMaps = fileNames.filter(fileName => fileName.endsWith('.map'));
    const fullPaths = sourceMaps.map(sourceMap => join(context.buildDir, sourceMap));
    const promises: Promise<void>[] = [];
    const copyBeforePurge = getBooleanPropertyValue(Constants.ENV_VAR_MOVE_SOURCE_MAPS);
    for (const fullPath of fullPaths) {
      if (copyBeforePurge) {
        mkdirpSync(context.sourcemapDir)
        const relativeTo = relative(fullPath, context.sourcemapDir)
        const fileName = basename(fullPath)
        promises.push(copyFileAsync(fullPath, join(context.sourcemapDir, fileName)).then(() => {
          return unlinkAsync(fullPath)
        }))
      } else {
        promises.push(unlinkAsync(fullPath))
      }
    }
    return Promise.all(promises);
  });
}
