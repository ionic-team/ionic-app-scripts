import { BuildContext } from '../util/interfaces';
import { generateContext, getConfigValueDefault, getUserConfigFile } from '../util/config';
import { addArgv, setProcessEnvVar, setProcessArgs, setProcessEnv, setCwd } from '../util/config';
import { resolve } from 'path';


describe('util', () => {

  describe('generateContext', () => {

    it('should set isWatch true with isWatch true context', () => {
      const context = generateContext({
        isWatch: true
      });
      expect(context.isWatch).toEqual(true);
    });

    it('should set isWatch false by default', () => {
      const context = generateContext();
      expect(context.isWatch).toEqual(false);
    });

    it('should set isProd false with isProd false context', () => {
      const context = generateContext({
        isProd: false
      });
      expect(context.isProd).toEqual(false);
    });

    it('should set isProd by default', () => {
      const context = generateContext();
      expect(context.isProd).toEqual(true);
    });

    it('should create an object when passed nothing', () => {
      const context = generateContext();
      expect(context).toBeDefined();
    });

  });

  describe('getConfigValueDefaults', () => {

    it('should get arg full value', () => {
      addArgv('--full');
      addArgv('fullArgValue');
      addArgv('-s');
      addArgv('shortArgValue');
      setProcessEnvVar('npm_package_config_envVar', 'myNPMConfigVal');
      setProcessEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefault('--full', '-s', 'envVar', 'defaultValue');
      expect(val).toEqual('fullArgValue');
    });

    it('should get arg short value', () => {
      addArgv('-s');
      addArgv('shortArgValue');
      setProcessEnvVar('npm_package_config_envVar', 'myNPMConfigVal');
      setProcessEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefault('--full', '-s', 'envVar', 'defaultValue');
      expect(val).toEqual('shortArgValue');
    });

    it('should get npm config value', () => {
      setProcessEnvVar('npm_package_config_envVar', 'myNPMConfigVal');
      setProcessEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefault('--full', '-s', 'envVar', 'defaultValue');
      expect(val).toEqual('myNPMConfigVal');
    });

    it('should get envVar value', () => {
      setProcessEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefault('--full', '-s', 'envVar', 'defaultValue');
      expect(val).toEqual('myProcessEnvVar');
    });

    it('should get default value', () => {
      const val = getConfigValueDefault('--full', '-s', 'envVar', 'defaultValue');
      expect(val).toEqual('defaultValue');
    });

  });

  describe('getUserConfigFile', () => {

    it('should get config from npm env var', () => {
      setProcessEnv({
        npm_package_config_ionic_config: 'myconfig.js'
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArgConfig: '--full', shortArgConfig: '-s', defaultConfigFile: 'default.config.js', envConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from env var', () => {
      setProcessEnv({
        ionic_config: 'myconfig.js'
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArgConfig: '--full', shortArgConfig: '-s', defaultConfigFile: 'default.config.js', envConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from short arg', () => {
      addArgv('-s');
      addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArgConfig: '--full', shortArgConfig: '-s', defaultConfigFile: 'default.config.js', envConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from full arg', () => {
      addArgv('--full');
      addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArgConfig: '--full', shortArgConfig: '-s', defaultConfigFile: 'default.config.js', envConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get userConfigFile', () => {
      const userConfigFile = 'myconfig.js';
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArgConfig: '--full', shortArgConfig: '-s', defaultConfigFile: 'default.config.js', envConfig: 'env.config.js' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should not get a user config', () => {
      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArgConfig: '--full', shortArgConfig: '-s', defaultConfigFile: 'default.config.js', envConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(null);
    });

  });

  let context: BuildContext;
  beforeEach(() => {
    setProcessArgs(['node', 'ionic-app-scripts']);
    setProcessEnv({});
    setCwd('');
    context = generateContext({});
  });

});
