import { BuildContext } from '../util/interfaces';
import { buildIonicGlobal, prependIonicGlobal } from './ionic-global';


describe('Ionic Global', () => {

  describe('prependIonicGlobal', () => {

    it('should prepend window.Ionic to code', () => {
      const ctx: BuildContext = {
        rootDir: '/Users/elliemae/myapp',
        wwwDir: '/Users/elliemae/myapp/www',
        buildDir: '/Users/elliemae/myapp/www/build'
      };

      const code = 'var name = "Ellie Mae";';

      const r = prependIonicGlobal(ctx, 'main.js', code);

      expect(r.code.indexOf('Ionic') > -1).toBeTruthy();
      expect(r.map).toBeDefined();
    });

  });


  describe('buildIonicGlobal', () => {

    it('should cache windowIonic', () => {
      const ctx: BuildContext = {
        rootDir: '/Users/elliemae/myapp',
        wwwDir: '/Users/elliemae/myapp/www',
        buildDir: '/Users/elliemae/myapp/www/build'
      };

      expect((<any>ctx).windowIonic).toBeUndefined();

      const r = buildIonicGlobal(ctx);

      expect(r).toBeDefined();
      expect((<any>ctx).windowIonic).toBeDefined();
    });

  });

});
