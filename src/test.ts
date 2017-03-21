import * as childProcess from 'child_process';

import { BuildContext } from './util/interfaces';
import { getConfigValue, hasConfigValue } from './util/config';
import { BuildError } from './util/errors';
import { setContext } from './util/helpers';
import { Logger } from './logger/logger';
import { watch } from './watch';

const DEV_LOGGER_DEFAULT_PORT = 53703;
const LIVE_RELOAD_DEFAULT_PORT = 35729;
const DEV_SERVER_DEFAULT_PORT = 8100;
const DEV_SERVER_DEFAULT_HOST = '0.0.0.0';

export function test(context: BuildContext) {
  setContext(context);

  const logger = new Logger('test');

  console.log('TESTING');
  //"test": "karma start ./test-config/karma.conf.js"

  Logger.info('Running Karma');

  return new Promise((resolve, reject) => {

    childProcess.exec('karma start ./testing/karma.conf.js', (err, stdout, stderr) => {
      console.log(err, stdout, stderr);
      logger.finish();
      resolve();
    });
  });


  //.then(() => {
  //return Promise.resolve().then(() => {
    //logger.finish();
  //});
  //})
  //.catch(err => {
    //throw logger.fail(err);
  //});

}
