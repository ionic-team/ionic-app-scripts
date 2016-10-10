import { BuildContext, BuildOptions } from './util/interfaces';
import { endsWith } from './util/helpers';
import { generateContext, generateBuildOptions } from './util/config';
import { runDiagnostics, printDiagnostic } from './util/ts-diagnostics';
import { inlineTemplate } from './template';
import { join } from 'path';
import { BuildError, Logger } from './util/logger';
import { readFileSync } from 'fs';
import * as ts from 'typescript';


export function transpile(context: BuildContext, options: BuildOptions, sourceMap: boolean = true): Promise<any> {
  context = generateContext(context);
  options = generateBuildOptions(options);

  const logger = new Logger(`transpile`);

  return runTranspile(context, options, sourceMap)
    .then(() => {
      return logger.finish();

    }).catch(err => {
      throw logger.fail(err);
    });
}


function runTranspile(context: BuildContext, options: BuildOptions, sourceMap: boolean) {
  return new Promise((resolve, reject) => {
    const tsConfig = getTsConfig(context);

    // force it to save in the src directory
    // however, it's only in memory and won't actually write to disk
    tsConfig.options.outDir = context.srcDir;
    tsConfig.options.sourceMap = sourceMap;
    tsConfig.options.declaration = false;
    const tsFileNames = cleanFileNames(context, tsConfig.fileNames);

    context.files = {};
    const host = ts.createCompilerHost(tsConfig.options);

    Logger.debug(`ts.createProgram, cachedTypeScript: ${context.cachedTypeScript}`);

    const program = ts.createProgram(tsFileNames, tsConfig.options, host, context.cachedTypeScript);
    program.emit(undefined, (path: string, data: string) => {
      writeCallback(context, path, data);
    });

    const hasDiagnostics = runDiagnostics(context, program);

    if (hasDiagnostics) {
      // transpile failed :(
      reject(new BuildError());

    } else {
      // transpile success :)
      // cache the typescript program for later use
      context.cachedTypeScript = program;

      resolve();
    }
  });
}


function cleanFileNames(options: BuildOptions, fileNames: string[]) {
  let removeFileName = 'main.prod.ts';
  if (options.isProd) {
    removeFileName = 'main.dev.ts';
  }
  return fileNames.filter(f => {
    return (f.indexOf(removeFileName) === -1);
  });
}


function writeCallback(context: BuildContext, sourcePath: string, data: string) {
  if (endsWith(sourcePath, '.js')) {
    sourcePath = sourcePath.substring(0, sourcePath.length - 3) + '.ts';

    let file = context.files[sourcePath];
    if (!file) {
      file = context.files[sourcePath] = {};
    }
    file.output = inlineTemplate(data, sourcePath);

  } else if (endsWith(sourcePath, '.js.map')) {
    sourcePath = sourcePath.substring(0, sourcePath.length - 7) + '.ts';

    let file = context.files[sourcePath];
    if (!file) {
      file = context.files[sourcePath] = {};
    }
    file.map = data;
  }
}


export function getTsConfig(context: BuildContext): TsConfig {
  let config: TsConfig = null;
  const tsConfigPath = getTsConfigPath(context);

  const tsConfigFile = ts.readConfigFile(tsConfigPath, path => readFileSync(path, 'utf8'));

  if (!tsConfigFile) {
    throw new BuildError(`tsconfig: invalid tsconfig file, "${tsConfigPath}"`);

  } else if (tsConfigFile.error && tsConfigFile.error.messageText) {
    throw new BuildError(`tsconfig: ${tsConfigFile.error.messageText}`);

  } else if (!tsConfigFile.config) {
    throw new BuildError(`tsconfig: invalid config, "${tsConfigPath}""`);

  } else {
    const parsedConfig = ts.parseJsonConfigFileContent(
                                tsConfigFile.config,
                                ts.sys, context.rootDir,
                                {}, tsConfigPath);

    if (parsedConfig.errors && parsedConfig.errors.length) {
      parsedConfig.errors.forEach(d => {
        printDiagnostic(context, d);
      });
      throw new BuildError();
    }

    config = {
      options: parsedConfig.options,
      fileNames: parsedConfig.fileNames,
      typingOptions: parsedConfig.typingOptions,
      raw: parsedConfig.raw
    };
  }

  return config;
}


export function getTsConfigPath(context: BuildContext) {
  return join(context.rootDir, 'tsconfig.json');
}


export interface TsConfig {
  options: ts.CompilerOptions;
  fileNames: string[];
  typingOptions: ts.TypingOptions;
  raw: any;
}
