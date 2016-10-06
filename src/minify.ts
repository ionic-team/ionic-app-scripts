import { BuildContext } from './util/interfaces';
import { cleancss } from './cleancss';
import { closure, isClosureSupported } from './closure';
import { generateContext } from './util/config';
import { Logger } from './util/logger';
import { uglifyjs } from './uglifyjs';


export function minify(context?: BuildContext) {
  context = generateContext(context);

  const logger = new Logger('minify');

  // both css and js minify can run at the same time
  const promises: Promise<any>[] = [
    minifyJs(context),
    minifyCss(context)
  ];

  return Promise.all(promises).then(() => {
    return logger.finish();

  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}


export function minifyJs(context?: BuildContext) {
  if (isClosureSupported(context)) {
    // use closure if it's supported and local executable provided
    return closure(context);
  }

  // default to uglify if no closure
  return uglifyjs(context);
}

export function minifyCss(context?: BuildContext) {
  return cleancss(context);
}
