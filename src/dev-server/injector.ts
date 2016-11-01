import { BuildContext } from '../util/interfaces';
import { join } from 'path';
import { readFile } from 'fs';
import { sendClientConsoleLogs, getWsPort } from './dev-server';
import * as http from 'http';
import * as mime from 'mime-types';


function getConsoleLoggerScript(context: BuildContext) {
  const ionDevServer = JSON.stringify({
    sendConsoleLogs: sendClientConsoleLogs(context),
    wsPort: getWsPort(context)
  });

  return `
  ${LOGGER_HEADER}
  <script>var IonicDevServerConfig=${ionDevServer};</script>
  <link href="${LOGGER_DIR}/ion-dev.css" rel="stylesheet">
  <script src="${LOGGER_DIR}/ion-dev.js"></script>
  `;
}


export function injectDevLoggerScript(context: BuildContext, content: any): any {
  let contentStr = content.toString();

  if (contentStr.indexOf(LOGGER_HEADER) > -1) {
    // already added script somehow
    return content;
  }

  let match = contentStr.match(/<head>(?![\s\S]*<head>)/i);
  if (!match) {
    match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${match[0]}\n${getConsoleLoggerScript(context)}`);
  } else {
    contentStr = getConsoleLoggerScript(context) + contentStr;
  }

  return contentStr;
}


export function isDevLoggerUrl(request: http.IncomingMessage, response: http.ServerResponse) {
  if (request.url.indexOf(LOGGER_DIR) > -1) {
    responseDevLogger(request, response);
    return true;
  }
  return false;
}


function responseDevLogger(request: http.IncomingMessage, response: http.ServerResponse) {
  const urlParts = request.url.split('?')[0].split('/');
  const fileName = urlParts[urlParts.length - 1];
  const filePath = join(__dirname, '..', '..', 'bin', fileName);

  readFile(filePath, (err, content) => {
    if (err) {
      // gahh!
      response.writeHead(404, { 'Content-Type': 'text/html' });
      response.end(`File not found: ${request.url}<br>Local file: ${filePath}`);

    } else {
      const headers = {
        'Content-Type': mime.lookup(filePath) || 'application/octet-stream'
      };
      response.writeHead(200, headers);
      response.end(content, mime.charset(headers['Content-Type']));
    }
  });
}


export function useDevLogger() {
  return true;
}


const LOGGER_HEADER = '<!-- Ionic Dev Server: Injected Logger Script -->';
const LOGGER_DIR = '__ion-dev-server';
