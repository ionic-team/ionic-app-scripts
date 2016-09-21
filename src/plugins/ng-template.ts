import { inlineTemplate, NgTemplateOptions } from '../template';


export function ngTemplate(options: NgTemplateOptions = {}) {
  const pluginutils = require('rollup-pluginutils');

  options.exclude = options.exclude || [
    'node_modules/@angular/**',
    'node_modules/ionic-angular/**',
    'node_modules/rxjs/**'
  ];

  const filter = pluginutils.createFilter(options.include, options.exclude);

  return {
    name: 'ng-template',

    transform(source: string, sourcePath: string): string {
      if (filter(sourcePath)) {
        return inlineTemplate(options, source, sourcePath);
      }
      return null;
    }
  };
}
