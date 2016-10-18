

function getConsoleLoggerScript() {
  return `
  <!-- Ionic Dev Server: Injected Logger Script -->
  <script ${LOGGER_ID}>
    console.log('dev logger enabled');
  </script>
  `;
}


export function injectConsoleLogger(content: any): any {
  let contentStr = content.toString();

  if (contentStr.indexOf(LOGGER_ID) > -1) {
    // already added script somehow
    return content;
  }

  let match = contentStr.match(/<head>(?![\s\S]*<head>)/i);
  if (!match) {
    match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${match[0]}\n${getConsoleLoggerScript()}`);
  } else {
    contentStr = getConsoleLoggerScript() + contentStr;
  }

  return contentStr;
}


export function useConsoleLogger() {
  return true;
}


const LOGGER_ID = 'id="ion-dev-logger"';
