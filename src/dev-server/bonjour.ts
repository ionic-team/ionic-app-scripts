import { Logger } from '../logger/logger';
import { getProjectJson } from '../util/ionic-project';
import { ServeConfig } from './serve-config';

export function createDevAppService(config: ServeConfig) {
  if (!config.devapp) {
    return;
  }
  getProjectJson()
    .then(project => project.name)
    .catch(() => 'ionic-app-scripts')
    .then(projectName => {
      try {
        const name = startDevApp(projectName, config.httpPort);
        Logger.info(`publishing devapp service (${name})`);

      } catch (e) {
        Logger.warn('mDNS failed when trying to publish service');
        Logger.warn(e);
      }
    });
}

function startDevApp(name: string, port: number): string {
  const Publisher = require('@ionic/discover').Publisher;
  const service = new Publisher(name, port);
  service.start();
  return name;
}

