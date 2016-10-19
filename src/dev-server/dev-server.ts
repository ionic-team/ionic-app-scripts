// Ionic Dev Server: Server Side Logger
import { getConfigValueDefault, hasConfigValue } from '../util/config';
import { Logger } from '../util/logger';
import { Server as WebSocketServer } from 'ws';


let wss: any;

export function createWebSocketServer() {
  wss = new WebSocketServer({ port: getWsPort() });

  wss.on('connection', (ws: any) => {

    ws.on('message', (incomingMessage: string) => {
      // incoming message from the client
      try {
        printClientMessage(JSON.parse(incomingMessage));
      } catch (e) {
        Logger.error(`error opening ws message: ${incomingMessage}`);
      }
    });

    // ws.send('something');
  });

}


function printClientMessage(msg: DevClientMessage) {
  if (msg.args.length) {
    switch (msg.category) {
      case 'console':
        printConsole(msg);
        break;

      case 'exception':
        printException(msg);
        break;
    }
  }
}


function printConsole(msg: DevClientMessage) {
  msg.args[0] = `console.${msg.type}: ${msg.args[0]}`;

  switch (msg.type) {
    case 'error':
      Logger.error.apply(this, msg.args);
      break;

    case 'warn':
      Logger.warn.apply(this, msg.args);
      break;

    case 'debug':
      Logger.debug.apply(this, msg.args);
      break;

    default:
      Logger.info.apply(this, msg.args);
      break;
  }
}


function printException(msg: DevClientMessage) {

}


export function sendClientConsoleLogs() {
  return hasConfigValue('--consolelogs', '-c', 'ionic_consolelogs', false);
}


export function getWsPort() {
  const port = getConfigValueDefault('--dev-logger-port', null, 'ionic_dev_logger_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_LOGGER_DEFAULT_PORT;
}


const DEV_LOGGER_DEFAULT_PORT = 53703;


export interface DevClientMessage {
  category: string;
  type: string;
  args: string[];
  timestamp: number;
}
