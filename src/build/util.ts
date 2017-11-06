import { join } from 'path';

import { getTsConfigAsync, TsConfig } from '../transpile';
import * as Constants from '../util/constants';
import { BuildError } from '../util/errors';
import { GlobResult, globAll } from '../util/glob-util';
import { getBooleanPropertyValue, getStringPropertyValue, readFileAsync, readJsonAsync, semverStringToObject } from '../util/helpers';
import { BuildContext, } from '../util/interfaces';

export function scanSrcTsFiles(context: BuildContext) {
  const srcGlob = join(context.srcDir, '**', '*.ts');
  const globs: string[] = [srcGlob];
  const deepLinkDir = getStringPropertyValue(Constants.ENV_VAR_DEEPLINKS_DIR);
  // these two will only not be equal in some weird cases like for building Ionic's demos with our current repository set-up
  if (deepLinkDir !== context.srcDir) {
    globs.push(join(deepLinkDir, '**', '*.ts'));
  }
  return globAll(globs).then((results: GlobResult[]) => {
    const promises = results.map(result => {
      const promise = readFileAsync(result.absolutePath);
      promise.then((fileContent: string) => {
        context.fileCache.set(result.absolutePath, { path: result.absolutePath, content: fileContent});
      });
      return promise;
    });
    return Promise.all(promises);
  });
}


export function validateTsConfigSettings(tsConfigFileContents: TsConfig) {
  return new Promise((resolve, reject) => {
    try {
      const isValid = tsConfigFileContents.options &&
        tsConfigFileContents.options.sourceMap === true;
      if (!isValid) {
        const error = new BuildError(['The "tsconfig.json" file must have compilerOptions.sourceMap set to true.',
          'For more information please see the default Ionic project tsconfig.json file here:',
          'https://github.com/ionic-team/ionic2-app-base/blob/master/tsconfig.json'].join('\n'));
        error.isFatal = true;
        return reject(error);
      }
      resolve();
    } catch (e) {
      const error = new BuildError('The "tsconfig.json" file contains malformed JSON.');
      error.isFatal = true;
      return reject(error);
    }
  });
}

export function validateRequiredFilesExist(context: BuildContext) {
  return Promise.all([
    readFileAsync(process.env[Constants.ENV_APP_ENTRY_POINT]),
    getTsConfigAsync(context, process.env[Constants.ENV_TS_CONFIG])
  ]).catch((error) => {
    if (error.code === 'ENOENT' && error.path === process.env[Constants.ENV_APP_ENTRY_POINT]) {
      error = new BuildError(`${error.path} was not found. The "main.dev.ts" and "main.prod.ts" files have been deprecated. Please create a new file "main.ts" containing the content of "main.dev.ts", and then delete the deprecated files.
                            For more information, please see the default Ionic project main.ts file here:
                            https://github.com/ionic-team/ionic2-app-base/tree/master/src/app/main.ts`);
      error.isFatal = true;
      throw error;
    }
    if (error.code === 'ENOENT' && error.path === process.env[Constants.ENV_TS_CONFIG]) {
      error = new BuildError([`${error.path} was not found. The "tsconfig.json" file is missing. This file is required.`,
        'For more information please see the default Ionic project tsconfig.json file here:',
        'https://github.com/ionic-team/ionic2-app-base/blob/master/tsconfig.json'].join('\n'));
      error.isFatal = true;
      throw error;
    }
    error.isFatal = true;
    throw error;
  });
}

export async function readVersionOfDependencies(context: BuildContext) {
  // read the package.json version from ionic, angular/core, and typescript
  const promises: Promise<any>[] = [];
  promises.push(readPackageVersion(context.angularCoreDir));
  if (!getBooleanPropertyValue(Constants.ENV_SKIP_IONIC_ANGULAR_VERSION)) {
    promises.push(readPackageVersion(context.ionicAngularDir));
  }
  promises.push(readPackageVersion(context.typescriptDir));

  const versions = await Promise.all(promises);
  context.angularVersion = semverStringToObject(versions[0]);
  if (!getBooleanPropertyValue(Constants.ENV_SKIP_IONIC_ANGULAR_VERSION)) {
    context.ionicAngularVersion = semverStringToObject(versions[1]);
  }
  // index could be 1 or 2 depending on if you read ionic-angular, its always the last one bro
  context.typescriptVersion = semverStringToObject(versions[versions.length - 1]);
}

export async function readPackageVersion(packageDir: string) {
  const packageJsonPath = join(packageDir, 'package.json');
  const packageObject = await readJsonAsync(packageJsonPath);
  return packageObject['version'];
}
