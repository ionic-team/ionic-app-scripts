import { join } from 'path';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { Logger } from './logger/logger';
import { readFileAsync, writeFileAsync } from './util/helpers';
import { runWorker } from './worker-client';
import * as cleanCss from 'clean-css';

import * as fs from 'fs-extra';
import * as path from 'path';

export function cordovaBrowser(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('cordovaBrowser');

  let pluginDir = './plugins';
  let browserDir = './platforms/browser';
  let platformWWWDir = './platforms/browser/platform_www';
  let wwwDir = './www';

  let browserExists = fs.existsSync(browserDir);

  if (!browserExists) {
    // No cordova browser target, skippping
    Logger.warn('To enable plugins in ionic serve, add the cordova browser target.');
    logger.finish();
    return;
  }

  console.log('Browser exists', browserExists);

  (fs as any).walk(platformWWWDir).
    on('data', function(item: any) {
      let rel = path.relative(platformWWWDir, item.path);
      let dest = path.join(wwwDir, rel);
      console.log('COPY', rel);
      fs.copySync(item.path, dest);
    })
    .on('end', function() {
      logger.finish();
    })

}


const taskInfo: TaskInfo = {
  fullArg: '--cordovaBrowser',
  shortArg: '-k',
  envVar: 'IONIC_CORDOVABROWSER',
  packageConfig: 'ionic_cordovabrowser',
  defaultConfigFile: 'cordovaBrowser.config'
};


export interface CordovaBrowserConfig {
}
