import * as ws from 'ws';

export interface WSOptions {
  port: Number;
}

export interface WsMessage {
  type: string;
  msg: { [key: string]: any };
}

export function createWsServer({ port }: WSOptions) {
  const wss = new ws.Server({
    port: port
  });
  let subscribers: Function[] = [];

  wss.broadcast = function broadcast(data: any): void {
    const msg = JSON.stringify(data);

    wss.clients.forEach(function each(client: any) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  };

  wss.on('connection', (ws: any) => {
    ws.on('message', (data: string) => {
      subscribers.forEach(fn => {
        fn(ws, data);
      });
    });
  });

  return {
    broadcast: wss.broadcast,
    onMessage: (fn: Function) => {
      subscribers.push(fn);
    }
  };
}
