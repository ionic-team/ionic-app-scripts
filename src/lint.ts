import { access } from 'fs';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { generateContext, getUserConfigFile, getConfigValueDefault } from './util/config';
import { join } from 'path';
import { createProgram, findConfiguration, getFileNames } from 'tslint';
import { printFailures } from './util/logger-tslint';
import { runWorker } from './worker-client';
import * as Linter from 'tslint';
import * as fs from 'fs';
import * as ts from 'typescript';


export function lint(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  return runWorker('lint', context, configFile)
    .catch(err => {
      throw new BuildError(err);
    });
}


export function lintWorker(context: BuildContext, configFile?: string) {
  return new Promise((resolve, reject) => {
    configFile = configFile || getConfigValueDefault(taskInfo.fullArgConfig,
                                                          taskInfo.shortArgConfig,
                                                          taskInfo.envConfig,
                                                          join(context.rootDir, 'tslint.json'),
                                                          context);

    Logger.debug(`tslint config: ${configFile}`);

    access(configFile, (err) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        Logger.debug(`tslint: ${err}`);
        resolve();
        return;
      }

      const logger = new Logger('lint');

      lintApp(context, configFile).then(() => {
        // always finish and resolve
        logger.finish();
        resolve();

      }).catch(() => {
        // always finish and resolve
        logger.finish();
        resolve();
      });

    });
  });
}


function lintApp(context: BuildContext, configFile: string) {
  const program = createProgram(configFile, context.srcDir);
  const files = getFileNames(program);

  const promises = files.map(file => {
    return lintFile(context, program, file);
  });

  return Promise.all(promises);
}


function lintFile(context: BuildContext, program: ts.Program, file: string) {
  return new Promise((resolve) => {

    if (isMpegFile(file)) {
      // silly .ts files actually being video files
      resolve();
      return;
    }

    fs.readFile(file, 'utf8', (err, contents) => {
      if (err) {
        // don't care if there was an error
        // let's just move on with our lives
        resolve();
        return;
      }

      try {
        const configuration = findConfiguration(null, file);

        const linter = new Linter(file, contents, {
          configuration: configuration,
          formatter: null,
          formattersDirectory: null,
          rulesDirectory: null,
        }, program);

        const lintResult = linter.lint();
        printFailures(context, <any>lintResult.failures);

      } catch (e) {
        Logger.debug(`Linter ${e}`);
      }

      resolve();
    });

  });
}


function isMpegFile(file: string) {
  var buffer = new Buffer(256);
  buffer.fill(0);

  const fd = fs.openSync(file, 'r');
  try {
    fs.readSync(fd, buffer, 0, 256, null);
    if (buffer.readInt8(0) === 0x47 && buffer.readInt8(188) === 0x47) {
      Logger.debug(`tslint: ${file}: ignoring MPEG transport stream`);
      return true;
    }
  } finally {
    fs.closeSync(fd);
  }
  return false;
}


const taskInfo: TaskInfo = {
  fullArgConfig: '--tslint',
  shortArgConfig: '-l',
  envConfig: 'ionic_tslint',
  defaultConfigFile: '../tslint'
};
