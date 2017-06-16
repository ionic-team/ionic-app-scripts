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
        const mdns = require('mdns');
        const name = projectName + ':' + config.httpPort;
        const service = mdns.createAdvertisement(mdns.tcp('ionicdev'), config.httpPort, {
          name: name,
        });
        service.start();
        Logger.info(`publishing devapp service (${name})`);

      } catch (e) {
        Logger.warn('mDNS failed when trying to publish service');
        Logger.warn(e);
      }
    });
}
