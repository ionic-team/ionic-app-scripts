import { readFile, writeFile } from 'fs';


export const objectAssign = (Object.assign) ? Object.assign : function (target: any, source: any) {
  const output = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    source = arguments[index];
    if (source !== undefined && source !== null) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          output[key] = source[key];
        }
      }
    }
  }

  return output;
};


export function endsWith(str: string, tail: string) {
  if (str && tail) {
    return !tail.length || str.slice(-tail.length).toLowerCase() === tail.toLowerCase();
  }
  return false;
}


export function writeFileAsync(filePath: string, content: string): Promise<any> {
  return new Promise( (resolve, reject) => {
    writeFile(filePath, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


export function readFileAsync(filePath: string): Promise<string> {
  return new Promise( (resolve, reject) => {
    readFile(filePath, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString());
      }
    });
  });
}
