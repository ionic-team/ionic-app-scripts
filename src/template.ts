import { BuildContext, BuildOptions, Logger, isTsFilename } from './util';
import { bundleUpdate, clearCachedModule } from './bundle';
import { dirname, join, parse, basename, sep } from 'path';
import { readFileSync, readdirSync } from 'fs';
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
    const changedHtmlFile = basename(htmlFilePath);
    const componentDir = dirname(htmlFilePath);
    const filePaths = readdirSync(componentDir);
    let match: any;

    for (var i = 0; i < filePaths.length; i++) {
      var filePath = filePaths[i];
      if (isTsFilename(filePath)) {
        // found a .ts file in this same directory
        // open it up and see if it's a component
        // and see if it has a template url with the same filename
        var tsComponentFile = join(componentDir, filePath);
        var source = readFileSync(join(componentDir, filePath)).toString();

        if ((match = COMPONENT_REGEX.exec(source)) !== null) {

          if ((match = TEMPLATE_URL_REGEX.exec(match[0])) !== null) {

            var componentHtmlFile = basename(match[1].replace(/\'|\"|\`/g, '').trim());
            if (changedHtmlFile === componentHtmlFile) {
              rtn = getCompiledJsFile(tsComponentFile, context);
              break;
            }

          }
        }
      }
    }

  } catch (e) {
    Logger.error(e);
  }

  return rtn;
}


function getCompiledJsFile(tsComponentFile: string, context: BuildContext) {
  let jsCompiledFile = tsComponentFile.replace(context.srcDir, context.tmpDir);
  return jsCompiledFile.substr(0, jsCompiledFile.length - 2) + 'js';
}


export function inlineTemplate(options: NgTemplateOptions, source: string, sourcePath: string) {
  const componentDir = parse(sourcePath).dir;
  let match: RegExpExecArray;
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
