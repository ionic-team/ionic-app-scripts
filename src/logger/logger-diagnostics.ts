import { BuildContext, Diagnostic, PrintLine } from '../util/interfaces';
import { Logger } from './logger';
import { join, resolve , normalize} from 'path';
import { highlight, highlightError } from '../highlight/highlight';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { splitLineBreaks, titleCase } from '../util/helpers';
import * as chalk from 'chalk';


export function printDiagnostics(context: BuildContext, diagnosticsType: string, diagnostics: Diagnostic[], consoleLogDiagnostics: boolean, writeHtmlDiagnostics: boolean) {
  if (diagnostics && diagnostics.length) {

    if (consoleLogDiagnostics) {
      diagnostics.forEach(consoleLogDiagnostic);
    }

    if (writeHtmlDiagnostics) {
      const content = diagnostics.map(generateDiagnosticHtml);
      const fileName = getDiagnosticsFileName(context.buildDir, diagnosticsType);
      writeFileSync(fileName, content.join('\n'), { encoding: 'utf8' });
    }
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
    const lines = prepareLines(d.lines, 'text');

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

      if (d.language === 'javascript') {
        msg += jsConsoleSyntaxHighlight(text);
      } else if (d.language === 'scss') {
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


let diagnosticsHtmlCache: {[key: string]: any} = {};

export function clearDiagnosticsCache() {
  diagnosticsHtmlCache = {};
}

export function clearDiagnostics(context: BuildContext, type: string) {
  try {
    delete diagnosticsHtmlCache[type];
    unlinkSync(getDiagnosticsFileName(context.buildDir, type));
  } catch (e) {}
}


export function hasDiagnostics(buildDir: string) {
  loadBuildDiagnosticsHtml(buildDir);

  const keys = Object.keys(diagnosticsHtmlCache);
  for (var i = 0; i < keys.length; i++) {
    if (typeof diagnosticsHtmlCache[keys[i]] === 'string') {
      return true;
    }
  }

  return false;
}


function loadBuildDiagnosticsHtml(buildDir: string) {
  try {
    if (diagnosticsHtmlCache[DiagnosticsType.TypeScript] === undefined) {
      diagnosticsHtmlCache[DiagnosticsType.TypeScript] = readFileSync(getDiagnosticsFileName(buildDir, DiagnosticsType.TypeScript), 'utf8');
    }
  } catch (e) {
    diagnosticsHtmlCache[DiagnosticsType.TypeScript] = false;
  }

  try {
    if (diagnosticsHtmlCache[DiagnosticsType.Sass] === undefined) {
      diagnosticsHtmlCache[DiagnosticsType.Sass] = readFileSync(getDiagnosticsFileName(buildDir, DiagnosticsType.Sass), 'utf8');
    }
  } catch (e) {
    diagnosticsHtmlCache[DiagnosticsType.Sass] = false;
  }
}


export function injectDiagnosticsHtml(buildDir: string, content: any) {
  if (!hasDiagnostics(buildDir)) {
    return content;
  }

  let contentStr = content.toString();

  const c: string[] = [];
  c.push(`<div id="ion-diagnostics">`);

  // diagnostics content
  c.push(getDiagnosticsHtmlContent(buildDir));

  c.push(`</div>`); // #ion-diagnostics

  let match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  if (match) {
    contentStr = contentStr.replace(match[0], match[0] + '\n' + c.join('\n'));
  } else {
    contentStr = c.join('\n') + contentStr;
  }

  return contentStr;
}


export function getDiagnosticsHtmlContent(buildDir: string, includeDiagnosticsHtml?: string) {
  const c: string[] = [];

  // diagnostics header
  c.push(`
    <div class="ion-diagnostics-header">
      <div class="ion-diagnostics-header-inner">Error</div>
      <div class="ion-diagnostics-buttons">
        <button class="ion-diagnostic-close">Close</button>
      </div>
    </div>
  `);

  if (includeDiagnosticsHtml) {
    c.push(includeDiagnosticsHtml);
  }

  loadBuildDiagnosticsHtml(buildDir);

  const keys = Object.keys(diagnosticsHtmlCache);
  for (var i = 0; i < keys.length; i++) {
    if (typeof diagnosticsHtmlCache[keys[i]] === 'string') {
      c.push(diagnosticsHtmlCache[keys[i]]);
    }
  }

  return c.join('\n');
}


function generateDiagnosticHtml(d: Diagnostic) {
  const c: string[] = [];

  c.push(`<div class="ion-diagnostic">`);

  c.push(`<div class="ion-diagnostic-masthead" title="${escapeHtml(d.type)} error: ${escapeHtml(d.code)}">`);

  const title = `${titleCase(d.type)} ${titleCase(d.level)}`;
  c.push(`<div class="ion-diagnostic-title">${escapeHtml(title)}</div>`);

  c.push(`<div class="ion-diagnostic-message" data-error-code="${escapeHtml(d.type)}-${escapeHtml(d.code)}">${escapeHtml(d.messageText)}</div>`);

  c.push(`</div>`); // .ion-diagnostic-masthead

  c.push(generateCodeBlock(d));

  c.push(`</div>`); // .ion-diagnostic

  return c.join('\n');
}


function generateCodeBlock(d: Diagnostic) {
  const c: string[] = [];

  c.push(`<div class="ion-diagnostic-file">`);

  c.push(`<div class="ion-diagnostic-file-header" title="${escapeHtml(d.absFileName)}">${escapeHtml(d.relFileName)}</div>`);

  if (d.lines && d.lines.length) {
    c.push(`<div class="ion-diagnostic-blob">`);

    c.push(`<table class="ion-diagnostic-table">`);

    prepareLines(d.lines, 'html').forEach(l => {
      c.push(`<tr${(l.errorCharStart > -1) ? ' class="ion-diagnostic-error-line"' : ''}>`);

      c.push(`<td class="ion-diagnostic-blob-num" data-line-number="${l.lineNumber}"></td>`);

      c.push(`<td class="ion-diagnostic-blob-code">${highlightError(l.html, l.errorCharStart, l.errorLength)}</td>`);

      c.push(`</tr>`);
    });

    c.push(`</table>`);

    c.push(`</div>`); // .ion-diagnostic-blob
  }

  c.push(`</div>`); // .ion-diagnostic-file

  return c.join('\n');
}


export function generateRuntimeDiagnosticContent(rootDir: string, buildDir: string, runtimeErrorMessage: string, runtimeErrorStack: string) {
  let c: string[] = [];

  c.push(`<div class="ion-diagnostic">`);
  c.push(`<div class="ion-diagnostic-masthead">`);
  c.push(`<div class="ion-diagnostic-header">Runtime Error</div>`);

  if (runtimeErrorMessage) {
    runtimeErrorMessage = runtimeErrorMessage.replace(/inline template:\d+:\d+/g, '');
    runtimeErrorMessage = runtimeErrorMessage.replace('inline template', '');

    c.push(`<div class="ion-diagnostic-message">${escapeHtml(runtimeErrorMessage)}</div>`);
  }
  c.push(`</div>`); // .ion-diagnostic-masthead

  const diagnosticsHtmlCache = generateRuntimeStackDiagnostics(rootDir, runtimeErrorStack);
  diagnosticsHtmlCache.forEach(d => {
    c.push(generateCodeBlock(d));
  });

  if (runtimeErrorStack) {
    c.push(`<div class="ion-diagnostic-stack-header">Stack</div>`);
    c.push(`<div class="ion-diagnostic-stack">${escapeHtml(runtimeErrorStack)}</div>`);
  }

  c.push(`</div>`); // .ion-diagnostic

  return getDiagnosticsHtmlContent(buildDir, c.join('\n'));
}


export function generateRuntimeStackDiagnostics(rootDir: string, stack: string) {
  const diagnostics: Diagnostic[] = [];

  if (stack) {
    splitLineBreaks(stack).forEach(stackLine => {
      try {
        const match = WEBPACK_FILE_REGEX.exec(stackLine);
        if (!match) return;

        const fileSplit = match[1].split('?');
        if (fileSplit.length !== 2) return;

        const linesSplit = fileSplit[1].split(':');
        if (linesSplit.length !== 3) return;

        const fileName = fileSplit[0];
        if (fileName.indexOf('~') > -1) return;

        const errorLineNumber = parseInt(linesSplit[1], 10);
        const errorCharNumber = parseInt(linesSplit[2], 10);

        const d: Diagnostic = {
          level: 'error',
          language: 'typescript',
          type: 'runtime',
          header: '',
          code: 'runtime',
          messageText: '',
          absFileName: resolve(rootDir, fileName),
          relFileName: normalize(fileName),
          lines: []
        };

        const sourceText = readFileSync(d.absFileName, 'utf8');
        const srcLines = splitLineBreaks(sourceText);
        if (!srcLines.length || errorLineNumber >= srcLines.length) return;

        let htmlLines = srcLines;

        try {
          htmlLines = splitLineBreaks(highlight(d.language, sourceText, true).value);
        } catch (e) {}

        const errorLine: PrintLine = {
          lineIndex: errorLineNumber - 1,
          lineNumber: errorLineNumber,
          text: srcLines[errorLineNumber - 1],
          html: htmlLines[errorLineNumber - 1],
          errorCharStart: errorCharNumber + 1,
          errorLength: 1
        };

        if (errorLine.html.indexOf('class="hljs') === -1) {
          try {
            errorLine.html = highlight(d.language, errorLine.text, true).value;
          } catch (e) {}
        }

        d.lines.push(errorLine);

        if (errorLine.lineIndex > 0) {
          const previousLine: PrintLine = {
            lineIndex: errorLine.lineIndex - 1,
            lineNumber: errorLine.lineNumber - 1,
            text: srcLines[errorLine.lineIndex - 1],
            html: htmlLines[errorLine.lineIndex - 1],
            errorCharStart: -1,
            errorLength: -1
          };

          if (previousLine.html.indexOf('class="hljs') === -1) {
            try {
              previousLine.html = highlight(d.language, previousLine.text, true).value;
            } catch (e) {}
          }

          d.lines.unshift(previousLine);
        }

        if (errorLine.lineIndex < srcLines.length) {
          const nextLine: PrintLine = {
            lineIndex: errorLine.lineIndex + 1,
            lineNumber: errorLine.lineNumber + 1,
            text: srcLines[errorLine.lineIndex + 1],
            html: htmlLines[errorLine.lineIndex + 1],
            errorCharStart: -1,
            errorLength: -1
          };

          if (nextLine.html.indexOf('class="hljs') === -1) {
            try {
              nextLine.html = highlight(d.language, nextLine.text, true).value;
            } catch (e) {}
          }

          d.lines.push(nextLine);
        }

        diagnostics.push(d);

      } catch (e) {}
    });
  }

  return diagnostics;
};

const WEBPACK_FILE_REGEX = /\(webpack:\/\/\/(.*?)\)/;


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


function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
}


function prepareLines(orgLines: PrintLine[], code: 'text'|'html') {
  const lines: PrintLine[] = JSON.parse(JSON.stringify(orgLines));

  for (var i = 0; i < 100; i++) {
    if (!eachLineHasLeadingWhitespace(lines, code)) {
      return lines;
    }
    for (var i = 0; i < lines.length; i++) {
      (<any>lines[i])[code] = (<any>lines[i])[code].substr(1);
      lines[i].errorCharStart--;
      if (!(<any>lines[i])[code].length) {
        return lines;
      }
    }
  }

  return lines;
}


function eachLineHasLeadingWhitespace(lines: PrintLine[], code: 'text'|'html') {
  if (!lines.length) {
    return false;
  }
  for (var i = 0; i < lines.length; i++) {
    if ((<any>lines[i])[code].length < 1) {
      return false;
    }
    var firstChar = (<any>lines[i])[code].charAt(0);
    if (firstChar !== ' ' && firstChar !== '\t') {
      return false;
    }
  }
  return true;
}


const JS_KEYWORDS = [
  'abstract', 'any', 'as', 'break', 'boolean', 'case', 'catch', 'class',
  'console', 'const', 'continue', 'debugger', 'declare', 'default', 'delete',
  'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from',
  'function', 'get', 'if', 'import', 'in', 'implements', 'Infinity',
  'instanceof', 'let', 'module', 'namespace', 'NaN', 'new', 'number', 'null',
  'public', 'private', 'protected', 'require', 'return', 'static', 'set',
  'string', 'super', 'switch', 'this', 'throw', 'try', 'true', 'type',
  'typeof', 'undefined', 'var', 'void', 'with', 'while', 'yield',
];


function getDiagnosticsFileName(buildDir: string, type: string) {
  return join(buildDir, `.ion-diagnostic-${type}.html`);
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

export const DiagnosticsType = {
  TypeScript: 'typescript',
  Sass: 'sass',
  TsLint: 'tslint'
};
