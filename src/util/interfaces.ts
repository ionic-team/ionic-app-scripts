
export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  buildDir?: string;
  moduleFiles?: string[];
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
