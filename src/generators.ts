import { Logger} from './logger/logger';
import { generateContext } from './util/config';
import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import { readFileAsync, writeFileAsync } from './util/helpers';
import { getTypescriptSourceFile, appendNgModuleDeclaration, insertNamedImportIfNeeded } from './util/typescript-utils';
import { applyTemplates, filterOutTemplates, getNgModules, GeneratorOption, GeneratorRequest, hydrateRequest, readTemplates, writeGeneratedFiles } from './generators/util';
import * as path from 'path';

export { getNgModules, GeneratorOption, GeneratorRequest };

export function generateNonTab(request: GeneratorRequest) {
  const context = generateContext();
  return processNonTabRequest(context, request);
}

export function processPageRequest(context: BuildContext, name: string) {
  return processNonTabRequest(context, { type: 'page', name });
}

export function processPipeRequest(context: BuildContext, name: string, ngModulePath: string) {
  const hydratedRequest = hydrateRequest(context, { type: 'pipe', name });
  return readFileAsync(ngModulePath).then((fileContent: string) => {
    fileContent = insertNamedImportIfNeeded(ngModulePath, fileContent, hydratedRequest.className, path.relative(path.dirname(ngModulePath), hydratedRequest.dirToWrite));
    fileContent = appendNgModuleDeclaration(ngModulePath, fileContent, hydratedRequest.className);
    return writeFileAsync(ngModulePath, fileContent);
  }).then(() => {
    return processNonTabRequest(context, hydratedRequest);
  }).then(() => {
    // TODO
  });
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



