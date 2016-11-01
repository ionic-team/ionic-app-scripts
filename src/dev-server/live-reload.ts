import { BuildContext } from '../util/interfaces';
import { getConfigValue, hasConfigValue } from '../util/config';
import { relative } from 'path';
import * as events from '../util/events';
import * as tinylr from 'tiny-lr';


let liveReloadServer: any;
let liveReloadScript: string;

export function createLiveReloadServer(context: BuildContext, host: string) {
  if (liveReloadServer) {
    return;
  }

  liveReloadScript = getLiveReloadScript(context, host);

  liveReloadServer = tinylr();

  liveReloadServer.listen(getLiveReloadServerPort(context), host);

  events.on(events.EventType.FileChange, (filePath: string) => {
    fileChanged(context, filePath);
  });
}


export function injectLiveReloadScript(content: any): any {
  let contentStr = content.toString();

  if (contentStr.indexOf('/livereload.js') > -1) {
    // already added script
    return content;
  }

  let match = contentStr.match(/<\/body>(?![\s\S]*<\/body>)/i);
  if (!match) {
    match = contentStr.match(/<\/html>(?![\s\S]*<\/html>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${liveReloadScript}\n${match[0]}`);
  } else {
    contentStr += liveReloadScript;
  }

  return contentStr;
}


export function getLiveReloadScript(context: BuildContext, host: string) {
  const port = getLiveReloadServerPort(context);
  if (!host) {
    host = 'localhost';
  }
  var src = `//${host}:${port}/livereload.js?snipver=1`;
  return `  <!-- Ionic Dev Server: Injected LiveReload Script -->\n  <script src="${src}" async="" defer=""></script>`;
}

function fileChanged(context: BuildContext, filePath: string|string[]) {
  if (liveReloadServer) {
    const files = Array.isArray(filePath) ? filePath : [filePath];

    liveReloadServer.changed({
      body: {
        files: files.map(f => '/' + relative(context.wwwDir, f))
      }
    });
  }
}


function getLiveReloadServerPort(context: BuildContext) {
  const port = getConfigValue(context, '--livereload-port', null, 'ionic_livereload_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return LIVE_RELOAD_DEFAULT_PORT;
}


export function useLiveReload(context: BuildContext) {
  return !hasConfigValue(context, '--nolivereload', '-d', 'ionic_livereload', false);
}

const LIVE_RELOAD_DEFAULT_PORT = 35729;
