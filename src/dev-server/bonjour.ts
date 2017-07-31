import { Logger } from '../logger/logger';
import { getProjectJson } from '../util/ionic-project';
import { ServeConfig } from './serve-config';

export function createBonjourService(config: ServeConfig) {
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

function startDevApp(projectName: string, port: number) {
  const mdns = require('mdns');
  const name = projectName + ':' + port;
  const service = mdns.createAdvertisement(mdns.tcp('ionicdev'), port, {
    name: name,
  });
  service.start();
  return name;
}
