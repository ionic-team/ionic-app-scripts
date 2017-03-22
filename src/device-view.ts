import * as express from 'express';
import * as archiver from 'archiver';
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';
import * as uuid from 'node-uuid';
import { debounce } from 'lodash';
import { injectNotificationScript, injectDependency } from './dev-server/injector';
import { injectDiagnosticsHtml } from './logger/logger-diagnostics';
import { BuildContext } from './util/interfaces';
import { getConfigValue } from './util/config';
import { setContext } from './util/helpers';
import { watch } from './watch';
import { createNotificationServer } from './dev-server/notification-server';
import { createWsServer } from './dev-server/ws-server';
import { findClosestOpenPorts } from './util/network';
import { Logger } from './logger/logger';
import { LOGGER_DIR } from './dev-server/serve-config';

const DEV_LOGGER_DEFAULT_PORT = 53703;
const WS_SERVER_DEFAULT_PORT = 40000;
const DEV_SERVER_DEFAULT_PORT = 8100;

export interface WSEvent {
  eventType: string;
  payload: { [key: string]: any };
}

export async function deviceView(context: BuildContext, publicIP: string) {
  setContext(context);

  const host = getHttpServerHost(context);
  const notificationPort = getNotificationPort(context);
  const wsServerPort = getWsServerPort(context);
  let hostPort = getHttpServerPort(context);

  const [
    notificationPortFound,
    wsServerPortFound,
    hostPortFound
  ] = await findClosestOpenPorts(host, [notificationPort, wsServerPort, hostPort]);

  const httpServerUrl = `http://${publicIP}:${hostPortFound}`;
  const app = express();
  app.set('serveConfig', {
    buildDir: context.buildDir,
    rootDir: context.rootDir,
    wwwDir: context.wwwDir,
    notificationPort: notificationPortFound,
    publicIP
  });
  app.listen(hostPortFound, host, function() {
    Logger.debug(`listening on ${hostPortFound}`);
  });
  app.use('/www/index.html', getHTMLFile);
  app.use('/www', express.static(context.wwwDir));
  app.get('/app.zip', getZipFile);

  createNotificationServer({
    buildDir: context.buildDir,
    rootDir: context.rootDir,
    wwwDir: context.wwwDir,
    notificationPort: notificationPortFound
  });

  let wsServer = createWsServer({
    port: wsServerPortFound
  });

  wsServer.onMessage((ws: any, {eventType, payload}: WSEvent) => {
    switch (eventType) {
    case 'request-zip':
      return ws.sendJson({
        eventType: 'zip-location',
        payload: {
          url: `${httpServerUrl}/app.zip`
        }
      });
    }
  });

  const [ dataList, fileChangedCb] = fileChanged(wsServer, context.wwwDir, httpServerUrl);
  let fileChangedDb = debounce(fileChangedCb, 1500);

  const watcher = chokidar.watch(context.wwwDir);
  watcher.on('raw', (event: string, path: string, details: any) => {
    dataList.push({
      event,
      filePath: path
    });

    fileChangedDb(dataList);
  });

  await watch(context);

  return {
    wsPort: wsServerPortFound,
    hostPort: hostPortFound
  };
}

/**
 * getZipFile - return the a zip file that contains all of www and
 * our dev code.
 */
function getZipFile(req: express.Request, res: express.Response) {
  const config: any = req.app.get('serveConfig');
  const indexFileName = path.join(config.wwwDir, 'index.html');

  getIndexFileStream(indexFileName, config, function(indexHtml: string) {
    const archive = archiver('zip');
    archive.pipe(res);
    archive.directory(path.join(config.wwwDir, 'build'), 'www/build');
    archive.directory(path.join(config.wwwDir, 'assets'), 'www/assets');
    archive.append(indexHtml, { name: 'www/index.html' });
    archive.append(fs.createReadStream(path.join(__dirname, '..', 'bin', 'ion-dev.js')), { name: `www/${LOGGER_DIR}/ion-dev.js` });
    archive.append(fs.createReadStream(path.join(__dirname, '..', 'bin', 'ion-dev.css')), { name: `www/${LOGGER_DIR}/ion-dev.css` });
    archive.append(fs.createReadStream(path.join(__dirname, '..', 'bin', 'squirrel.js')), { name: `www/${LOGGER_DIR}/squirrel.js` });
    archive.finalize();
  });
}

function getHTMLFile(req: express.Request, res: express.Response) {
  const config: any = req.app.get('serveConfig');

  const indexFileName = path.join(config.wwwDir, 'index.html');
  getIndexFileStream(indexFileName, config, function(indexHtml: string) {
    res.send(indexHtml);
  });
}

function getIndexFileStream(filePath: string, config: any, cb: Function) {

  fs.readFile(filePath, (err, indexHtml) => {
    indexHtml = injectNotificationScript(config.rootDir, indexHtml, true, config.notificationPort, config.publicIP);
    indexHtml = injectDiagnosticsHtml(config.buildDir, indexHtml);
    indexHtml = injectDependency(indexHtml, `${LOGGER_DIR}/squirrel.js`);
    cb(indexHtml);
  });
}

function fileChanged(wsServer: any, wwwDir: string, httpUrl: string): [any[], Function] {
  let data: any[] = [];
  return [data, ([]) => {

    if (!Array.isArray(data)) {
      return;
    }
    const convertedData = data
      .map(fd => {
        return path.relative(wwwDir, fd.filePath);
      })
      .filter((filePathRel: any, index: number, array: any[]) =>  {
        return array.indexOf(filePathRel) === index;
      })
      .map(filePathRel => {
        return {
          path: filePathRel,
          url: `${httpUrl}/www/${filePathRel}`
        };
      });

    const responseData = {
      receipt: uuid.v4(),
      eventType: 'files-update',
      payload: convertedData
    };
    wsServer.broadcast(responseData);

    data.splice(0, data.length);
  }];
}

/*
function responseDataHistory() {
  let history: any[] = [];

  function add(responseData: any) {
    history.push(responseData);

    if (history.length > 10) {
      history.shift();
    }
  }

  function reconcile(receipt: string): boolean | any[] {
    const foundIndex = history.findIndex(h => h.receipt === receipt);
    if (foundIndex < 0) {
      return false;
    }
    if (foundIndex === (history.length - 1)) {
      return true;
    }
    return history.slice(foundIndex).reduce((all, hist: any[]) => {
      return [...all, ...hist.payload];
    }, <any[]>[]);
  }

  return {
    add,
    reconcile
  };
}
*/


function getHttpServerPort(context: BuildContext): number {
  const port = getConfigValue(context, '--port', '-p', 'IONIC_PORT', 'ionic_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_SERVER_DEFAULT_PORT;
}

function getHttpServerHost(context: BuildContext): string {
  const host = getConfigValue(context, '--address', '-h', 'IONIC_ADDRESS', 'ionic_address', null);
  if (!host) {
    throw new Error(`http host is required for device view`);
  }
  return host;
}

function getWsServerPort(context: BuildContext): number {
  const port = getConfigValue(context, '--ws-port', null, 'IONIC_WS_PORT', 'ionic_ws_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return WS_SERVER_DEFAULT_PORT;
}

export function getNotificationPort(context: BuildContext): number {
  const port = getConfigValue(context, '--dev-logger-port', null, 'IONIC_DEV_LOGGER_PORT', 'ionic_dev_logger_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_LOGGER_DEFAULT_PORT;
}
