import { Logger} from './logger/logger';
import { generateContext } from './util/config';
import * as Constants from './util/constants';
import { BuildContext, GeneratorOption, GeneratorRequest } from './util/interfaces';

export function generateNonTab(request: GeneratorRequest) {
  const context = generateContext();
  return processNonTabRequest(context, request);
}

function processNonTabRequest(context: BuildContext, request: GeneratorRequest) {

}

export function listOptions() {
  const list: GeneratorOption[] = [];
  list.push({type: Constants.COMPONENT, multiple: false});
  list.push({type: Constants.DIRECTIVE, multiple: false});
  list.push({type: Constants.PAGE, multiple: false});
  list.push({type: Constants.PIPE, multiple: false});
  list.push({type: Constants.PROVIDER, multiple: false});
  list.push({type: Constants.TABS, multiple: true});
}



