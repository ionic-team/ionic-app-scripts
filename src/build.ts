import { BuildContext, BuildOptions } from './util/interfaces';
import { generateContext, generateBuildOptions } from './util/config';
import { bundle, bundleUpdate } from './bundle';
import { clean } from './clean';
import { minifyJs, minifyCss } from './minify';
import { copy } from './copy';
import { lint } from './lint';
import { Logger } from './util/logger';
import { ngc } from './ngc';
import { sass, sassUpdate } from './sass';


export function build(context: BuildContext, options: BuildOptions) {
  context = generateContext(context);
  options = generateBuildOptions(options);

  const logger = new Logger(`build ${(options.isProd ? 'prod' : 'dev')}`);

  const promises: Promise<any>[] = [];

  if (options.isProd) {
    // production build
    promises.push(buildProd(context, options));

  } else {
    // dev build
    promises.push(buildDev(context, options));
  }

  return Promise.all(promises).then(() => {
    // congrats, we did it!  (•_•) / ( •_•)>⌐■-■ / (⌐■_■)
    return logger.finish();

  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}


function buildProd(context: BuildContext, options: BuildOptions) {
  // sync empty the www directory
  clean(context);

  // async tasks
  // these can happen all while other tasks are running
  const copyPromise = copy(context);
  const lintPromise = lint(context);

  // kick off ngc to run the Ahead of Time compiler
  return ngc(context, options).then(() => {
    // ngc has finished, now let's bundle it all together
    return bundle(context, options);

  }).then(() => {
    // js minify can kick off right away
    const jsPromise = minifyJs(context);

    // sass needs to finish, then css minify can run when sass is done
    const sassPromise = sass(context).then(() => {
      return minifyCss(context);
    });

    return Promise.all([
      jsPromise,
      sassPromise
    ]);

  }).then(() => {
    // ensure the async tasks have fully completed before resolving
    return Promise.all([
      copyPromise,
      lintPromise
    ]);
  });
}


function buildDev(context: BuildContext, options: BuildOptions) {
  // sync empty the www directory
  clean(context);

  // async tasks
  // these can happen all while other tasks are running
  const copyPromise = copy(context);
  const lintPromise = lint(context);

  return bundle(context, options).then(() => {
    return sass(context);

  }).then(() => {
    // ensure the async tasks have fully completed before resolving
    return Promise.all([
      copyPromise,
      lintPromise
    ]);
  });
}


export function buildUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  return bundleUpdate(event, path, context, options, true).then(() => {
    return sassUpdate(event, path, context, options, true);
  });
}
