import { Logger } from '../logger/logger';
import { getProjectJson } from '../util/ionic-project';
import { ServeConfig } from './serve-config';

export function createBonjourService(config: ServeConfig) {
  if (!config.bonjour) {
    return;
  }
  getProjectJson()
    .then(project => project.name)
    .catch(() => 'ionic-app-scripts')
    .then(projectName => {
      Logger.info(`publishing bonjour service`);

      const bonjour = require('bonjour')();
      bonjour.publish({
        name: projectName,
        type: 'ionicdev',
        port: config.httpPort
      });

      const unpublish = function () {
        bonjour.unpublishAll();
        bonjour.destroy();
      };

      process.on('exit', unpublish);
      process.on('SIGINT', unpublish);
    });
}
