// Ported from 'rollup-plugin-typescript':
// https://github.com/rollup/rollup-plugin-typescript
// MIT Licenced

import { helperFns, helpersId } from '../util/typescript-helpers';
import { getCompilerOptions, resolveId, transpile } from '../transpile';
import { getUseSourceMapSetting } from '../util/config';
import * as pluginutils from 'rollup-pluginutils';


export default function ionCompiler(options?: IonCompilerOptions) {
  options = options || {};

  const filter = pluginutils.createFilter(
    options.include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    options.exclude || ['*.d.ts', '**/*.d.ts']);

  const compilerOptions = getCompilerOptions();
  compilerOptions.sourceMap = getUseSourceMapSetting();

  return {
    name: 'ion-compiler',

    resolveId(importee: string, importer: string) {
      return resolveId(importee, importer, compilerOptions);
    },

    load(id: string) {
      if (id === helpersId) {
        return helperFns;
      }
    },

    transform(sourceText: string, sourcePath: string): any {
      if (filter(sourcePath)) {
        return transpile(sourceText, sourcePath, compilerOptions, true);
      }
    }
  };
}


export interface IonCompilerOptions {
  include?: string[];
  exclude?: string[];
}
