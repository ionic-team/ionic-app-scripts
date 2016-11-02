import { BuildContext } from './interfaces';
import { Diagnostic, Logger, PrintLine } from './logger';
import { join } from 'path';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { LOGGER_DIR } from '../dev-server/serve-config';
import * as chalk from 'chalk';


export function printDiagnostics(context: BuildContext, type: string, diagnostics: Diagnostic[]) {
  if (diagnostics.length) {
    let content: string[] = [];
    diagnostics.forEach(d => {
      consoleLogDiagnostic(d);
      content.push(generateDiagnosticHtml(d));
    });

    const fileName = getDiagnosticsFileName(context.buildDir, type);
    writeFileSync(fileName, content.join('\n'), { encoding: 'utf8' });
  }
}


function consoleLogDiagnostic(d: Diagnostic) {
  if (d.level === 'warn') {
    Logger.warn(d.header);
  } else {
    Logger.error(d.header);
  }

  Logger.wordWrap([d.messageText]).forEach(m => {
    console.log(m);
  });
  console.log('');

  if (d.lines && d.lines.length) {
    const lines = removeWhitespaceIndent(d.lines);

    lines.forEach(l => {
      if (!isMeaningfulLine(l.text)) {
        return;
      }

      let msg = `L${l.lineNumber}:  `;
      while (msg.length < Logger.INDENT.length) {
        msg = ' ' + msg;
      }

      let text = l.text;
      if (l.errorCharStart > -1) {
        text = consoleHighlightError(text, l.errorCharStart, l.errorLength);
      }

      msg = chalk.dim(msg);

      if (d.syntax === 'js') {
        msg += jsConsoleSyntaxHighlight(text);
      } else if (d.syntax === 'css') {
        msg += cssConsoleSyntaxHighlight(text, l.errorCharStart);
      } else {
        msg += text;
      }

      console.log(msg);
    });

    console.log('');
  }
}

function consoleHighlightError(errorLine: string, errorCharStart: number, errorLength: number) {
  let rightSideChars = errorLine.length - errorCharStart + errorLength - 1;
  while (errorLine.length + Logger.INDENT.length > Logger.MAX_LEN) {
    if (errorCharStart > (errorLine.length - errorCharStart + errorLength) && errorCharStart > 5) {
      // larger on left side
      errorLine = errorLine.substr(1);
      errorCharStart--;

    } else if (rightSideChars > 1) {
      // larger on right side
      errorLine = errorLine.substr(0, errorLine.length - 1);
      rightSideChars--;

    } else {
      break;
    }
  }

  const lineChars: string[] = [];
  const lineLength = Math.max(errorLine.length, errorCharStart + errorLength);
  for (var i = 0; i < lineLength; i++) {
    var chr = errorLine.charAt(i);
    if (i >= errorCharStart && i < errorCharStart + errorLength) {
      chr = chalk.bgRed(chr === '' ? ' ' : chr);
    }
    lineChars.push(chr);
  }

  return lineChars.join('');
}


export function clearDiagnosticsHtmlSync(context: BuildContext, type: string) {
  try {
    unlinkSync(getDiagnosticsFileName(context.buildDir, type));
  } catch (e) {}
}


export function readDiagnosticsHtmlSync(buildDir: string) {
  let content = '';

  try {
    content = readFileSync(getDiagnosticsFileName(buildDir, 'typescript'), 'utf8') + '\n';
  } catch (e) {}

  try {
    content += readFileSync(getDiagnosticsFileName(buildDir, 'sass'), 'utf8');
  } catch (e) {}

  if (content.length) {
    return generateHtml('Build Error', content);
  }

  return null;
}


function generateDiagnosticHtml(d: Diagnostic) {
  const c: string[] = [];

  c.push(`<div class="diagnostic type-${d.syntax} ${d.level}-${d.type}">`);

  let header = `${d.type} ${d.level}`;
  header = header.charAt(0).toUpperCase() + header.substr(1);
  c.push(`<h2>${escapeHtml(header)}</h2>`);

  c.push(`<p data-error-code="${d.type}-${d.code}" class="message-text">${escapeHtml(d.messageText)}</p>`);

  c.push(`<div class="file">`);

  c.push(`<div class="file-header">${escapeHtml(d.relFileName)}</div>`);

  if (d.lines && d.lines.length) {
    c.push(`<div class="blob-wrapper">`);

    c.push(`<table class="tab-size">`);

    const lines = removeWhitespaceIndent(d.lines);

    lines.forEach(l => {

      let trCssClass = '';
      let lineNumberCssClass = `blob-num ${d.syntax}-line-number`;
      let code = l.text;

      if (l.errorCharStart > -1) {
        code = htmlHighlightError(code, l.errorCharStart, l.errorLength);
        trCssClass = ' class="error-line"';
      }

      code = jsHtmlSyntaxHighlight(code);

      c.push(`<tr${trCssClass}>`);

      c.push(`<td id="L${l.lineNumber}" class="${lineNumberCssClass}" data-line-number="${l.lineNumber}"></td>`);

      c.push(`<td id="LC${l.lineNumber}" class="blob-code blob-code-inner ${d.syntax}-file-line">${code}</td>`);

      c.push(`</tr>`);
    });

    c.push(`</table>`);

    c.push(`</div>`); // .blob-wrapper
  }

  c.push(`</div>`); // .file

  c.push(`</div>`); // .diagnostic

  return c.join('\n');
}


function htmlHighlightError(errorLine: string, errorCharStart: number, errorLength: number) {
  const lineChars: string[] = [];
  const lineLength = Math.max(errorLine.length, errorCharStart + errorLength);
  for (var i = 0; i < lineLength; i++) {
    var chr = errorLine.charAt(i);
    if (i >= errorCharStart && i < errorCharStart + errorLength) {
      chr = `<span class="error-chr">${chr === '' ? ' ' : chr}</span>`;
    }
    lineChars.push(chr);
  }

  return lineChars.join('');
}


const DIAGNOSTICS_CSS = `

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #fff;
  word-wrap: break-word;
  margin: 0;
  padding: 0;
}

main {
  margin: 0;
  padding: 15px;
}

h2 {
  font-size: 18px;
  margin: 0;
}

table {
  border-spacing: 0;
  border-collapse: collapse;
}

td, th {
  padding: 0;
}

.file {
  position: relative;
  margin-top: 16px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.file-header {
  padding: 5px 10px;
  background-color: #f7f7f7;
  border-bottom: 1px solid #d8d8d8;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
}

.blob-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom-right-radius: 3px;
  border-bottom-left-radius: 3px;
}

.tab-size {
  -moz-tab-size: 2;
  -o-tab-size: 2;
  tab-size: 2;
}

.diagnostic {
  margin-bottom: 40px;
}

.blob-num {
  width: 1%;
  min-width: 50px;
  padding-right: 10px;
  padding-left: 10px;
  font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
  font-size: 12px;
  line-height: 20px;
  color: rgba(0,0,0,0.3);
  text-align: right;
  white-space: nowrap;
  vertical-align: top;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  border: solid #eee;
  border-width: 0 1px 0 0;
}

.blob-num::before {
  content: attr(data-line-number);
}

.error-line .blob-num {
  background-color: #ffdddd;
  border-color: #f1c0c0;
}

.error-chr {
  position: relative;
}

.error-chr:before {
  content: "";
  position: absolute;
  z-index: -1;
  top: -3px;
  left: 0px;
  width: 8px;
  height: 20px;
  background-color: #ffdddd;
}

.blob-code {
  position: relative;
  padding-right: 10px;
  padding-left: 10px;
  line-height: 20px;
  vertical-align: top;
}

.blob-code-inner {
  overflow: visible;
  font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
  font-size: 12px;
  color: #333;
  word-wrap: normal;
  white-space: pre;
}

.blob-code-inner::before {
  content: "";
}

.js-keyword,
.css-prop {
  color: #183691;
}

.js-comment,
.sass-comment {
  color: #969896;
}

.system-info {
  font-size: 10px;
  color: #999;
}

`;


function generateHtml(title: string, content: string) {
  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="format-detection" content="telephone=no">
<meta name="msapplication-tap-highlight" content="no">
<style>
${DIAGNOSTICS_CSS}
</style>
<link rel="icon" type="image/png" href="${FAVICON}">
</head>
<body>
<main>
${content}
<pre class="system-info">
${getSystemInfo().join('\n')}
</pre>
</main>
</body>
</html>`;
}


function jsConsoleSyntaxHighlight(text: string) {
  if (text.trim().startsWith('//')) {
    return chalk.dim(text);
  }

  const words = text.split(' ').map(word => {
    if (JS_KEYWORDS.indexOf(word) > -1) {
      return chalk.cyan(word);
    }
    return word;
  });

  return words.join(' ');
}


function cssConsoleSyntaxHighlight(text: string, errorCharStart: number) {
  let cssProp = true;
  const safeChars = 'abcdefghijklmnopqrstuvwxyz-_';
  const notProp = '.#,:}@$[]/*';

  const chars: string[] = [];

  for (var i = 0; i < text.length; i++) {
    var c = text.charAt(i);

    if (c === ';' || c === '{') {
      cssProp = true;
    } else if (notProp.indexOf(c) > -1) {
      cssProp = false;
    }
    if (cssProp && safeChars.indexOf(c.toLowerCase()) > -1) {
      chars.push(chalk.cyan(c));
      continue;
    }

    chars.push(c);
  }

  return chars.join('');
}


function jsHtmlSyntaxHighlight(text: string) {
  if (text.trim().startsWith('//')) {
    return `<span class="js-comment">${text}</span>`;
  }

  const words = text.split(' ').map(word => {
    if (JS_KEYWORDS.indexOf(word) > -1) {
      return `<span class="js-keyword">${word}</span>`;
    }
    return word;
  });

  return words.join(' ');
}


function cssHtmlSyntaxHighlight(text: string, errorCharStart: number) {
  if (text.trim().startsWith('//')) {
    return `<span class="sass-comment">${text}</span>`;
  }

  let cssProp = true;
  const safeChars = 'abcdefghijklmnopqrstuvwxyz-_';
  const notProp = '.#,:}@$[]/*';

  const chars: string[] = [];

  for (var i = 0; i < text.length; i++) {
    var c = text.charAt(i);

    if (c === ';' || c === '{') {
      cssProp = true;
    } else if (notProp.indexOf(c) > -1) {
      cssProp = false;
    }
    if (cssProp && safeChars.indexOf(c.toLowerCase()) > -1) {
      chars.push(`<span class="css-prop">${c}</span>`);
      continue;
    }

    chars.push(c);
  }

  return chars.join('');
}


function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
 }



function removeWhitespaceIndent(orgLines: PrintLine[]) {
  const lines = orgLines.slice();

  for (var i = 0; i < 100; i++) {
    if (!eachLineHasLeadingWhitespace(lines)) {
      return lines;
    }
    for (var i = 0; i < lines.length; i++) {
      lines[i].text = lines[i].text.substr(1);
      lines[i].errorCharStart--;
      if (!lines[i].text.length) {
        return lines;
      }
    }
  }

  return lines;
}


function eachLineHasLeadingWhitespace(lines: PrintLine[]) {
  if (!lines.length) {
    return false;
  }
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].text.length < 1) {
      return false;
    }
    var firstChar = lines[i].text.charAt(0);
    if (firstChar !== ' ' && firstChar !== '\t') {
      return false;
    }
  }
  return true;
}



const JS_KEYWORDS = [
  'as',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
];


function getDiagnosticsFileName(buildDir: string, type: string) {
  return join(buildDir, `.ion-diagnostic-${type}.html`);
}


export function getSystemInfo() {
  const systemData: string[] = [];

  try {
    const ionicFramework = '2.0.0';
    systemData.push(`Ionic Framework: ${ionicFramework}`);
  } catch (e) {}

  return systemData;
}


function isMeaningfulLine(line: string) {
  if (line) {
    line = line.trim();
    if (line.length) {
      return (MEH_LINES.indexOf(line) < 0);
    }
  }
  return false;
}

const MEH_LINES = [';', ':', '{', '}', '(', ')', '/**', '/*', '*/', '*', '({', '})'];

const FAVICON = 'data:image/png;base64,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';
