import { Logger } from '../util/logger';
import { getCachedTranspiledTsFiles } from '../util/helpers';

const transpiledFiles = getCachedTranspiledTsFiles();

module.exports = function ionicLoader(source: any, map: any) {
  this.cacheable();

  if (transpiledFiles) {
    const file = transpiledFiles[this.resourcePath];
    if (file) {
      Logger.debug(`Using in-memory file for ${this.resourcePath}`);
      this.callback(null, file.output, file.map);
    } else {
      Logger.debug(`Using persisted file for ${this.resourcePath}`);
      transpiledFiles[this.resourcePath] = {
        map: map,
        output: source
      };
      this.callback(null, source, map);
    }
  } else {
    this.callback(null, source, map);
  }
};
