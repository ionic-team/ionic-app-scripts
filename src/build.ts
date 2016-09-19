import { BuildContext, BuildOptions, generateContext, generateBuildOptions, Logger } from './util';
import { bundle, bundleUpdate } from './bundle';
import { clean } from './clean';
import { compress } from './compress';
import { copy } from './copy';
import { ngc, ngcUpdate } from './ngc';
import { sass, sassUpdate } from './sass';
import { transpile, transpileUpdate } from './transpile';


export function build(context?: BuildContext, options?: BuildOptions) {
  context = generateContext(context);
  options = generateBuildOptions(options);
  const logger = new Logger('build');

  clean();
  copy();

  return ngc(context).then(() => {
    return bundle(context);

  }).then(() => {
    return Promise.all([
      sass(context),
      transpile(context)
    ]);

  }).then(() => {
    if (options.runCompress) {
      return compress(context);

    } else {
      return Promise.resolve();
    }

  }).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    return logger.fail('Build failed' + (err.message ? ': ' + err.message : ''));
  });
}


export function buildUpdate(event: string, path: string, context: BuildContext) {
  const logger = new Logger('buildUpdate');

  return ngcUpdate(event, path, context).then(() => {
    return bundleUpdate(event, path, context);

  }).then(() => {
    return Promise.all([
      sassUpdate(event, path, context),
      transpileUpdate(event, path, context)
    ]);

  }).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    return logger.fail('buildUpdate failed' + (err.message ? ': ' + err.message : ''));
  });
}
