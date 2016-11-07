export { build, buildUpdate, fullBuildUpdate } from './build';
export { bundle, bundleUpdate } from './bundle';
export { clean } from './clean';
export { cleancss } from './cleancss';
export { copy, copyUpdate } from './copy';
export { lint } from './lint';
export { minify } from './minify';
export { ngc } from './ngc';
export { sass, sassUpdate } from './sass';
export { transpile } from './transpile';
export { templateUpdate } from './template';
export { uglifyjs } from './uglifyjs';
export { watch } from './watch';
export * from './util/config';
export * from './util/helpers';
export * from './util/interfaces';

import { build } from './build';
import { bundle } from './bundle';
import { clean } from './clean';
import { cleancss } from './cleancss';
import { closure } from './closure';
import { copy } from './copy';
import { lint } from './lint';
import { minify } from './minify';
import { ngc } from './ngc';
import { rollup } from './rollup';
import { sass } from './sass';
import { serve } from './serve';
import { transpile } from './transpile';
import { uglifyjs } from './uglifyjs';
import { watch } from './watch';
import { webpack } from './webpack';


import { Logger, getAppScriptsVersion } from './util/logger';
import * as chalk from 'chalk';


export function run(task: string) {
  try {
    Logger.info(chalk.cyan(`ionic-app-scripts ${getAppScriptsVersion()}`));
  } catch (e) {}
  let foundTask: Function;

  switch(task) {
  case 'build':
    foundTask = build;
    break;
  case 'bundle':
    foundTask = bundle;
    break;
  case 'clean':
    foundTask = clean;
    break;
  case 'cleancss':
    foundTask = cleancss;
    break;
  case 'closure':
    foundTask = closure;
    break;
  case 'copy':
    foundTask = copy;
    break;
  case 'lint':
    foundTask = lint;
    break;
  case 'minify':
    foundTask = minify;
    break;
  case 'ngc':
    foundTask = ngc;
    break;
  case 'rollup':
    foundTask = rollup;
    break;
  case 'sass':
    foundTask = sass;
    break;
  case 'serve':
    foundTask = serve;
    break;
  case 'transpile':
    foundTask = transpile;
    break;
  case 'uglifyjs':
    foundTask = uglifyjs;
    break;
  case 'watch':
    foundTask = watch;
    break;
  case 'webpack':
    foundTask = webpack;
    break;
  }

  try {
    foundTask().catch((err: any) => {
      errorLog(task, err);
    });
  } catch (e) {
    errorLog(task, e);
  }
}

function errorLog(task: string, e: any) {
  Logger.error(`ionic-app-script task: "${task}"`);
  if (e && e.toString() !== 'Error') {
    Logger.error(`${e}`);
  }
  process.exit(1);
}
