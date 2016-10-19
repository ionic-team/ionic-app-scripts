// Ionic Dev Server: Server Side Logger

import { BuildContext } from '../util/interfaces';
import { on, EventType, TaskEvent } from '../util/events';
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

    on(EventType.TaskEvent, (context: BuildContext, val: any) => {
      sendTaskEventToClient(ws, val);
    });

  });

}


function sendTaskEventToClient(ws: any, taskEvent: TaskEvent) {
  try {
    const msg: WsMessage = {
      category: 'taskEvent',
      type: taskEvent.scope,
      data: taskEvent
    };
    ws.send(JSON.stringify(msg));

  } catch (e) {
    Logger.error(`error sending client message: ${e}`);
  }
}


function printClientMessage(msg: WsMessage) {
  if (msg.data) {
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


function printConsole(msg: WsMessage) {
  const args = msg.data;
  args[0] = `console.${msg.type}: ${args[0]}`;

  switch (msg.type) {
    case 'error':
      Logger.error.apply(this, args);
      break;

    case 'warn':
      Logger.warn.apply(this, args);
      break;

    case 'debug':
      Logger.debug.apply(this, args);
      break;

    default:
      Logger.info.apply(this, args);
      break;
  }
}


function printException(msg: WsMessage) {

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


export interface WsMessage {
  category: string;
  type: string;
  data: any;
}
