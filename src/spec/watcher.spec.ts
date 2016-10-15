import { BuildContext } from '../util/interfaces';
import { Watcher, prepareWatcher } from '../watch';


describe('watch', () => {

  describe('prepareWatcher', () => {

    it('should do nothing when options.ignored is a function', () => {
      const ignoreFn = function(){};
      const watcher: Watcher = { options: { ignored: ignoreFn } };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.ignored).toBe(ignoreFn);
    });

    it('should set replacePathVars when options.ignored is a string', () => {
      const watcher: Watcher = { options: { ignored: '{{SRC}}/**/*.spec.ts' } };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.ignored).toEqual('/some/src/**/*.spec.ts');
    });

    it('should set replacePathVars when paths is an array', () => {
      const watcher: Watcher = { paths: [
        '{{SRC}}/some/path1',
        '{{SRC}}/some/path2'
      ] };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.paths.length).toEqual(2);
      expect(watcher.paths[0]).toEqual('/some/src/some/path1');
      expect(watcher.paths[1]).toEqual('/some/src/some/path2');
    });

    it('should set replacePathVars when paths is a string', () => {
      const watcher: Watcher = { paths: '{{SRC}}/some/path' };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.paths).toEqual('/some/src/some/path');
    });

    it('should not set options.ignoreInitial if it was provided', () => {
      const watcher: Watcher = { options: { ignoreInitial: false } };
      const context: BuildContext = {};
      prepareWatcher(context, watcher);
      expect(watcher.options.ignoreInitial).toEqual(false);
    });

    it('should set options.ignoreInitial to true if it wasnt provided', () => {
      const watcher: Watcher = { options: {} };
      const context: BuildContext = {};
      prepareWatcher(context, watcher);
      expect(watcher.options.ignoreInitial).toEqual(true);
    });

    it('should not set options.cwd from context.rootDir if it was provided', () => {
      const watcher: Watcher = { options: { cwd: '/my/cwd/' } };
      const context: BuildContext = { rootDir: '/my/root/dir/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.cwd).toEqual('/my/cwd/');
    });

    it('should set options.cwd from context.rootDir if it wasnt provided', () => {
      const watcher: Watcher = {};
      const context: BuildContext = { rootDir: '/my/root/dir/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.cwd).toEqual(context.rootDir);
    });

    it('should create watcher options when not provided', () => {
      const watcher: Watcher = {};
      const context: BuildContext = {};
      prepareWatcher(context, watcher);
      expect(watcher.options).toBeDefined();
    });

  });

});
