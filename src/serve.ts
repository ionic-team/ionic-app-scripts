import { BuildContext } from './util/interfaces';
import { generateContext, getConfigValueDefault, hasConfigValue } from './util/config';
import { Logger } from './util/logger';
import { join } from 'path';
import { readFile } from 'fs';
import { watch } from './watch';
import * as chalk from 'chalk';
import * as devLogger from './dev-server/injector';
import * as http from 'http';
import * as liveReload from './dev-server/live-reload';
import * as devServer from './dev-server/dev-server';
import * as mime from 'mime-types';


let httpServer: http.Server;
let isListening: boolean = false;

export function serve(context?: BuildContext) {
  context = generateContext(context);

  createDevServer(context);

  return watch(context)
    .then(() => {
      serverReady();
    }, () => {
      serverReady();
    });
}


export function createDevServer(context: BuildContext) {
  const port = getHttpServerPort();
  const host = getHttpServerHost();

  function httpServerListen() {
    httpServer.listen(port, host, undefined, () => {
      isListening = true;
    });
  }

  if (liveReload.useLiveReload()) {
    liveReload.createLiveReloadServer(context, host);
  }

  if (devLogger.useDevLogger()) {
    devServer.createDevServer();
  }

  if (httpServer) {
    isListening = false;
    httpServer.close();
  }

  httpServer = http.createServer((request, response) => {
    httpServerListener(context, request, response);
  });

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      Logger.error(`server already in use, retrying....`);

      setTimeout(() => {
        isListening = false;
        httpServer.close();
        httpServerListen();
      }, 1500);
    }
  });

  httpServerListen();
}


function serverReady() {
  if (isListening) {
    const port = getHttpServerPort();
    const address = getHttpServerHost() || 'localhost';
    Logger.info(chalk.green(`dev server running: http://${address}:${port}/`));
  }
}


function httpServerListener(context: BuildContext, request: http.IncomingMessage, response: http.ServerResponse) {
  if (devLogger.isDevLoggerUrl(request, response)) {
    return;
  }

  let filePath = '.' + request.url.split('?')[0];
  if (filePath === './') {
    filePath = './index.html';
  }
  filePath = join(context.wwwDir, filePath);

  readFile(filePath, (err, content) => {
    if (err) {
      // gahh!
      responseError(err, filePath, request, response);

    } else {
      // 200!! found the file, let's send back dat data
      responseSuccess(context, filePath, content, response);
    }
  });
}


function responseSuccess(context: BuildContext, filePath: string, content: Buffer, response: http.ServerResponse) {
  const headers = {
    'Content-Type': mime.lookup(filePath) || 'application/octet-stream',
    'X-DEV-FILE-PATH': filePath
  };
  response.writeHead(200, headers);

  if (isRootIndexFile(context, filePath)) {
    if (liveReload.useLiveReload()) {
      content = liveReload.injectLiveReloadScript(content);
    }

    if (devLogger.useDevLogger()) {
      content = devLogger.injectDevLoggerScript(content);
    }
  }

  response.end(content, mime.charset(headers['Content-Type']));
}


function responseError(err: NodeJS.ErrnoException, filePath: string, request: http.IncomingMessage, response: http.ServerResponse) {
  if (err.code === 'ENOENT') {
    // dev file not found!
    response404(filePath, request, response);

  } else {
    // derp, 500?!!
    Logger.error(`http server error: ${err}`);
    response.writeHead(500, { 'Content-Type': 'text/html' });
    response.end(`Sorry, check with the site admin for error: ${err.code} ..\n`);
  }
}


function response404(filePath: string, request: http.IncomingMessage, response: http.ServerResponse) {
  if (filePath.indexOf('/cordova.js') > -1) {
    // mock the cordova.js file during dev
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end('// mock cordova file during development');
    return;
  }

  // 404!!!
  response.writeHead(404, { 'Content-Type': 'text/html' });
  response.end(`File not found: ${request.url}<br>Local file: ${filePath}`);
}


function getHttpServerPort() {
  const port = getConfigValueDefault('--port', '-p', 'ionic_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_SERVER_DEFAULT_PORT;
}

function getHttpServerHost() {
  const host = getConfigValueDefault('--address', '-h', 'ionic_address', null);
  if (host) {
    return host;
  }
}


function isRootIndexFile(context: BuildContext, filePath: string) {
  return (filePath === context.wwwIndex);
}

function useServerLogs() {
  return hasConfigValue('--serverlogs', '-s', 'ionic_serverlogs', false);
}

function launchBrowser() {
  return !hasConfigValue('--nobrowser', '-b', 'ionic_launch_browser', false);
}

function browserToLaunch() {
  return getConfigValueDefault('--browser', '-w', 'ionic_browser', null);
}

function browserOption() {
  return getConfigValueDefault('--browseroption', '-o', 'ionic_browseroption', null);
}

function launchLab() {
  return hasConfigValue('--lab', '-l', 'ionic_lab', false);
}


const DEV_SERVER_DEFAULT_PORT = 8100;

