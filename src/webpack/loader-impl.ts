import { normalize, resolve } from 'path';
import { changeExtension, getContext, readFileAsync} from '../util/helpers';
import { Logger } from '../logger/logger';
import { File } from '../util/interfaces';
import { FileCache } from '../util/file-cache';

export function webpackLoader(source: string, map: any, webpackContex: any) {
  webpackContex.cacheable();
  var callback = webpackContex.async();
  const context = getContext();

  const absolutePath = resolve(normalize(webpackContex.resourcePath));
  Logger.debug(`[Webpack] loader: processing the following file: ${absolutePath}`);
  const javascriptPath = changeExtension(absolutePath, '.js');
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
      try {
        sourceMapObject = JSON.parse(mapFile.content);

      } catch (ex) {
        Logger.debug(`[Webpack] loader: Attempted to parse the JSON sourcemap for ${mapFile.path} and failed -
          using the original, webpack provided source map`);
      }
      sourceMapObject.sources = [absolutePath];
      if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
        sourceMapObject.sourcesContent = [source];
      }
    }
    callback(null, javascriptFile.content, sourceMapObject);
  }).catch(err => {
    Logger.debug(`[Webpack] loader: Encountered an unexpected error: ${err.message}`);
    callback(err);
  });
}

function readFile(fileCache: FileCache, filePath: string) {
  let file = fileCache.get(filePath);
  if (file) {
    Logger.debug(`[Webpack] loader: Found ${filePath} in file cache`);
    return Promise.resolve(file);
  }
  Logger.debug(`[Webpack] loader: File ${filePath} not found in file cache - falling back to disk`);
  return readFileAsync(filePath).then((fileContent: string) => {
    Logger.debug(`[Webpack] loader: Loaded ${filePath} successfully from disk`);
    const file = { path: filePath, content: fileContent };
    fileCache.set(filePath, file);
    return file;
  }).catch(err => {
    Logger.debug(`[Webpack] loader: Failed to load ${filePath} from disk`);
    throw err;
  });
}
