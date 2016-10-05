// Ported from 'rollup-plugin-typescript':
// https://github.com/rollup/rollup-plugin-typescript
// MIT Licenced

import { helperFns, helpersId } from '../util/typescript-helpers';
import { getCompilerOptions, resolveId, transpile, IonCompilerPluginOptions } from '../transpile';
import { inlineTemplate } from '../template';


export default function ionCompiler(options?: IonCompilerPluginOptions) {
  options = options || {};

  const pluginutils = require('rollup-pluginutils');

  const filter = pluginutils.createFilter(
    options.include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    options.exclude || ['*.d.ts', '**/*.d.ts']);

  const compilerOptions = getCompilerOptions();

  return {
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
        // inline templates
        sourceText = inlineTemplate(sourceText, sourcePath);

        // transpile typescirpt
        return transpile(sourceText, sourcePath, compilerOptions, true);
      }
    }
  };
}

