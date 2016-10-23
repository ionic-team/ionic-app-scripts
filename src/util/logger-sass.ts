import { BuildContext } from './interfaces';
import { Diagnostic, Logger, PrintLine } from './logger';
import { objectAssign } from './helpers';
import { SassError } from 'node-sass';
import { readFileSync } from 'fs';


export function runDiagnostics(context: BuildContext, sassError: SassError) {
  const d = loadDiagnostic(context, sassError);

  if (d) {
    Logger.printDiagnostic(objectAssign({}, d));
    return true;
  }

  return false;
}


function loadDiagnostic(context: BuildContext, sassError: SassError) {
  if (!sassError) {
    return null;
  }

  const d: Diagnostic = {
    level: 'error',
    syntax: 'css',
    type: 'sass',
    header: 'sass error',
    code: sassError.status && sassError.status.toString(),
    fileName: null,
    messageText: sassError.message,
    lines: []
  };

  if (sassError.file) {
    d.fileName = Logger.formatFileName(context.rootDir, sassError.file);
    d.header = Logger.formatHeader('sass', sassError.file, context.rootDir, sassError.line);

    if (sassError.line > -1) {
      try {
        const srcLines = readFileSync(sassError.file, 'utf8').replace(/\\r/g, '\n').split('\n');

        const errorLine: PrintLine = {
          lineIndex: sassError.line - 1,
          lineNumber: sassError.line,
          text: srcLines[sassError.line - 1],
          errorCharStart: sassError.column,
          errorLength: 0
        };

        for (var i = errorLine.errorCharStart; i >= 0; i--) {
          if (STOP_CHARS.indexOf(errorLine.text.charAt(i)) > -1) {
            break;
          }
          errorLine.errorCharStart = i;
        }

        for (var i = errorLine.errorCharStart; i <= errorLine.text.length; i++) {
          if (STOP_CHARS.indexOf(errorLine.text.charAt(i)) > -1) {
            break;
          }
          errorLine.errorLength++;
        }

        if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
          errorLine.errorLength = 1;
          errorLine.errorCharStart--;
        }

        d.lines.push(errorLine);

        if (errorLine.lineIndex > 0 && Logger.meaningfulLine(srcLines[errorLine.lineIndex - 1])) {
          const previousLine: PrintLine = {
            lineIndex: errorLine.lineIndex - 1,
            lineNumber: errorLine.lineNumber - 1,
            text: srcLines[errorLine.lineIndex - 1],
            errorCharStart: -1,
            errorLength: -1
          };
          d.lines.unshift(previousLine);
        }

        if (errorLine.lineIndex + 1 < srcLines.length && Logger.meaningfulLine(srcLines[errorLine.lineIndex + 1])) {
          const nextLine: PrintLine = {
            lineIndex: errorLine.lineIndex + 1,
            lineNumber: errorLine.lineNumber + 1,
            text: srcLines[errorLine.lineIndex + 1],
            errorCharStart: -1,
            errorLength: -1
          };
          d.lines.push(nextLine);
        }

      } catch (e) {
        Logger.debug(`sass loadDiagnostic, ${e}`);
      }
    }

  }

  return d;
}

const STOP_CHARS = ['', '\n', '\r', '\t', ' ', ':', ';', ',', '{', '}', '.', '#', '@', '!', '[', ']', '(', ')', '&', '+', '~', '^', '*', '$'];
