import { TsFiles } from './interfaces';

export class InMemoryFileSystem implements WebpackFileSystem {
  constructor(private originalFileSystem: WebpackFileSystem, private tsFiles: TsFiles) {
  }

  isSync() {
    return this.originalFileSystem.isSync();
  }

  stat(path: string, callback: Function): any {
    return this.originalFileSystem.stat(path, callback);
  }

  readdir(path: string, callback: Function): any {
    return this.originalFileSystem.readdir(path, callback);
  }

  readFile(path: string, callback: Function): any {
    const inMemoryFile = this.tsFiles[path];
    if (inMemoryFile) {
      callback(null, new Buffer(inMemoryFile.output));
    } else {
      return this.originalFileSystem.readFile(path, callback);
    }
  }

  readJson(path: string, callback: Function): any {
    return this.originalFileSystem.readFile(path, callback);
  }

  readLink(path: string, callback: Function): any {
    return this.originalFileSystem.readFile(path, callback);
  }

  purge(what: any): void {
    return this.originalFileSystem.purge(what);
  }
}

export interface WebpackFileSystem {
  isSync(): boolean;
  stat(path: string, callback: Function): any;
  readdir(path: string, callback: Function): any;
  readFile(path: string, callback: Function): any;
  readJson(path: string, callback: Function): any;
  readLink(path: string, callback: Function): any;
  purge(what: any): void;
};
