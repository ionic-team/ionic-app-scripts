import { generateContext } from './util/config';
import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import { getNgModules, GeneratorOption, GeneratorRequest, nonPageFileManipulation, processNonTabRequest } from './generators/util';

export { getNgModules, GeneratorOption, GeneratorRequest };

export function generateNonTab(request: GeneratorRequest) {
  const context = generateContext();
  return processNonTabRequest(context, request);
}

export function processPageRequest(context: BuildContext, name: string) {
  return processNonTabRequest(context, { type: 'page', name });
}

export function processPipeRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'pipe');
}

export function processDirectiveRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'directive');
}

export function processComponentRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'component');
}

export function processProviderRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'provider');
}

export function listOptions() {
  const list: GeneratorOption[] = [];
  list.push({type: Constants.COMPONENT, multiple: false});
  list.push({type: Constants.DIRECTIVE, multiple: false});
  list.push({type: Constants.PAGE, multiple: false});
  list.push({type: Constants.PIPE, multiple: false});
  list.push({type: Constants.PROVIDER, multiple: false});
  list.push({type: Constants.TABS, multiple: true});
  return list;
}



