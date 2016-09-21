import { BuildContext, BuildOptions, generateContext, generateBuildOptions, Logger } from './util';
import { bundle, bundleUpdate } from './bundle';
import { clean } from './clean';
import { compress } from './compress';
import { copy } from './copy';
import { ngc } from './ngc';
import { sass, sassUpdate } from './sass';
import { tsc } from './tsc';


export function build(context: BuildContext, options: BuildOptions) {
  context = generateContext(context);
  options = generateBuildOptions(options);
  const logger = new Logger('build');

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

  }).catch(err => {
    return logger.fail('Build failed' + (err.message ? ': ' + err.message : ''));
  });
}


export function buildProd(context: BuildContext, options: BuildOptions) {
  // sync empty the www directory
  clean();

  // async copy files
  // this can happen all while tsc/bundle/sass is running
  const copyPromise = copy();

  return ngc(context).then(() => {
    return bundle(context, options);

  }).then(() => {
    return sass(context);

  }).then(() => {
    return compress(context);

  }).then(() => {
    // ensure the copy task has fully completed before resolving
    return Promise.all([copyPromise]);
  });
}


export function buildDev(context: BuildContext, options: BuildOptions) {
  // sync empty the www directory
  clean();

  // async copy files
  // this can happen all while tsc/bundle/sass is running
  const copyPromise = copy();

  return tsc(context, options).then(() => {
    return bundle(context, options);

  }).then(() => {
    return sass(context);

  }).then(() => {
    // ensure the copy task has fully completed before resolving
    return Promise.all([copyPromise]);
  });
}


export function buildUpdate(event: string, path: string, context: BuildContext) {
  const logger = new Logger('buildUpdate');

  return bundleUpdate(event, path, context).then(() => {
    return sassUpdate(event, path, context, true);

  }).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    return logger.fail('buildUpdate failed' + (err.message ? ': ' + err.message : ''));
  });
}
