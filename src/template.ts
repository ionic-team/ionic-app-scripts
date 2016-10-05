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

  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}


function runTemplateUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  Logger.debug(`templateUpdate, event: ${event}, path: ${path}`);

  if (event === 'change') {
    // just a change event, see if this html file has a component in the same directory
    // doing this to prevent an unnecessary TS compile and bundling without cache if it was just a HTML change
    const componentFile = getSourceComponentFile(path, context);
    if (clearCachedModule(componentFile)) {
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
    let match: any;

    for (var i = 0; i < filePaths.length; i++) {
      var filePath = filePaths[i];
      if (endsWith(filePath, '.ts') && !endsWith(filePath, '.d.ts')) {
        // found a .ts file in this same directory
        // open it up and see if it's a component
        // and see if it has a template url with the same filename
        var tsComponentFile = join(componentDir, filePath);
        var source = readFileSync(join(componentDir, filePath)).toString();

        if (match = COMPONENT_REGEX.exec(source)) {
          var templateUrl = match[4];
          var componentHtmlFilename = basename(templateUrl.trim());
          if (changedHtmlFilename === componentHtmlFilename) {
            rtn = tsComponentFile;
            break;
          }
        }
      }
    }

  } catch (e) {
    Logger.error(e);
  }

  return rtn;
}


export function inlineTemplate(sourceText: string, sourcePath: string): InlineTemplateOutput {
  const magicString = new MagicString(sourceText);
  const componentDir = parse(sourcePath).dir;
  let match: RegExpExecArray;
  let hasReplacements = false;
  let start: number;
  let end: number;
  let templateUrl: string;
  let replacement: string;
  let lastStart = -1;

  while (match = COMPONENT_REGEX.exec(magicString.toString())) {
    start = match.index;
    if (start === lastStart) {
      // panic! we don't want to melt any machines if there's a bug
      Logger.debug(`Error matching component: ${match[0]}`);
      return null;
    }
    lastStart = start;

    end = start + match[0].length;
    templateUrl = match[4].trim();
    if (templateUrl === '') {
      Logger.error(`Error @Component templateUrl missing in: "${sourcePath}"`);
      return null;
    }

    replacement = updateTemplate(componentDir, templateUrl, match);
    if (replacement) {
      magicString.overwrite(start, end, replacement);
      hasReplacements = true;
    }
  }

  if (hasReplacements) {
    return {
      code: magicString.toString(),
      map: magicString.generateMap({
        source: sourcePath,
        hires: false
      })
    };
  }

  return null;
}


function updateTemplate(componentDir: string, templateUrl: string, match: RegExpMatchArray): string {
  const templateContent = getTemplateContent(componentDir, templateUrl);
  if (!templateContent) {
    return null;
  }
  return replaceTemplateUrl(match, templateContent);
}


export function replaceTemplateUrl(match: RegExpMatchArray, templateContent: string): string {
  // turn the template into one line and espcape single quotes
  templateContent = templateContent.replace(/\r|\n/g, '\\n');
  templateContent = templateContent.replace(/\'/g, '\\\'');

  const orgComponent = match[0];
  const orgTemplateProperty = match[2];
  const newTemplateProperty = `template: '${templateContent}' /* ion-inline-template */`;

  return orgComponent.replace(orgTemplateProperty, newTemplateProperty);
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


export const COMPONENT_REGEX = /@Component\s*?\(\s*?({(\s*templateUrl\s*:\s*(['"`])(.*?)(['"`])\s*?)}\s*?)\)/m;


export interface InlineTemplateOutput {
  code: string;
  map: any;
}
