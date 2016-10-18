import { BuildContext } from './util/interfaces';
import { generateContext, getConfigValueDefault, hasConfigValue } from './util/config';
import { Logger } from './util/logger';
import { join } from 'path';
import { readFile } from 'fs';
import { watch } from './watch';
import * as chalk from 'chalk';
import * as http from 'http';
import * as liveReload from './util/live-reload';
import * as devLogger from './util/logger-dev-server';
import * as mime from 'mime-types';


let devServer: http.Server;


export function serve(context?: BuildContext) {
  context = generateContext(context);

  return watch(context)
    .then(() => {
      createDevServer(context);
    }, () => {
      createDevServer(context);
    });
}


export function createDevServer(context: BuildContext) {
  const port = getDevServerPort();
  const host = getDevServerHost();
  const devAddress = `http://${host || 'localhost'}:${port}/`;

  function httpServerListen() {
    devServer.listen(port, host, undefined, () => {
      Logger.info(chalk.green(`dev server running: ${devAddress}`));

      if (liveReload.useLiveReload()) {
        liveReload.createLiveReloadServer(host);
      }
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


export function devServerListener(context: BuildContext, request: http.IncomingMessage, response: http.ServerResponse) {
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

    if (devLogger.useConsoleLogger()) {
      content = devLogger.injectConsoleLogger(content);
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


function getDevServerPort() {
  const port = getConfigValueDefault('--port', '-p', 'ionic_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_SERVER_DEFAULT_PORT;
}

function getDevServerHost() {
  const host = getConfigValueDefault('--address', '-h', 'ionic_address', null);
  if (host) {
    return host;
  }
}


function isRootIndexFile(context: BuildContext, filePath: string) {
  return (filePath === context.wwwIndex);
}

function useConsoleLogs() {
  return hasConfigValue('--consolelogs', '-c', 'ionic_consolelogs', false);
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

