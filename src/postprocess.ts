import { Logger } from './logger/logger';
import { BuildContext } from './util/interfaces';
import { purgeSourceMapsIfNeeded } from './util/source-maps';


export function postprocess(context: BuildContext) {
  const logger = new Logger(`postprocess`);
  return postprocessWorker(context).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      throw logger.fail(err);
    });
}


function postprocessWorker(context: BuildContext) {
  return purgeSourceMapsIfNeeded(context);
}
