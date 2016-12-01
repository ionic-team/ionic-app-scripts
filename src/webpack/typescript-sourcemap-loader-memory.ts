import { normalize, resolve } from 'path';
import { changeExtension, getContext, readFileAsync} from '../util/helpers';
import { File } from '../util/interfaces';
import { FileCache } from '../util/file-cache';

module.exports = function typescriptSourcemapLoaderMemory(source: string, map: any) {
  this.cacheable();
  var callback = this.async();
  const context = getContext();


  const absolutePath = resolve(normalize(this.resourcePath));
  const javascriptPath = changeExtension(this.resourcePath, '.js');
  const sourceMapPath = javascriptPath + '.map';

  let javascriptFile: File = null;
  let mapFile: File = null;

  const promises: Promise<File>[] = [];
  let readJavascriptFilePromise = readFile(context.fileCache, javascriptPath);
  promises.push(readJavascriptFilePromise);
  readJavascriptFilePromise.then(file => {
    javascriptFile = file;
  });
  let readJavascriptMapFilePromise = readFile(context.fileCache, sourceMapPath);
  promises.push(readJavascriptMapFilePromise);
  readJavascriptMapFilePromise.then(file => {
    mapFile = file;
  });

  Promise.all(promises).then(() => {
    let sourceMapObject = map;
    if (mapFile) {
      sourceMapObject = JSON.parse(mapFile.content);
      sourceMapObject.sources = [absolutePath];
      if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
        sourceMapObject.sourcesContent = [source];
      }
    }
    callback(null, javascriptFile.content, sourceMapObject);
  });
};

function readFile(fileCache: FileCache, filePath: string) {
  let file = fileCache.get(filePath);
  if (file) {
    return Promise.resolve(file);
  }
  return readFileAsync(filePath).then((fileContent: string) => {
    const file = { path: filePath, content: fileContent}
    fileCache.set(filePath, file);
    return file;
  }).catch(err => {
    return null;
  });
}