import { join } from 'path';

import * as deepLinking from './deep-linking';
import * as deeplinkUtils from './deep-linking/util';
import * as Constants from './util/constants';
import { ChangedFile } from './util/interfaces';
import { FileCache } from './util/file-cache';
import * as helpers from './util/helpers';

describe('Deep Linking task', () => {
  describe('deepLinkingWorkerImpl', () => {
    it('should not update app ngmodule when it has an existing deeplink config', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache()
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue([1]);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(true);
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);
      spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, null);

      return promise.then(() => {
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).not.toHaveBeenCalled();
        expect(deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig).not.toHaveBeenCalled();
      });
    });

    it('should not update app ngmodule when no deeplinks were found', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache()
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue([]);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);
      spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, null);

      return promise.then(() => {
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).not.toHaveBeenCalled();
        expect(deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig).not.toHaveBeenCalled();
      });
    });

    it('should update deeplink config', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache(),
        runAot: true
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      const knownMockDeepLinkArray = [1];
      const changedFiles: ChangedFile[] = [];
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue(knownMockDeepLinkArray);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);
      spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, changedFiles);

      return promise.then(() => {
        expect(helpers.getStringPropertyValue).toBeCalledWith(Constants.ENV_APP_NG_MODULE_PATH);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig).toHaveBeenCalledWith(context, knownDeepLinkString, changedFiles, context.runAot);
      });
    });
  });
});
