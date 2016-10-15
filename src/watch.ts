import { build } from './build';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars, setIonicEnvironment } from './util/config';
import { normalize } from 'path';
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
    .catch(err => {
      throw logger.fail(err);
    });
}


function startWatchers(context: BuildContext, configFile: string) {
  const watchConfig: WatchConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);

  const promises = watchConfig
    .watchers
    .map((w, i) => startWatcher(i, w, context, watchConfig));

  return Promise.all(promises);
}


function startWatcher(index: number, watcher: Watcher, context: BuildContext, watchConfig: WatchConfig) {
  return new Promise((resolve, reject) => {

    prepareWatcher(context, watcher);

    if (!watcher.paths) {
      Logger.error(`watcher config, index ${index}: missing "paths"`);
      resolve();
      return;
    }

    if (!watcher.callback) {
      Logger.error(`watcher config, index ${index}: missing "callback"`);
      resolve();
      return;
    }

    let taskPromise = Promise.resolve();
    let nextTask: any = null;

    const chokidarWatcher = chokidar.watch(<any>watcher.paths, watcher.options);

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
      Logger.debug(`watcher ready: ${watcher.options.cwd}${watcher.paths}`);
      resolve();
    });

    chokidarWatcher.on('error', (err: any) => {
      reject(new BuildError(`watcher error: ${watcher.options.cwd}${watcher.paths}: ${err}`));
    });
  });
}


export function prepareWatcher(context: BuildContext, watcher: Watcher) {
  watcher.options = watcher.options || {};

  if (!watcher.options.cwd) {
    watcher.options.cwd = context.rootDir;
  }

  if (typeof watcher.options.ignoreInitial !== 'boolean') {
    watcher.options.ignoreInitial = true;
  }

  if (typeof watcher.options.ignored === 'string') {
    watcher.options.ignored = normalize(replacePathVars(context, watcher.options.ignored));
  }

  if (typeof watcher.paths === 'string') {
    watcher.paths = normalize(replacePathVars(context, watcher.paths));

  } else if (Array.isArray(watcher.paths)) {
    watcher.paths = watcher.paths.map(p => normalize(replacePathVars(context, p)));
  }
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
  paths?: string[]|string;
  options?: {
    ignored?: string|Function;
    ignoreInitial?: boolean;
    followSymlinks?: boolean;
    cwd?: string;
  };
  callback?: {
    (event: string, path: string, context: BuildContext): void;
  };
}

let watchCount = 0;
