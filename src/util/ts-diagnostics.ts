import { BuildContext } from './interfaces';
import { Logger } from './logger';
import * as chalk from 'chalk';
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
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');

  if (d.file) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start);
    let filename = d.file.fileName.replace(context.rootDir, '');
    if (/\/|\\/.test(filename.charAt(0))) {
      filename = filename.substr(1);
    }
    if (filename.length > 80) {
      filename = '...' + filename.substr(filename.length - 80);
    }
    header = `typescript: ${filename}, line: ${line + 1}`;
  }

  Logger.error(`${header}`);

  let msgWords = message.replace(/\s/gm, ' ').split(' ');
  let msgLine = '';
  msgWords.filter(m => m.length).forEach(m => {
    msgLine += m + ' ';
    if ((LEFT_PADDING.length + msgLine.length) > MAX_LEN) {
      console.log(LEFT_PADDING + msgLine);
      msgLine = '';
    }
  });
  if (msgLine.length) {
    console.log(LEFT_PADDING + msgLine);
  }

  console.log(''); // just for an empty line

  if (d.file) {
    printCodeHighlight(d);
  }
}


function printCodeHighlight(d: ts.Diagnostic) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  const srcLines = d.file.getText().replace(/\\r/g, '\n').split('\n');

  const errorLine = {
    lineNumber: line + 1,
    text: srcLines[line]
  };

  if (!errorLine.text || !errorLine.text.trim().length) {
    return;
  }

  const printLines: PrintLine[] = [];

  if (line > 0 && meaningfulLine(srcLines[line - 1])) {
    const beforeLine = {
      lineNumber: line,
      text: srcLines[line - 1]
    };
    if (LEFT_PADDING.length + beforeLine.text.length > MAX_LEN) {
      beforeLine.text = beforeLine.text.substr(0, MAX_LEN - LEFT_PADDING.length - 1);
    }
    printLines.push(beforeLine);
  }

  let errorCharStart = character;
  let rightSideChars = errorLine.text.length - errorCharStart + d.length - 1;
  while (errorLine.text.length + LEFT_PADDING.length > MAX_LEN) {
    if (errorCharStart > (errorLine.text.length - errorCharStart + d.length) && errorCharStart > 5) {
      // larger on left side
      errorLine.text = errorLine.text.substr(1);
      errorCharStart--;

    } else if (rightSideChars > 1) {
      // larger on right side
      errorLine.text = errorLine.text.substr(0, errorLine.text.length - 1);
      rightSideChars--;

    } else {
      break;
    }
  }

  const lineChars = errorLine.text.split('');
  for (var i = 0; i < lineChars.length; i++) {
    if (i >= errorCharStart && i < errorCharStart + d.length) {
      lineChars[i] = chalk.bgRed(lineChars[i]);
    }
  }
  errorLine.text = lineChars.join('');
  printLines.push(errorLine);

  if (line + 1 < srcLines.length && meaningfulLine(srcLines[line + 1])) {
    const afterLine = {
      lineNumber: line + 2,
      text: srcLines[line + 1]
    };
    if (LEFT_PADDING.length + afterLine.text.length > MAX_LEN) {
      afterLine.text = afterLine.text.substr(0, MAX_LEN - LEFT_PADDING.length - 1);
    }
    printLines.push(afterLine);
  }

  removeWhitespaceIndent(printLines);

  printLines.forEach(l => {
    let msg = 'L' + l.lineNumber + ':  ';
    while (msg.length < LEFT_PADDING.length) {
      msg = ' ' + msg;
    }
    msg = chalk.dim(msg) + l.text;
    console.log(msg);
  });

  console.log(''); // just for an empty line
}


function meaningfulLine(line: string) {
  if (line) {
    line = line.trim();
    if (line.length) {
      return (MEH_LINES.indexOf(line) < 0);
    }
  }
  return false;
}
const MEH_LINES = [';', ':', '{', '}', '(', ')', '/**', '/*', '*/', '*', '({', '})'];


function removeWhitespaceIndent(lines: PrintLine[]) {
  for (var i = 0; i < 100; i++) {
    if (!eachLineHasLeadingWhitespace(lines)) {
      return;
    }
    for (var i = 0; i < lines.length; i++) {
      lines[i].text = lines[i].text.substr(1);
      if (!lines[i].text.length) {
        return;
      }
    }
  }
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

interface PrintLine {
  lineNumber: number;
  text: string;
}

const LEFT_PADDING = '            ';
const MAX_LEN = 100;
