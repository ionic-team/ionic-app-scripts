import { HybridFileSystem } from './hybrid-file-system';
import { getContext } from './helpers';

let instance: HybridFileSystem = null;

export function getInstance() {
  if (!instance) {
    instance = new HybridFileSystem(getContext().fileCache);
  }
  return instance;
}
