import * as express from 'express';
import * as archiver from 'archiver';
import { BuildContext } from './util/interfaces';
import { getConfigValue } from './util/config';
import { setContext } from './util/helpers';
import { watch } from './watch';
import { createNotificationServer } from './dev-server/notification-server';
import { createWsServer } from './dev-server/ws-server';
import { findClosestOpenPorts } from './util/network';
import { Logger } from './logger/logger';
import * as events from './util/events';

const DEV_LOGGER_DEFAULT_PORT = 53703;
const WS_SERVER_DEFAULT_PORT = 40000;
const DEV_SERVER_DEFAULT_PORT = 8100;

export async function serve(context: BuildContext) {
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

  const app = express();
  app.listen(hostPortFound, host, function() {
    Logger.debug(`listening on ${hostPortFound}`);
  });
  app.use('/www', express.static(context.wwwDir));
  app.get('/app.zip', (req, res) => {
    const archive = archiver('zip');
    archive.pipe(res);
    archive.directory(context.wwwDir, 'www');
    archive.finalize();
  });


  createNotificationServer({
    buildDir: context.buildDir,
    rootDir: context.rootDir,
    wwwDir: context.wwwDir,
    notificationPort: notificationPortFound
  });

  let wsServer = createWsServer({
    port: wsServerPortFound
  });

  await watch(context);

  events.on(events.EventType.FileChange, wsServer.broadcast);

  return {
  };
}

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
