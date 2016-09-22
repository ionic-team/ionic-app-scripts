import { BuildContext, BuildOptions, Logger } from './util';
import { bundleUpdate } from './bundle';
import { join, parse, sep } from 'path';
import { readFileSync } from 'fs';
import { sassUpdate } from './sass';


export function templateUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  path = join(context.rootDir, path);

  const logger = new Logger('templateUpdate');

  return runTemplateUpdate(event, path, context, options).then(() => {
    // congrats, we did it!
    return logger.finish();

  }).catch(err => {
    return logger.fail('templateUpdate failed' + (err.message ? ': ' + err.message : ''));
  });
}


function runTemplateUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  // not sure how it changed, just do a full rebuild without the bundle cache
  return bundleUpdate(event, path, context, options, false).then(() => {
    return sassUpdate(event, path, context, options, true);
  });
}


export function inlineTemplate(options: NgTemplateOptions, source: string, sourcePath: string) {
  const componentDir = parse(sourcePath).dir;
  let match: any;
  let rewrite: string;
  let didRewrite = false;
  let sourceScan = source;

  options.directoryMaps = options.directoryMaps || {
    '.tmp': 'src'
  };

  while ((match = COMPONENT_REGEX.exec(sourceScan)) !== null) {
    rewrite = match[0].replace(TEMPLATE_URL_REGEX, (m: any, urlValue: string) => {
      if (urlValue.indexOf('\'') > -1 || urlValue.indexOf('"') > -1 || urlValue.indexOf('`') > -1) {
        didRewrite = true;
        return replaceTemplate(options, componentDir, urlValue);
      }
      return urlValue;
    });

    if (didRewrite) {
      source = source.replace(match[0], rewrite);
    }

    sourceScan = sourceScan.substring(match.index + match[0].length);
  }

  if (didRewrite) {
    return source;
  }

  return null;
}


function replaceTemplate(options: NgTemplateOptions, componentDir: string, urlValue: string): string {
  return urlValue.replace(HTML_PATH_URL_REGEX, (match: any, quote: string, filePath: string) => {
    return inlineSourceWithTemplate(options, componentDir, filePath);
  });
}


function inlineSourceWithTemplate(options: NgTemplateOptions, componentDir: string, filePath: string) {
  let rtn = `templateUrl: '${filePath}'`;

  try {
    let htmlPath = join(componentDir, filePath);

    for (var k in options.directoryMaps) {
      htmlPath = htmlPath.replace(sep + k + sep, sep + options.directoryMaps[k] + sep);
    }

    let htmlContent = readFileSync(htmlPath).toString();
    htmlContent = htmlContent.replace(/\r|\n/g, '\\n');
    htmlContent = htmlContent.replace(/\'/g, '\\\'');

    rtn = `template: '${htmlContent}'`;

  } catch (e) {
    console.error(`Error reading template file, "${filePath}": ${e}`);
  }

  return rtn;
}


const COMPONENT_REGEX = /Component\s*?\(\s*?({([\s\S]*?)}\s*?)\)/m;
const TEMPLATE_URL_REGEX = /templateUrl\s*:(.*)/;
const HTML_PATH_URL_REGEX = /(['"])((?:[^\\]\\\1|.)*?)\1/g;


export interface NgTemplateOptions {
  include?: string[];
  exclude?: string[];
  directoryMaps?: {[key: string]: string};
  componentDir?: string;
}
