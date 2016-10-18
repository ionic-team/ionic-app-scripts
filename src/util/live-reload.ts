import { BuildContext } from './interfaces';
import { getConfigValueDefault, hasConfigValue } from './config';
import { relative } from 'path';
import * as events from './events';
import * as tinylr from 'tiny-lr';

let liveReloadServer: any;
let liveReloadScript: string;

export function createLiveReloadServer(host: string) {
  if (liveReloadServer) {
    return;
  }

  const port = getLiveReloadServerPort();

  liveReloadScript = getLiveReloadScript(host, port);

  liveReloadServer = tinylr();

  liveReloadServer.listen(port, host);

  events.on(events.EventType.FileChange, (context: BuildContext, filePath: string) => {
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


function getLiveReloadScript(host: string, port: number) {
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


function getLiveReloadServerPort() {
  const port = getConfigValueDefault('--livereload-port', '-r', 'ionic_livereload_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return LIVE_RELOAD_DEFAULT_PORT;
}

export function useLiveReload() {
  return !hasConfigValue('--nolivereload', '-d', 'ionic_livereload', false);
}

const LIVE_RELOAD_DEFAULT_PORT = 35729;