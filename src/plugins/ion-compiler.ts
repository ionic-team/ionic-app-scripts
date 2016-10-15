import { BuildContext } from '../util/interfaces';
import { dirname, join, resolve } from 'path';
import * as pluginutils from 'rollup-pluginutils';



export function ionCompiler(context: BuildContext) {
  const filter = pluginutils.createFilter(INCLUDE, EXCLUDE);

  return {
    name: 'ion-compiler',

    transform(sourceText: string, sourcePath: string): any {
      if (!filter(sourcePath)) {
        return null;
      }

      if (context.tsFiles) {
        const file = context.tsFiles[sourcePath];
        if (!file || !file.output) {
          console.error(`unable to find ${sourcePath}`);
          return null;
        }

        return {
          code: file.output,
          map: file.map
        };
      }

      return null;
    },

    resolveId(importee: string, importer: string): any {
      return resolveId(importee, importer, context);
    },

    load(sourcePath: string) {
      if (context.tsFiles) {
        const file = context.tsFiles[sourcePath];
        if (file && file.input) {
          return file.input;
        }
      }

      return null;
    }
  };
}


export function resolveId(importee: string, importer: string, context: BuildContext) {
  if (!importer || /\0/.test(importee)) {
    // disregard entry module
    // ignore IDs with null character, these belong to other plugins
    return null;
  }

  if (context.tsFiles) {
    const importerFile = context.tsFiles[importer];
    if (importerFile && importerFile.output) {
      const attemptedImporteeBasename =  resolve(join(dirname(importer), importee));
      const attemptedImportee = attemptedImporteeBasename + '.ts';
      const importeeFile = context.tsFiles[attemptedImportee];
      if (importeeFile) {
        return attemptedImportee;
      } else {
        // rather than a file, the attempedImportee could be a directory
        // while via node resolve pattern auto resolves to index file
        const attemptedImporteeIndex = resolve(join(attemptedImporteeBasename, 'index.ts'));
        const importeeIndexFile = context.tsFiles[attemptedImporteeIndex];
        if (importeeIndexFile) {
          return attemptedImporteeIndex;
        }
      }
    }
  }

  return null;
}


const INCLUDE = ['*.ts+(|x)', '**/*.ts+(|x)'];
const EXCLUDE = ['*.d.ts', '**/*.d.ts'];
