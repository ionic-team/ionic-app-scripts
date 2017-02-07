import * as preprocess from './preprocess';
import * as deeplink from './deep-linking';
import * as helpers from './util/helpers';
import * as optimization from './optimization';


describe('Preprocess Task', () => {
  describe('preprocess', () => {
    it('should call deepLink but not optimization or write files to disk', () => {
      // arrange
      const context = {
        optimizeJs: false
      };

      spyOn(deeplink, deeplink.deepLinking.name).and.returnValue(Promise.resolve());
      spyOn(optimization, optimization.optimization.name).and.returnValue(Promise.resolve());
      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);
      spyOn(preprocess, preprocess.writeFilesToDisk.name).and.returnValue(null);

      // act
      return preprocess.preprocess(context).then(() => {
        // assert
        expect(optimization.optimization).not.toHaveBeenCalled();
        expect(preprocess.writeFilesToDisk).not.toHaveBeenCalledWith();
      });
    });

    it('should call optimization or write files to disk', () => {
      // arrange
      const context = {
        optimizeJs: true
      };

      spyOn(deeplink, deeplink.deepLinking.name).and.returnValue(Promise.resolve());
      spyOn(optimization, optimization.optimization.name).and.returnValue(Promise.resolve());
      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);
      spyOn(preprocess, preprocess.writeFilesToDisk.name).and.returnValue(null);

      // act
      return preprocess.preprocess(context).then(() => {
        // assert
        expect(optimization.optimization).toHaveBeenCalled();
        expect(preprocess.writeFilesToDisk).not.toHaveBeenCalledWith();
      });
    });
  });
});
