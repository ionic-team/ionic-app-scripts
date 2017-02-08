import { BuildContext } from '../util/interfaces';
import { join } from 'path';
import { Logger } from '../logger/logger';
import { unlinkAsync } from '../util/helpers';
import * as glob from 'glob';


export function removeUnusedFonts(context: BuildContext) {
  // For webapps, we pretty much need all fonts to be available because
  // the web server deployment never knows which browser/platform is
  // opening the app. Additionally, webapps will request fonts on-demand,
  // so having them all sit in the www/assets/fonts directory doesn’t
  // hurt anything if it’s never being requested.

  // However, with Cordova, the entire directory gets bundled and
  // shipped in the ipa/apk, but we also know exactly which platform
  // is opening the webapp. For this reason we can safely delete font
  // files we know would never be opened by the platform. So app-scripts
  // will continue to copy all font files over, but the cordova build
  // process would delete those we know are useless and just taking up
  // space. End goal is that the Cordova ipa/apk filesize is smaller.

  // Font Format Support:
  // ttf: http://caniuse.com/#feat=ttf
  // woff: http://caniuse.com/#feat=woff
  // woff2: http://caniuse.com/#feat=woff2

  if (context.target === 'cordova') {
    const fontsRemoved: string[] = [];
    // all cordova builds should remove .eot, .svg, .ttf, and .scss files
    fontsRemoved.push('*.eot');
    fontsRemoved.push('*.ttf');
    fontsRemoved.push('*.svg');
    fontsRemoved.push('*.scss');

    // all cordova builds should remove Noto-Sans
    // Only windows would use Noto-Sans, and it already comes with
    // a system font so it wouldn't need our own copy.
    fontsRemoved.push('noto-sans*');

    if (context.platform === 'android') {
      // Remove all Roboto fonts. Android already comes with Roboto system
      // fonts so shipping our own is unnecessary. Including roboto fonts
      // is only useful for PWAs and during development.
      fontsRemoved.push('roboto*');

    } else if (context.platform === 'ios') {
      // Keep Roboto for now. Apps built for iOS may still use Material Design,
      // so in that case Roboto should be available. Later we can improve the
      // CLI to be smarter and read the user’s ionic config. Also, the roboto
      // fonts themselves are pretty small.
    }

    let filesToDelete: string[] = [];

    let promises = fontsRemoved.map(pattern => {
      return new Promise(resolve => {
        let searchPattern = join(context.wwwDir, 'assets', 'fonts', pattern);

        glob(searchPattern, (err, files) => {
          if (err) {
            Logger.error(`removeUnusedFonts: ${err}`);

          } else {
            files.forEach(f => {
              if (filesToDelete.indexOf(f) === -1) {
                filesToDelete.push(f);
              }
            });
          }

          resolve();
        });

      });
    });

    return Promise.all(promises).then(() => {
      return unlinkAsync(filesToDelete).then(() => {
        if (filesToDelete.length) {
          Logger.info(`removed unused font files`);
          return true;
        }
        return false;
      });
    });
  }

  // nothing to do here, carry on
  return Promise.resolve();
}
