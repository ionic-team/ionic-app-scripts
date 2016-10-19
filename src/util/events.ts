import { BuildContext } from './interfaces';
import { EventEmitter } from 'events';


const emmitter = new EventEmitter();


export function on(eventType: string, listener: {(context?: BuildContext, val?: any): void}) {
  return emmitter.on(eventType, listener);
}

export function emit(eventType: string, context?: BuildContext, val?: any) {
  return emmitter.emit(eventType, context, val);
}


export const EventType = {
  FileChange: 'FileChange',
  FileAdd: 'FileAdd',
  FileDelete: 'FileDelete',
  DirectoryAdd: 'DirectoryAdd',
  DirectoryDelete: 'DirectoryDelete',
  TaskEvent: 'TaskEvent'
};

export function eventTypes() {
  return Object.keys(EventType);
}

export interface TaskEvent {
  scope: string;
  type: string;
  duration?: number;
  time?: string;
  msg?: string;
}
