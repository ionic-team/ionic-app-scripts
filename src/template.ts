import { BuildContext, BuildOptions } from './util/interfaces';
import { bundleUpdate, clearCachedModule } from './bundle';
import { dirname, join, parse, basename } from 'path';
import { endsWith } from './util/helpers';
import { Logger } from './util/logger';
import { readFileSync, readdirSync } from 'fs';
import { sassUpdate } from './sass';
import * as MagicString from 'magic-string';


export function templateUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  path = join(context.rootDir, path);

  const logger = new Logger('templateUpdate');

  return runTemplateUpdate(event, path, context, options).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    throw logger.fail(err);
  });
}


function runTemplateUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  Logger.debug(`templateUpdate, event: ${event}, path: ${path}`);

  if (event === 'change') {
    // just a change event, see if this html file has a component in the same directory
    // doing this to prevent an unnecessary TS compile and bundling without cache if it was just a HTML change
    const componentFile = getSourceComponentFile(path, context);
    if (componentFile && clearCachedModule(context, componentFile)) {
      // we successfully found the compiled JS file and cleared it from the bundle cache
      return bundleUpdate(event, path, context, options, true);
    }
  }

  // not sure how it changed, just do a full rebuild without the bundle cache
  return bundleUpdate(event, path, context, options, false).then(() => {
    return sassUpdate(event, path, context, options, true);
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
  const templateContent = getTemplateContent(componentDir, match.templateUrl);
  if (!templateContent) {
    return null;
  }
  return replaceTemplateUrl(match, templateContent);
}


export function replaceTemplateUrl(match: TemplateUrlMatch, templateContent: string): string {
  // turn the template into one line and espcape single quotes
  templateContent = templateContent.replace(/\r|\n/g, '\\n');
  templateContent = templateContent.replace(/\'/g, '\\\'');

  const orgTemplateProperty = match.templateProperty;
  const newTemplateProperty = 'template: /* ion-inline-template */ \'' + templateContent + '\'';

  return match.component.replace(orgTemplateProperty, newTemplateProperty);
}


function getTemplateContent(componentDir: string, templateUrl: string) {
  let rtn: string = null;

  try {
    rtn = readFileSync(join(componentDir, templateUrl), 'utf-8');
  } catch (e) {
    Logger.error(`Error reading template file, "${templateUrl}": ${e}`);
  }

  return rtn;
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
