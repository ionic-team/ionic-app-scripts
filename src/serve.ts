import { BuildContext } from './util/interfaces';
import { generateContext, getConfigValueDefault } from './util/config';
import { Logger } from './util/logger';
import { join, relative } from 'path';
import { readFile } from 'fs';
import { watch } from './watch';
import * as chalk from 'chalk';
import * as events from './util/events';
import * as http from 'http';
import * as mime from 'mime-types';
import * as tinylr from 'tiny-lr';


let devServer: http.Server;
let liveReloadServer: any;


export function serve(context?: BuildContext) {
  context = generateContext(context);

  setupEvents();

  return watch(context)
    .then(() => {
      createDevServer(context);
    }, () => {
      createDevServer(context);
    });
}


export function createDevServer(context: BuildContext) {
  const port = getDevServerPort(context);
  const host = getDevServerHost(context);
  const devAddress = `http://${host || 'localhost'}:${port}/`;

  function httpServerListen() {
    devServer.listen(port, host, undefined, () => {
      Logger.info(chalk.green(`dev server running: ${devAddress}`));
      createLiveReloadServer(host);
    });
  }

  if (devServer) {
    devServer.close();
  }

  devServer = http.createServer((request, response) => {
    devServerListener(context, request, response);
  });

  devServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      Logger.error(`server already in use, retrying....`);

      setTimeout(() => {
        devServer.close();
        httpServerListen();
      }, 1500);
    }
  });

  httpServerListen();
}


function devServerListener(context: BuildContext, request: http.IncomingMessage, response: http.ServerResponse) {
  let filePath = '.' + request.url;
  if (filePath === './') {
    filePath = './' + DEV_SERVER_DEFAULT_INDEX;
  }

  filePath = join(context.wwwDir, filePath);
  filePath = filePath.split('?')[0];

  if (filePath.indexOf('/cordova.js') > -1) {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end('// mock cordova file during development');
    return;
  }

  readFile(filePath, (err, content) => {
    const contentType = {
      'Content-Type': 'text/html',
      'X-DEV-FILE-PATH': filePath
    };

    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404, contentType);
        response.end(`File not found: ${request.url}<br>Local file: ${filePath}`);

      } else {
        Logger.error(`http server error: ${err}`);
        response.writeHead(500, contentType);
        response.end(`Sorry, check with the site admin for error: ${err.code} ..\n`);
      }

    } else {
      contentType['Content-Type'] = mime.lookup(filePath) || 'application/octet-stream';
      response.writeHead(200, contentType);
      response.end(content, mime.charset(contentType));
    }
  });
}


function createLiveReloadServer(host: string) {
  if (liveReloadServer) {
    return;
  }

  liveReloadServer = tinylr();

  liveReloadServer.listen(LIVE_RELOAD_DEFAULT_PORT, host);
}


function fileChanged(context: BuildContext, filePath: string|string[]) {
  if (liveReloadServer) {
    const files = Array.isArray(filePath) ? filePath : [filePath];

    console.log('FileChange', files);

    liveReloadServer.changed({
      body: {
        files: files.map(f => '/' + relative(context.wwwDir, f))
      }
    });
  }
}


function reload(context: BuildContext) {
  fileChanged(context, DEV_SERVER_DEFAULT_INDEX);
}


function setupEvents() {
  events.on(events.EventType.FileChange, (context: BuildContext, filePath: string) => {
    fileChanged(context, filePath);
  });
}


function getDevServerPort(context: BuildContext) {
  const port = getConfigValueDefault('--port', '-p', 'ionic_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_SERVER_DEFAULT_PORT;
}


function getDevServerHost(context: BuildContext) {
  const host = getConfigValueDefault('--host', '-h', 'ionic_host', null);
  if (host) {
    return host;
  }
}


const DEV_SERVER_DEFAULT_PORT = 8100;
const DEV_SERVER_DEFAULT_INDEX = 'index.html';
const LIVE_RELOAD_DEFAULT_PORT = 35729;
