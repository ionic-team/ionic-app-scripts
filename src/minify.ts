import { cleancss } from './cleancss';
import { closure, isClosureSupported } from './closure';
import { BuildContext, generateContext, Logger } from './util';
import { uglifyjs } from './uglifyjs';


export function minify(context?: BuildContext) {
  context = generateContext(context);

  const logger = new Logger('minify');

  // both css and js minify can run at the same time
  const promises: Promise<any>[] = [
    cleancss(context)
  ];

  if (isClosureSupported(context)) {
    // use closure if it's supported and local executable provided
    promises.push(closure(context));

  } else {
    // default to uglify if no closure
    promises.push(uglifyjs(context));
  }

  return Promise.all(promises).then(() => {
    return logger.finish();
  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}
