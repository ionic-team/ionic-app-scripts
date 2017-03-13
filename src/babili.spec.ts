import * as babili from './babili';
import * as configUtil from './util/config';
import * as crossSpawn from 'cross-spawn';
import { EventEmitter } from 'events';

describe('babili function', () => {
  const emitter = new EventEmitter();
  beforeEach(() => {
    spyOn(configUtil, 'getUserConfigFile').and.returnValue('fileContents');
    spyOn(crossSpawn, 'spawn').and.callFake(() => {
      return emitter;
    });
  });

  it('should call main babili function', () => {
    const context = {
      rootDir: '/Users/noone/Projects/ionic-conference-app'
    };
    const configFile = 'configFileContents';

    let pr = babili.babili(context, configFile);
    emitter.emit('close', 0);
    pr.then(() => {
      expect(configUtil.getUserConfigFile).toHaveBeenCalledWith(context, babili.taskInfo, configFile);
    });
  });

  it('should throw if context does not have a rootDir', () => {
    const context = {};
    const configFile = 'configFileContents';

    expect(babili.babili(context, configFile)).toThrow();
  });

  it('should fail because it does not have a valid build context', () => {
    const context: null = null;
    const configFile = 'configFileContents';

    expect(babili.babili(context, configFile)).toThrow();
  });

  it('should fail because it does not have a valid config file', () => {
    const context = {};
    const configFile: null = null;

    expect(babili.babili(context, configFile)).toThrow();
  });

});
