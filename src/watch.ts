import { build } from './build';
import { BuildContext, TaskInfo } from './util/interfaces';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars, setIonicEnvironment } from './util/config';
import { BuildError, Logger } from './util/logger';
import * as chalk from 'chalk';
import * as chokidar from 'chokidar';


// https://github.com/paulmillr/chokidar

export function watch(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  // force watch options
  context.isProd = false;
  context.isWatch = true;

  const logger = new Logger('watch');

  function buildDone() {
    return startWatchers(context, configFile).then(() => {
      logger.ready(chalk.green);
    });
  }

  return build(context)
    .then(buildDone, buildDone)
    .catch((err: any) => {
      throw logger.fail(err);
    });
}


function startWatchers(context: BuildContext, configFile: string) {
  const watchConfig: WatchConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);

  const promises = watchConfig
    .watchers
    .filter(w => w.callback && w.paths)
    .map(w => startWatcher(w, context, watchConfig));

  return Promise.all(promises);
}


function startWatcher(watcher: Watcher, context: BuildContext, watchConfig: WatchConfig) {
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
      setIonicEnvironment(context.isProd);

      Logger.debug(`watch callback start, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${path}`);

      function taskDone() {
        Logger.info(chalk.green('watch ready'));
      }

      nextTask = watcher.callback.bind(null, event, path, context);
      taskPromise.then(() => {
        Logger.debug(`watch callback complete, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${path}`);
        taskPromise = nextTask();
        taskPromise
          .then(taskDone, taskDone)
          .catch(taskDone);
        nextTask = null;
        watchCount++;

      }).catch(err => {
        Logger.debug(`watch callback error, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${path}`);
        Logger.debug(`${err}`);
        taskPromise = nextTask();
        taskPromise
          .then(taskDone, taskDone)
          .catch(taskDone);
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


const taskInfo: TaskInfo = {
  fullArgConfig: '--watch',
  shortArgConfig: '-w',
  envConfig: 'ionic_watch',
  defaultConfigFile: 'watch.config'
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

let watchCount = 0;
