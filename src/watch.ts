import { build } from './build';
import { BuildContext, BuildOptions, TaskInfo } from './util/interfaces';
import { fillConfigDefaults, generateBuildOptions, generateContext, replacePathVars, setIonicEnvironment } from './util/config';
import { BuildError, Logger } from './util/logger';
import * as chalk from 'chalk';
import * as chokidar from 'chokidar';


// https://github.com/paulmillr/chokidar

export function watch(context?: BuildContext, options?: BuildOptions, watchConfig?: WatchConfig) {
  context = generateContext(context);
  options = generateBuildOptions(options);
  watchConfig = fillConfigDefaults(context, watchConfig, WATCH_TASK_INFO);

  // force watch options
  options.isProd = false;
  options.isWatch = true;

  const logger = new Logger('watch');

  function buildDone() {
    return startWatchers(context, options, watchConfig).then(() => {
      return logger.ready(chalk.green);
    });
  }

  return build(context, options)
    .then(buildDone, buildDone)
    .catch(err => {
      throw logger.fail(err);
    });
}


function startWatchers(context: BuildContext, options: BuildOptions, watchConfig: WatchConfig) {
  const promises = watchConfig
    .watchers
    .filter(w => w.callback && w.paths)
    .map(w => startWatcher(w, context, options, watchConfig));

  return Promise.all(promises);
}


function startWatcher(watcher: Watcher, context: BuildContext, options: BuildOptions, watchConfig: WatchConfig) {
  return new Promise((resolve, reject) => {

    let taskPromise = Promise.resolve();
    let nextTask: any = null;

    const watcherOptions = watcher.options || {};
    if (!watcherOptions.cwd) {
      watcherOptions.cwd = context.rootDir;
    }

    if (typeof watcherOptions.ignoreInitial !== 'boolean') {
      watcherOptions.ignoreInitial = true;
    }
    const paths = cleanPaths(context, watcher.paths);
    const chokidarWatcher = chokidar.watch(paths, watcherOptions);

    chokidarWatcher.on('all', (event: string, path: string) => {
      setIonicEnvironment(options.isProd);

      Logger.debug(`watch callback start, id: ${watchCount}, isProd: ${options.isProd}, event: ${event}, path: ${path}`);

      nextTask = watcher.callback.bind(null, event, path, context, options);
      taskPromise.then(() => {
        Logger.debug(`watch callback complete, id: ${watchCount}, isProd: ${options.isProd}, event: ${event}, path: ${path}`);
        taskPromise = nextTask();
        taskPromise.catch(taskPromiseErr => {
          Logger.error(`${taskPromiseErr}`);
        });
        nextTask = null;
        watchCount++;

      }).catch(err => {
        Logger.debug(`watch callback error, id: ${watchCount}, isProd: ${options.isProd}, event: ${event}, path: ${path}`);
        Logger.debug(`${err}`);
        taskPromise = nextTask();
        taskPromise.catch(taskPromiseErr => {
          Logger.error(`${taskPromiseErr}`);
        });
        nextTask = null;
        watchCount++;
      });
    });

    chokidarWatcher.on('ready', () => {
      Logger.debug(`watcher ready: ${watcherOptions.cwd}${paths}`);
      resolve();
    });

    chokidarWatcher.on('error', (err: any) => {
      reject(new BuildError(`watcher error: ${watcherOptions.cwd}${paths}: ${err}`));
    });
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
    (event: string, path: string, context: BuildContext, options: BuildOptions): void;
  };
}

let watchCount = 0;
