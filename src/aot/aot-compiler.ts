import { readFileSync } from 'fs';
import { extname } from 'path';

import 'reflect-metadata';
import { CompilerOptions, createProgram, ParsedCommandLine, Program, transpileModule, TranspileOptions, TranspileOutput } from 'typescript';
import { CodeGenerator, NgcCliOptions, NodeReflectorHostContext, ReflectorHost, StaticReflector }from '@angular/compiler-cli';
import { tsc } from '@angular/tsc-wrapped/src/tsc';
import AngularCompilerOptions from '@angular/tsc-wrapped/src/options';

import { HybridFileSystem } from '../util/hybrid-file-system';
import { getInstance as getHybridFileSystem } from '../util/hybrid-file-system-factory';
import { getInstance } from '../aot/compiler-host-factory';
import { NgcCompilerHost } from '../aot/compiler-host';
import { patchReflectorHost } from '../aot/reflector-host';
import { removeDecorators } from '../util/typescript-utils';
import { getMainFileTypescriptContentForAotBuild } from './utils';
import { printDiagnostics, clearDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTypeScriptDiagnostics } from '../logger/logger-typescript';
import { BuildError } from '../util/errors';
import { changeExtension } from '../util/helpers';
import { BuildContext } from '../util/interfaces';

export class AotCompiler {

  private tsConfig: ParsedTsConfig;
  private angularCompilerOptions: AngularCompilerOptions;
  private program: Program;
  private reflector: StaticReflector;
  private reflectorHost: ReflectorHost;
  private compilerHost: NgcCompilerHost;
  private fileSystem: HybridFileSystem;

  constructor(private context: BuildContext, private options: AotOptions) {
    this.tsConfig = getNgcConfig(this.context, this.options.tsConfigPath);

    this.angularCompilerOptions = Object.assign({}, this.tsConfig.ngOptions, {
      basePath: this.options.rootDir,
      entryPoint: this.options.entryPoint
    });

    this.fileSystem = getHybridFileSystem();
    this.compilerHost = getInstance(this.tsConfig.parsed.options);
    this.program = createProgram(this.tsConfig.parsed.fileNames, this.tsConfig.parsed.options, this.compilerHost);
    this.reflectorHost = new ReflectorHost(this.program, this.compilerHost, this.angularCompilerOptions);
    this.reflector = new StaticReflector(this.reflectorHost);
  }

  compile() {
    return Promise.resolve().then(() => {
      clearDiagnostics(this.context, DiagnosticsType.TypeScript);
      const i18nOptions: NgcCliOptions = {
        i18nFile: undefined,
        i18nFormat: undefined,
        locale: undefined,
        basePath: this.options.rootDir
      };

      // Create the Code Generator.
      const codeGenerator = CodeGenerator.create(
        this.angularCompilerOptions,
        i18nOptions,
        this.program,
        this.compilerHost,
        new NodeReflectorHostContext(this.compilerHost)
      );

      // We need to temporarily patch the CodeGenerator until either it's patched or allows us
      // to pass in our own ReflectorHost.
      patchReflectorHost(codeGenerator);
      return codeGenerator.codegen({transitiveModules: true})
    }).then(() => {
      // Create a new Program, based on the old one. This will trigger a resolution of all
      // transitive modules, which include files that might just have been generated.
      this.program = createProgram(this.tsConfig.parsed.fileNames, this.tsConfig.parsed.options, this.compilerHost, this.program);
      const globalDiagnostics = this.program.getGlobalDiagnostics();
      const tsDiagnostics = this.program.getSyntacticDiagnostics()
                        .concat(this.program.getSemanticDiagnostics())
                        .concat(this.program.getOptionsDiagnostics());

      if (globalDiagnostics.length) {
        const diagnostics = runTypeScriptDiagnostics(this.context, globalDiagnostics);
        printDiagnostics(this.context, DiagnosticsType.TypeScript, diagnostics, true, false);
        throw new BuildError(new Error('Failed to transpile TypeScript'));
      }
      if (tsDiagnostics.length) {
        const diagnostics = runTypeScriptDiagnostics(this.context, tsDiagnostics);
        printDiagnostics(this.context, DiagnosticsType.TypeScript, diagnostics, true, false);
        throw new BuildError(new Error('Failed to transpile TypeScript'));
      }
    })
    .then(() => {
      for ( const fileName of this.tsConfig.parsed.fileNames) {
        const content = readFileSync(fileName).toString();
        this.context.fileCache.set(fileName, { path: fileName, content: content});
      }
    })
    .then(() => {
      const mainContent = getMainFileTypescriptContentForAotBuild();
      this.context.fileCache.set(this.options.entryPoint, { path: this.options.entryPoint, content: mainContent});
    })
    .then(() => {
      const tsFiles = this.context.fileCache.getAll().filter(file => extname(file.path) === '.ts' && file.path.indexOf('.d.ts') === -1);
      for (const tsFile of tsFiles) {
        const cleanedFileContent = removeDecorators(tsFile.path, tsFile.content);
        tsFile.content = cleanedFileContent;
        const transpileOutput = this.transpileFileContent(tsFile.path, cleanedFileContent, this.tsConfig.parsed.options);
        const diagnostics = runTypeScriptDiagnostics(this.context, transpileOutput.diagnostics);
        if (diagnostics.length) {
          // darn, we've got some things wrong, transpile failed :(
          printDiagnostics(this.context, DiagnosticsType.TypeScript, diagnostics, true, true);
          throw new BuildError();
        }

        const jsFilePath = changeExtension(tsFile.path, '.js');
        this.fileSystem.addVirtualFile(jsFilePath, transpileOutput.outputText);
        this.fileSystem.addVirtualFile(jsFilePath + '.map', transpileOutput.sourceMapText);
      }
    });
  }

  transpileFileContent(fileName: string, sourceText: string, options: CompilerOptions): TranspileOutput {
    const transpileOptions: TranspileOptions = {
      compilerOptions: options,
      fileName: fileName,
      reportDiagnostics: true
    };

    return transpileModule(sourceText, transpileOptions);
  }
}

export interface AotOptions {
  tsConfigPath: string;
  rootDir: string;
  entryPoint: string;
}

export function getNgcConfig(context: BuildContext, tsConfigPath?: string): ParsedTsConfig {

  const tsConfigFile = tsc.readConfiguration(tsConfigPath, process.cwd());
  if (!tsConfigFile) {
    throw new BuildError(`tsconfig: invalid tsconfig file, "${tsConfigPath}"`);

  }
  return tsConfigFile;
}

export interface ParsedTsConfig {
  parsed: ParsedCommandLine;
  ngOptions: AngularCompilerOptions;
}
