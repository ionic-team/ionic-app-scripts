import { access } from 'fs';
import { BuildContext, ChangedFile, TaskInfo } from './util/interfaces';

import { lintFile, LintResult, processLintResults } from './lint/lint-utils';
import { createProgram, getFileNames } from './lint/lint-factory';
import { getUserConfigFile } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getBooleanPropertyValue } from './util/helpers';
import { join } from 'path';
import { Logger } from './logger/logger';

import { runWorker } from './worker-client';
import * as ts from 'typescript';


export function lint(context: BuildContext, configFile?: string) {
  const logger = new Logger('lint');
  return runWorker('lint', 'lintWorker', context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      if (getBooleanPropertyValue(Constants.ENV_BAIL_ON_LINT_ERROR)) {
        throw logger.fail(new BuildError(err));
      }
      logger.finish();
    });
}


export function lintWorker(context: BuildContext, configFile: string) {
  return getLintConfig(context, configFile).then(configFile => {
    // there's a valid tslint config, let's continue
    return lintApp(context, configFile);
  });
}


export function lintUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
  return new Promise(resolve => {
    // throw this in a promise for async fun, but don't let it hang anything up
    const workerConfig: LintWorkerConfig = {
      configFile: getUserConfigFile(context, taskInfo, null),
      filePaths: changedTypescriptFiles.map(changedTypescriptFile => changedTypescriptFile.filePath)
    };

    runWorker('lint', 'lintUpdateWorker', context, workerConfig);
    resolve();
  });
}


export function lintUpdateWorker(context: BuildContext, workerConfig: LintWorkerConfig) {
  return getLintConfig(context, workerConfig.configFile).then(configFile => {
    // there's a valid tslint config, let's continue (but be quiet about it!)
    const program = createProgram(configFile, context.srcDir);
    return lintFiles(context, program, workerConfig.filePaths);
  }).catch(() => {
  });
}


function lintApp(context: BuildContext, configFile: string) {
  const program = createProgram(configFile, context.srcDir);
  const files = getFileNames(program);

  return lintFiles(context, program, files);
}

export function lintFiles(context: BuildContext, program: ts.Program, filePaths: string[]) {
  return Promise.resolve().then(() => {
    const promises: Promise<any>[] = [];
    for (const filePath of filePaths) {
      promises.push(lintFile(context, program, filePath));
    }
    return Promise.all(promises);
  }).then((lintResults: LintResult[]) => {
    return processLintResults(context, lintResults);
  });
}


function getLintConfig(context: BuildContext, configFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    if (!configFile) {
      configFile = join(context.rootDir, 'tslint.json');
    }

    Logger.debug(`tslint config: ${configFile}`);

    access(configFile, (err: Error) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        reject(err);
        return;
      }
      resolve(configFile);
    });
  });
}


const taskInfo: TaskInfo = {
  fullArg: '--tslint',
  shortArg: '-i',
  envVar: 'ionic_tslint',
  packageConfig: 'IONIC_TSLINT',
  defaultConfigFile: '../tslint'
};

export interface LintWorkerConfig {
  configFile: string;
  filePaths: string[];
};


