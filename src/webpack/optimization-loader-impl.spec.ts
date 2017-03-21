import { join } from 'path';

import { optimizationLoader } from './optimization-loader-impl';
import * as helpers from '../util/helpers';
import { FileCache } from '../util/file-cache';

describe('optimization loader impl', () => {
  describe('optimizationLoader', () => {
    it('should not cache files not in srcDir or ionicAngularDir', () => {
      const appDir = join('some', 'fake', 'path', 'myApp');
      const srcDir = join(appDir, 'src');
      const ionicAngularDir = join(appDir, 'node_modules', 'ionic-angular');
      const fileCache = new FileCache();
      const context = {
        srcDir: srcDir,
        ionicAngularDir: ionicAngularDir,
        fileCache: fileCache
      };

      const spy = jasmine.createSpy('callback');
      const webpackContext = {
        cacheable: () => {},
        async: () => spy,
        resourcePath: join(appDir, 'node_modules', '@angular', 'core', 'index.js')
      };

      spyOn(helpers, helpers.getContext.name).and.returnValue(context);

      optimizationLoader('someSource', {}, webpackContext);

      expect(fileCache.getAll().length).toEqual(0);
    });

    it('should cache files in the ionicAngularDir', () => {
      const appDir = join('some', 'fake', 'path', 'myApp');
      const srcDir = join(appDir, 'src');
      const ionicAngularDir = join(appDir, 'node_modules', 'ionic-angular');
      const fileCache = new FileCache();
      const context = {
        srcDir: srcDir,
        ionicAngularDir: ionicAngularDir,
        fileCache: fileCache
      };

      const spy = jasmine.createSpy('callback');
      const webpackContext = {
        cacheable: () => {},
        async: () => spy,
        resourcePath: join(ionicAngularDir, 'index.js')
      };

      spyOn(helpers, helpers.getContext.name).and.returnValue(context);

      const knownSource = 'someSource';
      optimizationLoader(knownSource, {}, webpackContext);

      expect(fileCache.getAll().length).toEqual(1);
      expect(fileCache.get(webpackContext.resourcePath).path).toEqual(webpackContext.resourcePath);
      expect(fileCache.get(webpackContext.resourcePath).content).toEqual(knownSource);
    });

    it('should cache files in the srcDir', () => {
      const appDir = join('some', 'fake', 'path', 'myApp');
      const srcDir = join(appDir, 'src');
      const ionicAngularDir = join(appDir, 'node_modules', 'ionic-angular');
      const fileCache = new FileCache();
      const context = {
        srcDir: srcDir,
        ionicAngularDir: ionicAngularDir,
        fileCache: fileCache
      };

      const spy = jasmine.createSpy('callback');
      const webpackContext = {
        cacheable: () => {},
        async: () => spy,
        resourcePath: join(srcDir, 'pages', 'page-one.ts')
      };

      spyOn(helpers, helpers.getContext.name).and.returnValue(context);

      const knownSource = 'someSource';
      optimizationLoader(knownSource, {}, webpackContext);

      expect(fileCache.getAll().length).toEqual(1);
      expect(fileCache.get(webpackContext.resourcePath).path).toEqual(webpackContext.resourcePath);
      expect(fileCache.get(webpackContext.resourcePath).content).toEqual(knownSource);
    });
  });
});
