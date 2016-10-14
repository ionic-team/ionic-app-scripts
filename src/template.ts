import { BuildContext } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { bundleUpdate, getJsOutputDest } from './bundle';
import { dirname, join, parse, basename } from 'path';
import { endsWith } from './util/helpers';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { sassUpdate } from './sass';
import * as MagicString from 'magic-string';


export function templateUpdate(event: string, path: string, context: BuildContext) {
  path = join(context.rootDir, path);

  const logger = new Logger('template update');

  return templateUpdateWorker(event, path, context)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


function templateUpdateWorker(event: string, path: string, context: BuildContext) {
  Logger.debug(`templateUpdate, event: ${event}, path: ${path}`);

  if (event === 'change') {
    if (updateBundledJsTemplate(context, path)) {
      Logger.debug(`templateUpdate, updated js bundle, path: ${path}`);
      return Promise.resolve();
    }
  }

  // not sure how it changed, just do a full rebuild without the bundle cache
  context.useBundleCache = false;
  return bundleUpdate(event, path, context)
    .then(() => {
      context.useSassCache = true;
      return sassUpdate(event, path, context);
    })
    .catch(err => {
      throw new BuildError(err);
    });
}


function getSourceComponentFile(htmlFilePath: string, context: BuildContext) {
  let rtn: string = null;

  try {
    const changedHtmlFilename = basename(htmlFilePath);
    const componentDir = dirname(htmlFilePath);
    const filePaths = readdirSync(componentDir);
    let match: TemplateUrlMatch;

    for (var i = 0; i < filePaths.length; i++) {
      var filePath = filePaths[i];
      if (endsWith(filePath, '.ts') && !endsWith(filePath, '.d.ts')) {
        // found a .ts file in this same directory
        // open it up and see if it's a component
        // and see if it has a template url with the same filename
        var tsComponentFile = join(componentDir, filePath);
        var source = readFileSync(join(componentDir, filePath)).toString();

        if (match = getTemplateMatch(source)) {
          var componentHtmlFilename = basename(match.templateUrl);
          if (changedHtmlFilename === componentHtmlFilename) {
            rtn = tsComponentFile;
            break;
          }
        }
      }
    }

  } catch (e) {
    Logger.debug(`${getSourceComponentFile} ${e}`);
  }

  return rtn;
}


export function inlineTemplate(sourceText: string, sourcePath: string): string {
  const magicString = new MagicString(sourceText);
  const componentDir = parse(sourcePath).dir;
  let match: TemplateUrlMatch;
  let replacement: string;
  let lastStart = -1;

  while (match = getTemplateMatch(magicString.toString())) {
    if (match.start === lastStart) {
      // panic! we don't want to melt any machines if there's a bug
      Logger.debug(`Error matching component: ${match.component}`);
      return magicString.toString();
    }
    lastStart = match.start;

    if (match.templateUrl === '') {
      Logger.error(`Error @Component templateUrl missing in: "${sourcePath}"`);
      return magicString.toString();
    }

    replacement = updateTemplate(componentDir, match);
    if (replacement) {
      magicString.overwrite(match.start, match.end, replacement);
    }
  }

  return magicString.toString();
}


function updateTemplate(componentDir: string, match: TemplateUrlMatch): string {
  const htmlFilePath = join(componentDir, match.templateUrl);

  try {
    const templateContent = readFileSync(htmlFilePath, 'utf8');
    return replaceTemplateUrl(match, htmlFilePath, templateContent);
  } catch (e) {
    Logger.error(`template error, "${htmlFilePath}": ${e}`);
  }

  return null;
}


export function replaceTemplateUrl(match: TemplateUrlMatch, htmlFilePath: string, templateContent: string): string {
  const orgTemplateProperty = match.templateProperty;
  const newTemplateProperty = getTemplateFormat(htmlFilePath, templateContent);

  return match.component.replace(orgTemplateProperty, newTemplateProperty);
}


function updateBundledJsTemplate(context: BuildContext, htmlFilePath: string) {
  const outputDest = getJsOutputDest(context);

  try {
    let bundleSourceText = readFileSync(outputDest, 'utf8');
    let newTemplateContent = readFileSync(htmlFilePath, 'utf8');

    bundleSourceText = replaceBundleJsTemplate(bundleSourceText, newTemplateContent, htmlFilePath);

    if (bundleSourceText) {
      writeFileSync(outputDest, bundleSourceText, { encoding: 'utf8'});
      return true;
    }

  } catch (e) {
    Logger.debug(`templateUpdate, error opening bundle js: ${e}`);
  }

  return false;
}

export function replaceBundleJsTemplate(bundleSourceText: string, newTemplateContent: string, htmlFilePath: string): string {
  const prefix = getTemplatePrefix(htmlFilePath);
  const startIndex = bundleSourceText.indexOf(prefix);

  if (startIndex === -1) {
    return null;
  }

  const suffix = getTemplateSuffix(htmlFilePath);
  const endIndex = bundleSourceText.indexOf(suffix, startIndex + 1);

  if (endIndex === -1) {
    return null;
  }

  const oldTemplate = bundleSourceText.substring(startIndex, endIndex + suffix.length);
  const newTemplate = getTemplateFormat(htmlFilePath, newTemplateContent);

  while (bundleSourceText.indexOf(oldTemplate) > -1) {
    bundleSourceText = bundleSourceText.replace(oldTemplate, newTemplate);
  }

  return bundleSourceText;
}


export function getTemplateFormat(htmlFilePath: string, content: string) {
  // turn the template into one line and espcape single quotes
  content = content.replace(/\r|\n/g, '\\n');
  content = content.replace(/\'/g, '\\\'');

  return `${getTemplatePrefix(htmlFilePath)}'${content}'${getTemplateSuffix(htmlFilePath)}`;
}


function getTemplatePrefix(sourcePath: string) {
  return `template:/*ion-inline-start:"${sourcePath}"*/`;
}


function getTemplateSuffix(sourcePath: string) {
  return `/*ion-inline-end:"${sourcePath}"*/`;
}


export function getTemplateMatch(str: string): TemplateUrlMatch {
  const match = COMPONENT_REGEX.exec(str);
  if (match) {
    return {
      start: match.index,
      end: match.index + match[0].length,
      component: match[0],
      templateProperty: match[3],
      templateUrl: match[5].trim()
    };
  }
  return null;
}


const COMPONENT_REGEX = /Component\s*?\(\s*?(\{([\s\S]*?)(\s*templateUrl\s*:\s*(['"`])(.*?)(['"`])\s*?)([\s\S]*?)}\s*?)\)/m;

export interface TemplateUrlMatch {
  start: number;
  end: number;
  component: string;
  templateProperty: string;
  templateUrl: string;
}
