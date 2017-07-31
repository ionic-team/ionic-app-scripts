import { basename, dirname, join } from 'path';
import { FileSystem, VirtualFileSystem } from './interfaces';
import { FileCache } from './file-cache';
import { VirtualDirStats, VirtualFileStats } from './virtual-file-utils';

export class HybridFileSystem implements FileSystem, VirtualFileSystem {

  private filesStats: { [filePath: string]: VirtualFileStats } = {};
  private directoryStats: { [filePath: string]: VirtualDirStats } = {};
  private inputFileSystem: FileSystem;
  private outputFileSystem: FileSystem;
  private writeToDisk: boolean;

  constructor(private fileCache: FileCache) {
  }

  setInputFileSystem(fs: FileSystem) {
    this.inputFileSystem = fs;
  }

  setOutputFileSystem(fs: FileSystem) {
    this.outputFileSystem = fs;
  }

  setWriteToDisk(write: boolean) {
    this.writeToDisk = write;
  }

  isSync() {
    return this.inputFileSystem.isSync();
  }

  stat(path: string, callback: Function): any {
    // first check the fileStats
    const fileStat = this.filesStats[path];
    if (fileStat) {
      return callback(null, fileStat);
    }
    // then check the directory stats
    const directoryStat = this.directoryStats[path];
    if (directoryStat) {
      return callback(null, directoryStat);
    }
    // fallback to list
    return this.inputFileSystem.stat(path, callback);
  }

  readdir(path: string, callback: Function): any {
    return this.inputFileSystem.readdir(path, callback);
  }

  readJson(path: string, callback: Function): any {
    return this.inputFileSystem.readJson(path, callback);
  }

  readlink(path: string, callback: Function): any {
    return this.inputFileSystem.readlink(path, (err: Error, response: any) => {
      callback(err, response);
    });
  }

  purge(pathsToPurge: string[]): void {
    if (this.fileCache) {
      for (const path of pathsToPurge) {
        this.fileCache.remove(path);
      }
    }
  }

  readFile(path: string, callback: Function): any {
    const file = this.fileCache.get(path);
    if (file) {
      callback(null, new Buffer(file.content));
      return;
    }
    return this.inputFileSystem.readFile(path, callback);
  }

  addVirtualFile(filePath: string, fileContent: string) {
    this.fileCache.set(filePath, { path: filePath, content: fileContent });
    const fileStats = new VirtualFileStats(filePath, fileContent);
    this.filesStats[filePath] = fileStats;
    const directoryPath = dirname(filePath);
    const directoryStats = new VirtualDirStats(directoryPath);
    this.directoryStats[directoryPath] = directoryStats;
  }

  getFileContent(filePath: string) {
    const file = this.fileCache.get(filePath);
    if (file) {
      return file.content;
    }
    return null;
  }

  getDirectoryStats(path: string): VirtualDirStats {
    return this.directoryStats[path];
  }

  getSubDirs(directoryPath: string): string[] {
    return Object.keys(this.directoryStats)
      .filter(filePath => dirname(filePath) === directoryPath)
      .map(filePath => basename(directoryPath));
  }

  getFileNamesInDirectory(directoryPath: string): string[] {
    return Object.keys(this.filesStats).filter(filePath => dirname(filePath) === directoryPath).map(filePath => basename(filePath));
  }

  getAllFileStats(): { [filePath: string]: VirtualFileStats } {
    return this.filesStats;
  }

  getAllDirStats():  { [filePath: string]: VirtualDirStats } {
    return this.directoryStats;
  }

  mkdirp(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.mkdirp(filePath, callback);
    }
    callback();
  }

  mkdir(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.mkdir(filePath, callback);
    }
    callback();
  }

  rmdir(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.rmdir(filePath, callback);
    }
    callback();
  }

  unlink(filePath: string, callback: Function) {
    if (this.writeToDisk) {
      return this.outputFileSystem.unlink(filePath, callback);
    }
    callback();
  }

  join(dirPath: string, fileName: string) {
    return join(dirPath, fileName);
  }

  writeFile(filePath: string, fileContent: Buffer, callback: Function) {
    const stringContent = fileContent.toString();
    this.addVirtualFile(filePath, stringContent);
    if (this.writeToDisk) {
      return this.outputFileSystem.writeFile(filePath, fileContent, callback);
    }
    callback();
  }
}
