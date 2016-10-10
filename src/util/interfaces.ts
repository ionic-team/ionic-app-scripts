
export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  buildDir?: string;
  moduleFiles?: string[];
  files?: {[key: string]: TsFile};
  cachedTypeScript?: any;
  cachedBundle?: any;
}


export interface BuildOptions {
  isProd?: boolean;
  isWatch?: boolean;
}


export interface TaskInfo {
  fullArgConfig: string;
  shortArgConfig: string;
  envConfig: string;
  defaultConfigFilename: string;
}


export interface TsFile {
  input?: string;
  output?: string;
  map?: any;
}
