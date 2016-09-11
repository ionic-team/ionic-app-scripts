
export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  buildDir?: string;
  configDir?: string;

  rollupConfig?: RollupConfig;
  rollupPolyfillConfig?: RollupConfig;
  cleancssConfig?: CleanCssConfig;
  copyConfig?: CopyConfig;
  ngcConfig?: NgcConfig;
  sassConfig?: SassConfig;
  uglifyjsConfig?: UglifyJsConfig;
  watchConfig?: WatchConfig;

  runCompress: boolean;
  moduleFiles?: string[];
}


export interface CleanCssConfig {
  // https://www.npmjs.com/package/clean-css
}


export interface CopyConfig {
  include: CopyOptions[];
}


export interface CopyOptions {
  // https://www.npmjs.com/package/fs-extra
  src: string;
  dest: string;
  filter: any;
}


export interface NgcConfig {
  include: string[];
}


export interface RollupConfig {
  // https://github.com/rollup/rollup/wiki/JavaScript-API
  entry?: string;
  sourceMap?: boolean;
  plugins?: any[];
  format?: string;
  dest?: string;
}


export interface RollupBundle {
  // https://github.com/rollup/rollup/wiki/JavaScript-API
  write: Function;
  modules: { id: string }[];
}


export interface SassConfig {
  // https://www.npmjs.com/package/node-sass
  outputFilename?: string;
  outFile?: string;
  file?: string;
  data?: string;
  includePaths?: string[];
  excludeModules?: string[];
  includeFiles?: RegExp[];
  excludeFiles?: RegExp[];
  directoryMaps?: {[key: string]: string};
  sortComponentPathsFn?: (a: any, b: any) => number;
  sortComponentFilesFn?: (a: any, b: any) => number;
  variableSassFiles?: string[];
  autoprefixer?: any;
  sourceMap?: string;
  omitSourceMapUrl?: boolean;
  sourceMapContents?: boolean;
}


export interface SassResult {
  css: string;
  map: SassMap;
}


export interface SassMap {
  file: string;
  sources: any[];
}


export interface UglifyJsConfig {
  // https://www.npmjs.com/package/uglify-js
}


export interface WatchConfig {

}


export interface TsConfig {
  // https://www.typescriptlang.org/docs/handbook/compiler-options.html
  compilerOptions: {
    module: string;
    removeComments: boolean;
    outDir: string;
    target: string;
  };
  include: string[];
}


export interface TaskInfo {
  contextProperty: string;
  fullArgConfig: string;
  shortArgConfig: string;
  envConfig: string;
  defaultConfigFilename: string;
}
