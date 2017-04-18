import { BuildContext } from '../util/interfaces';
import { getSystemData, toUnixPath } from '../util/helpers';
import { Logger } from '../logger/logger';
import * as MagicString from 'magic-string';


export function prependIonicGlobal(context: BuildContext, fileName: string, code: string) {
  const rtn: { code: string, map: any } = {
    code: code,
    map: undefined
  };

  try {
    const ionicGlobal = buildIonicGlobal(context);

    const s = new MagicString(code);

    s.prepend(ionicGlobal);

    rtn.code = s.toString();

    rtn.map = s.generateMap({
      source: fileName,
      file: fileName,
      includeContent: true
    });

  } catch (e) {
    Logger.error(`prependIonicGlobal: ${e}`);
  }

  return rtn;
}


export function buildIonicGlobal(context: BuildContext) {
  if ((<any>context).windowIonic) {
    // just a quick way to cache this to avoid unnecessary readFiles
    return (<any>context).windowIonic;
  }

  const systemData = getSystemData(context.rootDir);

  let staticDir = toUnixPath(context.buildDir.replace(context.wwwDir, ''));
  staticDir += '/';

  if (staticDir.charAt(0) === '/') {
    staticDir = staticDir.substring(1);
  }

  let output = `
    (function(w){
      var i = w.Ionic = w.Ionic || {};
      ${systemData.ionicFramework ? `i.version = '${systemData.ionicFramework}';` : ''}
      ${systemData.angularCore ? `i.angular = '${systemData.angularCore}';` : ''}
      ${systemData.ionicNative ? `i.ionicNative = '${systemData.ionicNative}';` : ''}
      i.staticDir = '${staticDir}';
    })(window);`;

  // real quick minification hacks
  output = output.replace('var i', 'var_i');
  output = output.replace(/\s/g, '');
  output = output.replace('var_i', 'var i');

  return (<any>context).windowIonic = output;
}
