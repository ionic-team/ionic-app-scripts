import { BuildContext } from './interfaces';
import { transpile } from './transpile';
import { bundle } from './bundle';
import { clean } from './clean';
import { copy } from './copy';
import { generateContext, Logger } from './util';
import { compress } from './compress';
import { ngc } from './ngc';
import { sass } from './sass';


export function build(context?: BuildContext) {
  const logger = new Logger('build');
  context = generateContext(context);

  // sync clean up the www directory
  clean(context);

  // async copy assets, index.html and other static files over
  // nothing should have to wait on this finishing
  copy(context);

  // start async flow
  // run ngc
  ngc(context).then(() => {
    // we now have es6 and ng.factories in the tmp directory
    // now bundle the es6 tmp directory files
    return bundle(context);

  }).then(() => {
    // we now have a bundled es6 file
    // compiling sass and transpiling js can run async side-by-side
    return Promise.all([
      // compile sass files next to used modules
      sass(context),
      // transpile bundled es6 to es5
      transpile(context)
    ]);

  }).then(() => {
    // if runCompress is set then minify bundled es5
    // and clean up css. Useful for prod builds
    if (context.runCompress) {
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
