import { CompilerOptions } from 'typescript';
import { NgcCompilerHost } from './compiler-host';
import { getInstance as getFileSystemInstance } from '../util/hybrid-file-system-factory';

let instance: NgcCompilerHost = null;

export function getInstance(options: CompilerOptions) {
  if (!instance) {
    instance = new NgcCompilerHost(options, getFileSystemInstance(false));
  }
  return instance;
}
