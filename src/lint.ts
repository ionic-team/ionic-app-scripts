import { BuildContext, generateContext, getConfigValueDefaults, getNodeBinExecutable, Logger, TaskInfo } from './util';
import { join } from 'path';
import { access } from 'fs';


export function lint(context?: BuildContext, tsConfigPath?: string) {
  context = generateContext(context);

  const defaultTsLintPath = join(context.rootDir, 'tslint.json');

  tsConfigPath = tsConfigPath || getConfigValueDefaults(TSCONFIG_TASK_INFO.fullArgConfig,
                                                        TSCONFIG_TASK_INFO.shortArgConfig,
                                                        TSCONFIG_TASK_INFO.envConfig,
                                                        defaultTsLintPath,
                                                        context);

  Logger.debug(`tslint config: ${tsConfigPath}`);

  return new Promise((resolve, reject) => {
    access(tsConfigPath, (err) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        Logger.debug(`tslint: ${err}`);
        resolve();
        return;
      }
      const logger = new Logger('lint');

      runTsLint(context, tsConfigPath).then(() => {
        resolve(logger.finish());

      }).catch((err: Error) => {
        logger.fail(err);
        // tslint should not break the build by default
        // so just resolve
        resolve();
      });

    });
  });
}


function runTsLint(context: BuildContext, tsConfigPath: string) {
  return new Promise((resolve, reject) => {
    const cmd = getNodeBinExecutable(context, 'tslint');
    if (!cmd) {
      reject(new Error(`Unable to find "tslint" command: ${cmd}`));
      return false;
    }

    const files = join(context.srcDir, '**', '*.ts');

    const args = [
      '--config', tsConfigPath,
      files
    ];

    const spawn = require('cross-spawn');
    const cp = spawn(cmd, args);

    cp.on('error', (err: string) => {
      reject(new Error(`tslint error: ${err}`));
    });

    cp.stdout.on('data', (data: string) => {
      Logger.error(`tslint: ${data}`);
    });

    cp.stderr.on('data', (data: string) => {
      Logger.error(`tslint: ${data}`);
    });

    cp.on('close', (data: string) => {
      resolve();
    });
  });
}


const TSCONFIG_TASK_INFO: TaskInfo = {
  fullArgConfig: '--tslint',
  shortArgConfig: '-l',
  envConfig: 'ionic_tslint',
  defaultConfigFilename: '../tslint'
};


export interface TsConfig {
  // http://palantir.github.io/tslint/
  executable: string;
}
