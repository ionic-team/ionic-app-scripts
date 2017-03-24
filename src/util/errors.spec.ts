import { BuildError } from './errors';


describe('Errors', () => {

  describe('BuildError', () => {

    it('should create BuildError from err object in constructor', () => {
      const buildError = new BuildError('message1');
      buildError.name = 'name1';
      buildError.stack = 'stack1';
      buildError.isFatal = true;
      buildError.hasBeenLogged = true;

      const buildErrorCopy = new BuildError(buildError);
      expect(buildErrorCopy.message).toEqual(buildError.message);
      expect(buildErrorCopy.message).toEqual('message1');
      expect(buildErrorCopy.name).toEqual(buildError.name);
      expect(buildErrorCopy.stack).toEqual(buildError.stack);
      expect(buildErrorCopy.isFatal).toEqual(buildError.isFatal);
      expect(buildErrorCopy.hasBeenLogged).toEqual(buildError.hasBeenLogged);
    });

    it('should create a default object', () => {
      const buildError = new BuildError('message1');
      expect(buildError.isFatal).toBeFalsy();
      expect(buildError.hasBeenLogged).toBeFalsy();
    });
  });

});
