import { access } from 'fs';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { generateContext, getUserConfigFile, getConfigValueDefault, getNodeBinExecutable } from './util/config';
import { join } from 'path';


export function lint(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  return lintWorker(context, configFile)
    .catch(err => {
      throw new BuildError(err);
    });
}


export function lintWorker(context: BuildContext, tsLintFile?: string) {
  return new Promise((resolve, reject) => {
    tsLintFile = tsLintFile || getConfigValueDefault(taskInfo.fullArgConfig,
                                                          taskInfo.shortArgConfig,
                                                          taskInfo.envConfig,
                                                          join(context.rootDir, 'tslint.json'),
                                                          context);

    Logger.debug(`tslint config: ${tsLintFile}`);

    access(tsLintFile, (err) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        Logger.debug(`tslint: ${err}`);
        resolve();
        return;
      }
      const logger = new Logger('lint');

      runTsLint(context, tsLintFile).then(() => {
        logger.finish();
        resolve(true);

      }).catch(err => {
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
      reject(new BuildError(`Unable to find "tslint" command: ${cmd}`));
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
      reject(new BuildError(`tslint error: ${err}`));
    });

    function printData(data: string) {
      // NOTE: linting should not fail builds
      // do not reject() here
      let output: string[] = [];
      data = data.toString();
      const lines = data.split('\n');
      lines.forEach(line => {
        line = line.trim();
        line = line.replace(context.rootDir, '');
        if (/\/|\\/.test(line.charAt(0))) {
          line = line.substr(1);
        }
        if (line.length) {
          output.push(line);
        }
      });

      if (output.length) {
        Logger.warn(`tslint warning`);
        console.log(''); // just for new line
        output.forEach(line => {
          Logger.log(line);
        });
        console.log(''); // just for new line
      }
    }

    cp.stdout.on('data', printData);
    cp.stderr.on('data', printData);

    cp.on('close', () => {
      resolve();
    });
  });
}


const taskInfo: TaskInfo = {
  fullArgConfig: '--tslint',
  shortArgConfig: '-l',
  envConfig: 'ionic_tslint',
  defaultConfigFile: '../tslint'
};


export interface TsLintConfig {
  // http://palantir.github.io/tslint/

}
