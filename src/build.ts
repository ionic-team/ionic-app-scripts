import { BuildContext, BuildCommand, BuildOptions } from './interfaces';
import { transpile } from './transpile';
import { bundle } from './bundle';
import { clean } from './clean';
import { copy } from './copy';
import { generateContext, Logger } from './util';
import { compress } from './compress';
import { ngc } from './ngc';
import { sass } from './sass';


export function build(context?: BuildContext, options: BuildOptions = {}) {
  context = generateContext(context);
  const logger = new Logger('build');

  // create the defaults if it wasn't provided
  const cmds: BuildCommand[] = [
    { sync: clean },
    { async: copy },
    { sync: ngc },
    { sync: bundle },
    { async: sass },
    { async: transpile },
   ];

   if (options.runCompress) {
     cmds.push({ sync: compress, awaitPreviousAsyncs: true });
   }

  return runCmds(context, cmds).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    return logger.fail('Build failed' + (err.message ? ': ' + err.message : ''));
  });
}


export function rebuild(context: BuildContext) {
  const logger = new Logger('rebuild');

  // create the defaults if it wasn't provided
  const cmds: BuildCommand[] = [
    { sync: ngc },
    { sync: bundle },
    { sync: transpile },
   ];

  return runCmds(context, cmds).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    return logger.fail('RebuildJS failed' + (err.message ? ': ' + err.message : ''));
  });
}


export function runCmds(context: BuildCommand, cmds: BuildCommand[], index: number = 0): Promise<any> {
  const cmd = cmds[index];

  Logger.debug(`Starting ${cmd}`);

  if (cmd) {

    let waitingAsyncPromises: Promise<any>[];
    if (cmd.awaitPreviousAsyncs) {
      waitingAsyncPromises = cmds.filter(c => !!c.asyncPromise).map(c => c.asyncPromise);
    } else {
      waitingAsyncPromises = [];
    }

    return Promise.all(waitingAsyncPromises).then(() => {
      if (cmd.sync) {
        const rtn = cmd.sync(context);
        if (rtn instanceof Promise) {
          return rtn.then(() => {
            return runCmds(context, cmds, ++index);
          });
        }

      } else if (cmd.async) {
        cmd.asyncPromise = new Promise(resolve => {
          const rtn = cmd.async(context);
          if (rtn instanceof Promise) {
            rtn.then(resolve);
          } else {
            resolve();
          }
        });
      }

      return runCmds(context, cmds, ++index);
    });
  }

  const remainingPromises = cmds.filter(c => !!c.asyncPromise).map(c => c.asyncPromise);
  return Promise.all(remainingPromises);
}
