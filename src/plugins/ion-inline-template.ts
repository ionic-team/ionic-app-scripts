import { inlineTemplate } from '../template';
import * as pluginutils from 'rollup-pluginutils';


export default function ionInlineTemplate(options?: IonInlineTemplateOptions) {
  options = options || {};

  const filter = pluginutils.createFilter(
    options.include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    options.exclude || ['*.d.ts', '**/*.d.ts']);

  return {
    name: 'ion-inline-template',

    transform(sourceText: string, sourcePath: string): any {
      if (filter(sourcePath)) {
        return inlineTemplate(sourceText, sourcePath);
      }
    }
  };
}


export interface IonInlineTemplateOptions {
  include?: string[];
  exclude?: string[];
}
