import * as path from 'path';
import { getAppScriptsVersion, getSystemInfo } from '../util/helpers';
import { LOGGER_DIR } from './serve-config';


const LOGGER_HEADER = '<!-- Ionic Dev Server: Injected Logger Script -->';

export function injectNotificationScript(rootDir: string, content: any, notifyOnConsoleLog: boolean, notificationPort: Number, hostIP?: string): any {
  let contentStr = content.toString();
  const consoleLogScript = getDevLoggerScript(rootDir, notifyOnConsoleLog, notificationPort, hostIP);

  if (contentStr.indexOf(LOGGER_HEADER) > -1) {
    // already added script somehow
    return content;
  }

  let match = contentStr.match(/<head>(?![\s\S]*<head>)/i);
  if (!match) {
    match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${match[0]}\n${consoleLogScript}`);
  } else {
    contentStr = consoleLogScript + contentStr;
  }

  return contentStr;
}

export function injectDependency(content: Buffer, filePath: string): any {
  let contentStr = content.toString();
  const ext = path.extname(filePath);

  let scriptText = `<script src="${filePath}"></script>`;
  if (ext === '.css') {
     scriptText = `<link href="${filePath}" rel="stylesheet">`;
  }

  let match = contentStr.match(/<head>(?![\s\S]*<head>)/i);
  if (!match) {
    match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${match[0]}\n${scriptText}`);
  } else {
    contentStr = scriptText + contentStr;
  }

  return contentStr;
}

function getDevLoggerScript(rootDir: string, notifyOnConsoleLog: boolean, notificationPort: Number, hostIP?: string) {
  const appScriptsVersion = getAppScriptsVersion();
  const ionDevServer = JSON.stringify({
    sendConsoleLogs: notifyOnConsoleLog,
    wsPort: notificationPort,
    appScriptsVersion: appScriptsVersion,
    systemInfo: getSystemInfo(rootDir),
    hostIP
  });

  return `
  ${LOGGER_HEADER}
  <script>var IonicDevServerConfig=${ionDevServer};</script>
  <link href="${LOGGER_DIR}/ion-dev.css?v=${appScriptsVersion}" rel="stylesheet">
  <script src="${LOGGER_DIR}/ion-dev.js?v=${appScriptsVersion}"></script>
  `;
}
