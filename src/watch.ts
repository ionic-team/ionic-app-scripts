import { build } from './build';
import { BuildContext, generateContext, hasArg, fillConfigDefaults, Logger, replacePathVars, TaskInfo } from './util';
import { join } from 'path';


export function watch(context?: BuildContext, watchConfig?: WatchConfig) {
  context = generateContext(context);
  watchConfig = fillConfigDefaults(context, watchConfig, WATCH_TASK_INFO);

  const logger = new Logger('watch');

  build(context).then(() => {
    startWatchers(context, watchConfig);
    logger.ready();
  });
}


export function startWatchers(context: BuildContext, watchConfig: WatchConfig) {
  // https://github.com/paulmillr/chokidar
  const chokidar = require('chokidar');

  watchConfig.watchers.forEach(watcher => {
    if (watcher.callback && watcher.paths) {
      const options = watcher.options || {};
      if (!options.cwd) {
        options.cwd = context.rootDir;
      }
      if (typeof options.ignoreInitial !== 'boolean') {
        options.ignoreInitial = true;
      }
      const paths = cleanPaths(context, watcher.paths);
      const chokidarWatcher = chokidar.watch(paths, options);

      chokidarWatcher.on('all', (event: string, path: string) => {
        watcher.callback(event, path, context);
      });
    }
  });
}


function cleanPaths(context: BuildContext, paths: any): any {
  if (Array.isArray(paths)) {
    return paths.map(p => replacePathVars(context, p));
  }
  if (typeof paths === 'string') {
    return replacePathVars(context, paths);
  }
  return paths;
}


const WATCH_TASK_INFO: TaskInfo = {
  contextProperty: 'watchConfig',
  fullArgConfig: '--watch',
  shortArgConfig: '-w',
  envConfig: 'ionic_watch',
  defaultConfigFilename: 'watch.config'
};


export interface WatchConfig {
  watchers: Watcher[];
}


export interface Watcher {
  // https://www.npmjs.com/package/chokidar
  paths: string[];
  options: {
    ignored?: string;
    ignoreInitial?: boolean;
    followSymlinks?: boolean;
    cwd?: string;
  };
  callback: {
    (event: string, path: string, context: BuildContext): void;
  };
}
