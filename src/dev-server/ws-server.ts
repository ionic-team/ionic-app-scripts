import * as ws from 'ws';

export interface WSOptions {
  port: number;
}

export function createWsServer({ port }: WSOptions) {
  const wss = ws.createServer({ port });
  let subscribers: Function[] = [];

  const broadcast = (data: any): void => {

    wss.clients.forEach((client: any) => {
      if (client.readyState === ws.OPEN) {
        client.sendJson(data);
      }
    });
  };

  const onMessage = (fn: Function): void => {
    subscribers.push(fn);
  };

  wss.on('connection', (client: any) => {
    client.sendJson = (sendJson: any) => {
      return client.send(JSON.stringify(sendJson));
    };

    client.on('message', (data: string) => {
      const parsedData = JSON.parse(data);

      subscribers.forEach(fn => {
        fn(client, parsedData);
      });
    });
  });

  return {
    broadcast,
    onMessage
  };
}
