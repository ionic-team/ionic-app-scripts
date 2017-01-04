import { FileCache } from '../util/file-cache';
import { Logger } from '../logger/logger';
import { getInstance } from '../util/hybrid-file-system-factory';
import { WatchMemorySystem } from './watch-memory-system';

export class IonicEnvironmentPlugin {
  constructor(private fileCache: FileCache) {
  }

  apply(compiler: any) {
    compiler.plugin('environment', (otherCompiler: any, callback: Function) => {
      Logger.debug('[IonicEnvironmentPlugin] apply: creating environment plugin');
      const hybridFileSystem = getInstance();
      hybridFileSystem.setFileSystem(compiler.inputFileSystem);
      compiler.inputFileSystem = hybridFileSystem;
      compiler.watchFileSystem = new WatchMemorySystem(this.fileCache);

      // do a bunch of webpack specific stuff here, so cast to an any
      // populate the content of the file system with any virtual files
      // inspired by populateWebpackResolver method in Angular's webpack plugin
      const webpackFileSystem: any = hybridFileSystem;
      const fileStatsDictionary = hybridFileSystem.getAllFileStats();
      const dirStatsDictionary = hybridFileSystem.getAllDirStats();

      this.initializeWebpackFileSystemCaches(webpackFileSystem);

      for (const filePath of Object.keys(fileStatsDictionary)) {
        const stats =  fileStatsDictionary[filePath];
        webpackFileSystem._statStorage.data[filePath] = [null, stats];
        webpackFileSystem._readFileStorage.data[filePath] = [null, stats.content];
      }

      for (const dirPath of Object.keys(dirStatsDictionary)) {
        const stats = dirStatsDictionary[dirPath];
        const fileNames = hybridFileSystem.getFileNamesInDirectory(dirPath);
        const dirNames = hybridFileSystem.getSubDirs(dirPath);
        webpackFileSystem._statStorage.data[dirPath] = [null, stats];
        webpackFileSystem._readdirStorage.data[dirPath] = [null, fileNames.concat(dirNames)];
      }

    });
  }

  private initializeWebpackFileSystemCaches(webpackFileSystem: any) {
    if (!webpackFileSystem._statStorage) {
      webpackFileSystem._statStorage = { };
    }
    if (!webpackFileSystem._statStorage.data) {
      webpackFileSystem._statStorage.data = [];
    }

    if (!webpackFileSystem._readFileStorage) {
      webpackFileSystem._readFileStorage = { };
    }
    if (!webpackFileSystem._readFileStorage.data) {
      webpackFileSystem._readFileStorage.data = [];
    }

    if (!webpackFileSystem._readdirStorage) {
      webpackFileSystem._readdirStorage = { };
    }
    if (!webpackFileSystem._readdirStorage.data) {
      webpackFileSystem._readdirStorage.data = [];
    }
  }
}
