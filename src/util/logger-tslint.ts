import { BuildContext } from './interfaces';
import { Logger, PrintLine } from './logger';


export function printFailures(context: BuildContext, failures: RuleFailure[]) {
  if (failures) {
    failures.forEach(failure => {
      printFailure(context, failure);
    });
  }
}


function printFailure(context: BuildContext, f: RuleFailure) {
  const start: RuleFailurePosition = f.startPosition.toJson();
  const end: RuleFailurePosition = f.endPosition.toJson();

  let header = Logger.formatHeader('tslint', f.fileName, context.rootDir, start.line + 1, end.line + 1);

  Logger.warn(header);

  Logger.wordWrap(f.failure).forEach(m => {
    console.log(m);
  });

  Logger.newLine();

  if (f.sourceFile && f.sourceFile.text) {
    printCodeHighlight(f, f.sourceFile.text, start, end);
  }
}


function printCodeHighlight(f: RuleFailure, sourceText: string, start: RuleFailurePosition, end: RuleFailurePosition) {
  const srcLines: string[] = sourceText.replace(/\\r/g, '\n').split('\n');

  const errorLines: PrintLine[] = [];
  for (var i = start.line; i <= end.line; i++) {
    if (srcLines[i].trim().length) {
      errorLines.push({
        lineNumber: i + 1,
        text: srcLines[i]
      });
    }
  }

  if (!errorLines.length) {
    return;
  }

  if (errorLines.length === 1) {
    let errorCharStart = start.character;
    let errorCharLength = 0;
    for (var i = errorCharStart; i < errorLines[0].text.length; i++) {
      var lineChar = errorLines[0].text.charAt(i);
      if (STOP_CHARS.indexOf(lineChar) > -1) {
        break;
      }
      errorCharLength++;
    }

    errorLines[0].text = Logger.highlightError(errorLines[0].text, errorCharStart, errorCharLength);
  }

  if (start.line > 0 && Logger.meaningfulLine(srcLines[start.line - 1])) {
    const beforeLine = {
      lineNumber: start.line,
      text: srcLines[start.line - 1]
    };
    if (Logger.LEFT_PADDING.length + beforeLine.text.length > Logger.MAX_LEN) {
      beforeLine.text = beforeLine.text.substr(0, Logger.MAX_LEN - Logger.LEFT_PADDING.length - 1);
    }
    errorLines.unshift(beforeLine);
  }

  if (end.line < srcLines.length && Logger.meaningfulLine(srcLines[end.line + 1])) {
    const afterLine = {
      lineNumber: end.line + 2,
      text: srcLines[end.line + 1]
    };
    if (Logger.LEFT_PADDING.length + afterLine.text.length > Logger.MAX_LEN) {
      afterLine.text = afterLine.text.substr(0, Logger.MAX_LEN - Logger.LEFT_PADDING.length - 1);
    }
    errorLines.push(afterLine);
  }

  Logger.printErrorLines(errorLines);
}


const STOP_CHARS = [' ', '=', ',', '.', '\t', '{', '}', '(', ')', '"', '\'', '`', '?', ':', ';', '+', '-', '*', '/', '<', '>', '&', '[', ']', '|'];


export interface RuleFailure {
  sourceFile: any;
  failure: string;
  ruleName: string;
  fix: any;
  fileName: string;
  startPosition: any;
  endPosition: any;
}

export interface RuleFailurePosition {
  character: number;
  line: number;
  position: number;
}
