import { BuildContext, BuildOptions, fillConfigDefaults, generateContext, generateBuildOptions, Logger, TaskInfo } from './util';
import { join } from 'path';
import { outputJson, readJsonSync } from 'fs-extra';
import { tmpdir } from 'os';
const rollup = require('rollup').rollup;


export function bundle(context?: BuildContext, options?: BuildOptions, rollupConfig?: RollupConfig) {
  context = generateContext(context);

  const logger = new Logger('bundle');

  // bundle the app then create create css
  return bundleApp(context, options, rollupConfig).then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}


export function bundleUpdate(event: string, path: string, context: BuildContext) {
  return bundleApp(context);
}


export function bundleApp(context?: BuildContext, options?: BuildOptions, rollupConfig?: RollupConfig): Promise<any> {
  context = generateContext(context);
  options = generateBuildOptions(options);

  if (options.isProd) {
    ROLLUP_TASK_INFO.defaultConfigFilename = 'rollup.prod.config';
  }

  rollupConfig = fillConfigDefaults(context, rollupConfig, ROLLUP_TASK_INFO);

  rollupConfig.dest = join(context.buildDir, rollupConfig.dest);

  // bundle the app then create create css
  return rollup(rollupConfig).then((bundle: RollupBundle) => {

    // set the module files used in this bundle
    // this reference can be used elsewhere in the build (sass)
    context.moduleFiles = bundle.modules.map((m) => m.id);

    // async cache all the module paths so we don't need
    // to always bundle to know which modules are used
    setModulePathsCache(context.moduleFiles);

    // write the bundle
    return bundle.write(rollupConfig);
  });
}


export function getModulePathsCache(): string[] {
  // sync get the cached array of module paths (if they exist)
  let modulePaths: string[] = null;
  try {
    modulePaths = readJsonSync(getCachePath(), <any>{ throws: false });
    Logger.debug(`Cached module paths: ${modulePaths && modulePaths.length}, ${getCachePath()}`);
  } catch (e) {
    Logger.debug(`Cached module paths not found: ${getCachePath()}`);
  }
  return modulePaths;
}


function setModulePathsCache(modulePaths: string[]) {
  // async save the module paths for later lookup
  outputJson(getCachePath(), modulePaths, (err) => {
    if (err) {
      Logger.error(`Error writing module paths cache: ${err}`);
    }
    Logger.debug(`Cached module paths: ${modulePaths && modulePaths.length}, ${getCachePath()}`);
  });
}


function getCachePath(): string {
  // make a unique tmp directory for this project's module paths cache file
  let cwd = process.cwd().replace(/-|:|\/|\\|\.|~|;|\s/g, '').toLowerCase();
  if (cwd.length > 40) {
    cwd = cwd.substr(cwd.length - 40);
  }
  return join(tmpdir(), cwd, 'modulepaths.json');
}


const ROLLUP_TASK_INFO: TaskInfo = {
  contextProperty: 'rollupConfig',
  fullArgConfig: '--rollup',
  shortArgConfig: '-r',
  envConfig: 'ionic_rollup',
  defaultConfigFilename: 'rollup.config'
};


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
