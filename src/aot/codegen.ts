import { __NGTOOLS_PRIVATE_API_2 } from '@angular/compiler-cli';

import { readFileAsync } from '../util/helpers';
import { CodegenOptions } from '../util/interfaces';

export function doCodegen(options: CodegenOptions) {
  return __NGTOOLS_PRIVATE_API_2.codeGen({
    angularCompilerOptions: options.angularCompilerOptions,
    basePath: options.cliOptions.basePath,
    program: options.program,
    host: options.compilerHost,
    compilerOptions: options.compilerOptions,
    i18nFile: options.cliOptions.i18nFile,
    i18nFormat: options.cliOptions.i18nFormat,
    locale: options.cliOptions.locale,
    readResource: (fileName: string) => {
      return readFileAsync(fileName);
    }
  });
}


