// Ported from 'rollup-plugin-typescript':
// https://github.com/rollup/rollup-plugin-typescript
// MIT Licenced

import { getCompilerOptions, resolveId, transpile } from '../transpile';
import { helperFns, helpersId } from '../util/typescript-helpers';
import { inlineTemplate } from '../template';
import * as pluginutils from 'rollup-pluginutils';


export default function ionCompiler(options: IonCompilerOptions) {
  const filter = pluginutils.createFilter(
    options.include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    options.exclude || ['*.d.ts', '**/*.d.ts']);

  const compilerOptions = getCompilerOptions(options.rootDir);
  compilerOptions.sourceMap = options.sourceMap;

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
        sourceText = inlineTemplate(sourceText, sourcePath);
        return transpile(sourceText, sourcePath, compilerOptions, true);
      }
    }
  };
}


export interface IonCompilerOptions {
  rootDir: string;
  sourceMap: boolean;
  include?: string[];
  exclude?: string[];
}
