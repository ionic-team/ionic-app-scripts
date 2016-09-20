import { readFileSync } from 'fs';
import { join, parse, sep } from 'path';


export function ngTemplate(options: NgTemplateOptions = {}) {
  var pluginutils = require('rollup-pluginutils');

  options.exclude = options.exclude || [
    'node_modules/@angular/**',
    'node_modules/ionic-angular/**',
    'node_modules/rxjs-es/**',
    'node_modules/rxjs/**'
  ];

  options.directoryMaps = options.directoryMaps || {
    '.tmp': 'src'
  };

  var filter = pluginutils.createFilter(options.include, options.exclude);

  return {
    name: 'ng-template',

    transform(source: string, id: string): string {
      if (filter(id)) {
        var componentDir = parse(id).dir;
        var match: any;
        var rewrite: string;
        var didRewrite = false;
        var sourceScan = source;

        while ((match = COMPONENT_REGEX.exec(sourceScan)) !== null) {
          rewrite = match[0].replace(TEMPLATE_URL_REGEX, function(m: any, urlValue: string) {
            didRewrite = true;
            return replaceTemplate(options, componentDir, urlValue);
          });

          if (didRewrite) {
            source = source.replace(match[0], rewrite);
          }

          sourceScan = sourceScan.substring(match.index + match[0].length);
        }

        if (didRewrite) {
          // console.log(source);
          return source;
        }
      }
      return null;
    }
  };
}


function replaceTemplate(options: NgTemplateOptions, componentDir: string, urlValue: string): string {
  return urlValue.replace(HTML_PATH_URL_REGEX, function(match: any, quote: string, filePath: string) {
    return inlineTemplate(options, componentDir, filePath);
  });
}


function inlineTemplate(options: NgTemplateOptions, componentDir: string, filePath: string) {
  var rtn = 'templateUrl: "' + filePath + '"';

  try {
    var htmlPath = join(componentDir, filePath);

    for (var k in options.directoryMaps) {
      htmlPath = htmlPath.replace(sep + k + sep, sep + options.directoryMaps[k] + sep);
    }

    var htmlContent = readFileSync(htmlPath).toString();
    htmlContent = htmlContent.replace(/\n/g, '\\n');
    htmlContent = htmlContent.replace(/\"/g, '\\"');

    rtn = 'template: "' + htmlContent + '"';

  } catch (e) {
    console.error(`Error reading template file, "${filePath}": ${e}`);
  }

  return rtn;
}


var COMPONENT_REGEX = /Component\s*?\(\s*?({([\s\S]*?)}\s*?)\)/m;
var TEMPLATE_URL_REGEX = /templateUrl\s*:(.*)/;
var HTML_PATH_URL_REGEX = /(['"])((?:[^\\]\\\1|.)*?)\1/g;


export interface NgTemplateOptions {
  include?: string[];
  exclude?: string[];
  directoryMaps?: {[key: string]: string};
  componentDir?: string;
}
