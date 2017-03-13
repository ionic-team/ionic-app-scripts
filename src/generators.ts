import { Logger} from './logger/logger';
import { generateContext } from './util/config';
import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import { applyTemplates, filterOutTemplates, GeneratorOption, GeneratorRequest, hydrateRequest, readTemplates, writeGeneratedFiles } from './generators/util';

export { GeneratorOption };
export { GeneratorRequest };

export function generateNonTab(request: GeneratorRequest) {
  const context = generateContext();
  return processNonTabRequest(context, request);
}

export function processPageRequest(context: BuildContext, name: string) {
  return processNonTabRequest(context, { type: 'page', name });
}

function processNonTabRequest(context: BuildContext, request: GeneratorRequest): Promise<string[]> {
  Logger.debug('[Generators] processNonTabRequest: Hydrating the request with project data ...');
  const hydratedRequest = hydrateRequest(context, request);
  Logger.debug('[Generators] processNonTabRequest: Reading templates ...');
  return readTemplates(hydratedRequest.dirToRead).then((map: Map<string, string>) => {
    Logger.debug('[Generators] processNonTabRequest: Filtering out NgModule and Specs if needed ...');
    return filterOutTemplates(hydratedRequest, map);
  }).then((filteredMap: Map<string, string>) => {
    Logger.debug('[Generators] processNonTabRequest: Applying tempaltes ...');
    const appliedTemplateMap = applyTemplates(hydratedRequest, filteredMap);
    Logger.debug('[Generators] processNonTabRequest: Writing generated files to disk ...');
    return writeGeneratedFiles(hydratedRequest, appliedTemplateMap);
  });
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



