import * as fs from 'fs-extra';
import * as clean from './clean';

describe('clean task', () => {

  describe('clean', () => {
    it('should empty the build directory', (done: Function) => {
      // arrage
      spyOn(fs, fs.emptyDirSync.name).and.returnValue('things');
      const context = { buildDir: 'something' };

      // act
      clean.clean(context).then(() => {
        // assert
        expect(fs.emptyDirSync).toHaveBeenCalledWith(context.buildDir);
        done();
      });
    });

    it('should throw when failing to empty dir', async () => {
      // arrage
      spyOn(fs, fs.emptyDirSync.name).and.throwError('Simulating an error');
      const context = { buildDir: 'something' };

      // act
      let error: Error = null;
      try {
        await clean.clean(context);
      } catch (ex) {
        error = ex;
      }

      // assert
      expect(error instanceof Error).toBe(true, 'Error is not an instance of type Error');
      expect(typeof error.message).toBe('string', 'error.message is not a string');
    });
  });
});
