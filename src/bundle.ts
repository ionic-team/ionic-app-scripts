import { BuildContext, RollupBundle, TaskInfo } from './interfaces';
import { fillConfigDefaults, generateContext, Logger } from './util';
import { join } from 'path';
import { outputJson, readJsonSync } from 'fs-extra';
import { tmpdir } from 'os';
const rollup = require('rollup').rollup;


export function bundle(context?: BuildContext) {
  const logger = new Logger('bundle');
  context = generateContext(context);

  // bundle polyfills, async
  // we do not need to wait on it's completion
  bundlePolyfills(context);

  // bundle the app then create create css
  return bundleApp(context).then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}


export function bundleApp(context?: BuildContext): Promise<any> {
  context = generateContext(context);
  fillConfigDefaults(context, BUNDLE_APP_TASK_INFO);

  if (!context.rollupAppConfig.dest) {
    context.rollupAppConfig.dest = join(context.buildDir, 'main.es6.js');
  }

  // bundle the app then create create css
  return rollup(context.rollupAppConfig).then((bundle: RollupBundle) => {

    // set the module files used in this bundle
    // this reference can be used elsewhere in the build (sass)
    context.moduleFiles = bundle.modules.map((m) => m.id);

    // async cache all the module paths so we don't need
    // to always bundle to know which modules are used
    setModulePathsCache(context.moduleFiles);

    // write the bundle
    return bundle.write(context.rollupAppConfig);
  });
}


export function bundlePolyfills(context?: BuildContext) {
  context = generateContext(context);
  fillConfigDefaults(context, BUNDLE_POLYFILL_TASK_INFO);

  if (!context.rollupPolyfillConfig.dest) {
    context.rollupPolyfillConfig.dest = join(context.buildDir, 'polyfills.es6.js');
  }

  // bundle polyfills, async
  return rollup(context.rollupPolyfillConfig).then((bundle: RollupBundle) => {
    return bundle.write(context.rollupPolyfillConfig);
  });
}


export function getModulePathsCache(): string[] {
  // sync get the cached array of module paths (if they exist)
  let cachedModulePaths: string[] = null;
  try {
    cachedModulePaths = readJsonSync(getCachePath(), <any>{ throws: false });
  } catch (e) {}
  return cachedModulePaths;
}


function setModulePathsCache(modulePaths: string[]) {
  // async save the module paths for later lookup
  outputJson(getCachePath(), modulePaths, (err) => {
    Logger.error(`Error writing module paths cache: ${err}`);
  });
}


function getCachePath(): string {
  // make a unique tmp directory for this project's module paths cache file
  let cwd = process.cwd().replace(/-|:|\/|\\|\.|~|;|\s/g, '');
  if (cwd.length > 40) {
    cwd = cwd.substr(cwd.length - 40);
  }
  return join(tmpdir(), cwd, 'ionic-module-paths.json');
}

const BUNDLE_APP_TASK_INFO: TaskInfo = {
  contextProperty: 'rollupAppConfig',
  fullArgOption: '--rollupApp',
  shortArgOption: '-b',
  defaultConfigFilename: 'rollup.app.config'
};

const BUNDLE_POLYFILL_TASK_INFO: TaskInfo = {
  contextProperty: 'rollupPolyfillConfig',
  fullArgOption: '--rollupPolyfill',
  shortArgOption: '-p',
  defaultConfigFilename: 'rollup.polyfill.config'
};
