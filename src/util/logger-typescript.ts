import { BuildContext } from './interfaces';
import { Logger, PrintLine } from './logger';
import * as ts from 'typescript';


/**
 * Ok, so formatting overkill, we know. But whatever, it makes for great
 * error reporting within a terminal. So, yeah, let's code it up, shall we?
 */

export function runDiagnostics(context: BuildContext, program: ts.Program) {
  const diagnostics = program.getSyntacticDiagnostics()
                        .concat(program.getSemanticDiagnostics())
                        .concat(program.getOptionsDiagnostics());

  diagnostics.forEach(d => {
    printDiagnostic(context, d);
  });

  // returns true if there were diagnostics
  return (diagnostics.length > 0);
}


export function printDiagnostic(context: BuildContext, d: ts.Diagnostic) {
  let header = 'error';

  if (d.file) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start);
    header = Logger.formatHeader('typescript', d.file.fileName, context.rootDir, line + 1);
  }

  Logger.error(`${header}`);

  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  Logger.wordWrap(message).forEach(m => {
    console.log(m);
  });

  Logger.newLine();

  if (d.file) {
    printCodeHighlight(d);
  }
}


function printCodeHighlight(d: ts.Diagnostic) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  const srcLines = d.file.getText().replace(/\\r/g, '\n').split('\n');

  const errorLine: PrintLine = {
    lineNumber: line + 1,
    text: srcLines[line]
  };

  if (!errorLine.text || !errorLine.text.trim().length) {
    return;
  }

  const printLines: PrintLine[] = [];

  if (line > 0 && Logger.meaningfulLine(srcLines[line - 1])) {
    const beforeLine: PrintLine = {
      lineNumber: line,
      text: srcLines[line - 1]
    };
    if (Logger.LEFT_PADDING.length + beforeLine.text.length > Logger.MAX_LEN) {
      beforeLine.text = beforeLine.text.substr(0, Logger.MAX_LEN - Logger.LEFT_PADDING.length - 1);
    }
    printLines.push(beforeLine);
  }

  errorLine.text = Logger.highlightError(errorLine.text, character, d.length);
  printLines.push(errorLine);

  if (line + 1 < srcLines.length && Logger.meaningfulLine(srcLines[line + 1])) {
    const afterLine: PrintLine = {
      lineNumber: line + 2,
      text: srcLines[line + 1]
    };
    if (Logger.LEFT_PADDING.length + afterLine.text.length > Logger.MAX_LEN) {
      afterLine.text = afterLine.text.substr(0, Logger.MAX_LEN - Logger.LEFT_PADDING.length - 1);
    }
    printLines.push(afterLine);
  }

  Logger.printErrorLines(printLines);
}
