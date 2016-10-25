
export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  wwwIndex?: string;
  buildDir?: string;
  moduleFiles?: string[];
  isProd?: boolean;
  isWatch?: boolean;
  isUpdate?: boolean;
  fileChanged?: string;
  bundler?: string;
  useTranspileCache?: boolean;
  useBundleCache?: boolean;
  useSassCache?: boolean;
  tsFiles?: TsFiles;
  successfulCopy?: boolean;
  successfulSass?: boolean;
  inlineTemplates?: boolean;
}


export interface WorkerMessage {
  taskModule?: string;
  taskWorker?: string;
  context?: BuildContext;
  workerConfig?: any;
  resolve?: any;
  reject?: any;
  error?: any;
  pid?: number;
}


export interface WorkerProcess {
  task: string;
  worker: any;
}


export interface TaskInfo {
  fullArgConfig: string;
  shortArgConfig: string;
  envConfig: string;
  defaultConfigFile: string;
}


export interface TsFile {
  input?: string;
  output?: string;
  map?: any;
}


export interface TsFiles {
  [sourcePath: string]: TsFile;
}
