import { basename, join } from 'path';
import { readdirSync} from 'fs';

import { paramCase, pascalCase } from 'change-case';

import * as Constants from '../util/constants';
import * as GeneratorConstants from './constants';
import { getPropertyValue, readFileAsync, replaceAll, writeFileAsync } from '../util/helpers';
import { BuildContext, GeneratorRequest, HydratedGeneratorRequest } from '../util/interfaces';

export function hydrateRequest(context: BuildContext, request: GeneratorRequest) {
  const hydrated = Object.assign({}, request) as HydratedGeneratorRequest;
  hydrated.className = pascalCase(request.name);
  hydrated.fileName = paramCase(request.name);

  hydrated.dirToRead = join(getPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_TEMPLATE_DIR), request.type);

  const baseDir = getDirToWriteToByType(context, request.type);
  hydrated.dirToWrite = join(baseDir, hydrated.fileName);

  return hydrated;
}

export function readTemplates(pathToRead: string): Promise<Map<string, string>> {
  const fileNames = readdirSync(pathToRead);
  const absolutePaths = fileNames.map(fileName => {
    return join(pathToRead, fileName);
  });
  const filePathToContent = new Map<string, string>();
  const promises = absolutePaths.map(absolutePath => {
    const promise = readFileAsync(absolutePath);
    promise.then((fileContent: string) => {
      filePathToContent.set(absolutePath, fileContent);
    });
  });
  return Promise.all(promises).then(() => {
    return filePathToContent;
  });
}

export function filterOutTemplates(request: HydratedGeneratorRequest, templates: Map<string, string>) {
  const templatesToUseMap = new Map<string, string>();
  templates.forEach((fileContent: string, filePath: string) => {
    const newFileExtension = basename(filePath, GeneratorConstants.KNOWN_FILE_EXTENSION);
    const shouldSkip = (!request.includeNgModule && newFileExtension === GeneratorConstants.NG_MODULE_FILE_EXTENSION) || (!request.includeSpec && newFileExtension === GeneratorConstants.SPEC_FILE_EXTENSION);
    if (!shouldSkip) {
      templatesToUseMap.set(filePath, fileContent);
    }
  });
  return templatesToUseMap;
}

export function applyTemplates(request: HydratedGeneratorRequest, templates: Map<string, string>) {
  const appliedTemplateMap = new Map<string, string>();
  templates.forEach((fileContent: string, filePath: string) => {
    const classnameRemovedContent = replaceAll(fileContent, GeneratorConstants.CLASSNAME_VARIABLE, request.className);
    const fileNameRemovedContent = replaceAll(classnameRemovedContent, GeneratorConstants.FILENAME_VARIABLE, request.fileName);
    appliedTemplateMap.set(filePath, fileNameRemovedContent);
  });
  return appliedTemplateMap;
}

export function writeGeneratedFiles(request: HydratedGeneratorRequest, processedTemplates: Map<string, string>): Promise<string[]> {
  const promises: Promise<any>[] = [];
  const createdFileList: string[] = [];
  processedTemplates.forEach((fileContent: string, filePath: string) => {
    const newFileExtension = basename(filePath, GeneratorConstants.KNOWN_FILE_EXTENSION);
    const newFileName = `${request.fileName}.${newFileExtension}`;
    const fileToWrite = join(request.dirToWrite, newFileName);
    createdFileList.push(fileToWrite);
    promises.push(writeFileAsync(fileToWrite, fileContent));
  });
  return Promise.all(promises).then(() => {
    return createdFileList;
  });
}

export function getDirToWriteToByType(context: BuildContext, type: string) {
  if (type === Constants.COMPONENT) {
    return context.componentsDir;
  } else if ( type === Constants.DIRECTIVE) {
    return context.directivesDir;
  } else if (type === Constants.PAGE) {
    return context.pagesDir;
  } else if ( type === Constants.PIPE) {
    return context.pipesDir;
  } else if (type === Constants.PROVIDER) {
    return context.providersDir;
  }
  throw new Error(`Unknown Generator Type: ${type}`);
}
