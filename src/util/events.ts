import { EventEmitter } from 'events';


const emmitter = new EventEmitter();


export function on(eventType: string, listener: {(data?: any): void}) {
  return emmitter.on(eventType, listener);
}


export function emit(eventType: string, val?: any) {
  return emmitter.emit(eventType, val);
}


export const EventType = {
  BuildFinished: 'BuildFinished',
  SassFinished: 'SassFinished',
  BundleFinished: 'BundleFinished',
  FileChange: 'FileChange',
  FileAdd: 'FileAdd',
  FileDelete: 'FileDelete',
  DirectoryAdd: 'DirectoryAdd',
  DirectoryDelete: 'DirectoryDelete',
  TaskEvent: 'TaskEvent',
  UpdatedDiagnostics: 'UpdatedDiagnostics'
};
