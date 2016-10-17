import { generateContext } from '../util/config';
import { findFileCopyOptions, CopyConfig } from '../copy';
import * as path from 'path';


describe('copy', () => {

  describe('findFileCopyOptions', () => {

    it('should find copy option for a file in a directory', () => {
      const context = generateContext();
      const filePath = 'src/assets/some.jpg';
      const copyOptions = findFileCopyOptions(context, copyConfig, filePath);
      expect(copyOptions.length).toEqual(1);
      expect(copyOptions[0].src).toEqual(path.join(context.rootDir, filePath));
      expect(copyOptions[0].dest).toEqual(path.join(context.rootDir, filePath).replace('src', 'www'));
    });

    it('should find copy option for an exact file', () => {
      const context = generateContext();
      const filePath = 'src/index.html';
      const copyOptions = findFileCopyOptions(context, copyConfig, filePath);
      expect(copyOptions.length).toEqual(1);
      expect(copyOptions[0].src).toEqual(path.join(context.rootDir, filePath));
      expect(copyOptions[0].dest).toEqual(path.join(context.rootDir, filePath).replace('src', 'www'));
    });

    it('should not find any copy options', () => {
      const context = generateContext();
      const filePath = 'src/idk.json';
      const copyOptions = findFileCopyOptions(context, copyConfig, filePath);
      expect(copyOptions.length).toEqual(0);
    });

  });

  const copyConfig: CopyConfig = {
    include: [
      {
        src: '{{SRC}}/assets/',
        dest: '{{WWW}}/assets/'
      },
      {
        src: '{{SRC}}/index.html',
        dest: '{{WWW}}/index.html'
      },
      {
        src: '{{SRC}}/manifest.json',
        dest: '{{WWW}}/manifest.json'
      },
      {
        src: '{{SRC}}/service-worker.js',
        dest: '{{WWW}}/service-worker.js'
      },
      {
        src: 'node_modules/ionic-angular/polyfills/polyfills.js',
        dest: '{{BUILD}}/polyfills.js'
      },
      {
        src: 'node_modules/ionicons/dist/fonts/',
        dest: '{{WWW}}/assets/fonts/'
      },
    ]
  };

});
