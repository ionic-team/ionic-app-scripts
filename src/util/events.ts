import { BuildContext } from './interfaces';
import { EventEmitter } from 'events';


const emmitter = new EventEmitter();


export function on(event: EventType, listener: {(context: BuildContext, arg: any): void}) {
  return emmitter.on('event' + event.toString(), listener);
}

export function emit(event: EventType, context: BuildContext, arg: any) {
  return emmitter.emit('event' + event.toString(), context, arg);
}

export enum EventType {
  FileChange,
  FileAdd,
  FileDelete,
  DirectoryAdd,
  DirectoryDelete
};
