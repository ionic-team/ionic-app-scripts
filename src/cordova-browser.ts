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

  return runWorker('cordova-browser', 'cordovaBrowserWorker', context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function cordovaBrowserWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    //const cordovaBrowserConfig: cordovaBrowserConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
    //const srcFile = join(context.buildDir, cleanCssConfig.sourceFileName);
    //const destFile = join(context.buildDir, cleanCssConfig.destFileName);
    resolve();
    /*
    let pluginDir = './plugins';
    let browserDir = './platforms/browser';
    let platformWWWDir = './platforms/browser/platform_www';
    let wwwDir = './www';

    let browserExists = fs.existsSync(browserDir);

    console.log('Browser exists', browserExists);

    fs.walk(platformWWWDir).
      on('data', function(item) {
        let rel = path.relative(platformWWWDir, item.path);
        let dest = path.join(wwwDir, rel);
        console.log('COPY', rel);
        fs.copySync(item.path, dest);
      })
      .on('end', function () {
        resolve();
      });
      */
  });
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
