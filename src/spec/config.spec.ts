import { BuildContext } from '../util/interfaces';
import { bundlerStrategy, generateContext, getConfigValue, getUserConfigFile, replacePathVars, hasArg } from '../util/config';
import { addArgv, setAppPackageJsonData, setProcessEnvVar, setProcessArgs, setProcessEnv, setCwd } from '../util/config';
import { resolve } from 'path';


describe('config', () => {

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

    it('should set default bundler when invalid value', () => {
      const context = generateContext();
      expect(context.bundler).toEqual('webpack');
    });

    it('should set default bundler when not set', () => {
      const context = generateContext();
      expect(context.bundler).toEqual('webpack');
    });

    it('should set isProd by default', () => {
      const context = generateContext();
      expect(context.isProd).toEqual(false);
    });

    it('should create an object when passed nothing', () => {
      const context = generateContext();
      expect(context).toBeDefined();
    });

    it('should set default prod specific build flag defaults to false', () => {
      const context = generateContext({
        isProd: false
      });
      expect(context.isProd).toEqual(false);
      expect(context.runAot).toEqual(false);
      expect(context.runMinifyJs).toEqual(false);
      expect(context.runMinifyCss).toEqual(false);
      expect(context.optimizeJs).toEqual(false);
    });

    it('should set default prod specific build flags to true when isProd is true', () => {
      const context = generateContext({
        isProd: true
      });
      expect(context.isProd).toEqual(true);
      expect(context.runAot).toEqual(true);
      expect(context.runMinifyJs).toEqual(true);
      expect(context.runMinifyCss).toEqual(true);
      expect(context.optimizeJs).toEqual(true);
    });
  });

  describe('replacePathVars', () => {
    it('should interpolated value when string', () => {
      const context = {
        srcDir: 'src',
      };

      const rtn = replacePathVars(context, '{{SRC}}');
      expect(rtn).toEqual('src');
    });

    it('should interpolated values in string array', () => {
      const context = {
        wwwDir: 'www',
        srcDir: 'src',
      };

      const filePaths = ['{{SRC}}', '{{WWW}}'];
      const rtn = replacePathVars(context, filePaths);
      expect(rtn).toEqual(['src', 'www']);
    });

    it('should interpolated values in key value pair', () => {
      const context = {
        wwwDir: 'www',
        srcDir: 'src',
      };

      const filePaths = {
        src: '{{SRC}}',
        www: '{{WWW}}'
      };

      const rtn = replacePathVars(context, filePaths);
      expect(rtn).toEqual({
        src: 'src',
        www: 'www'
      });
    });

  });

  describe('getConfigValue', () => {

    it('should get arg full value', () => {
      addArgv('--full');
      addArgv('fullArgValue');
      addArgv('-s');
      addArgv('shortArgValue');
      setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('fullArgValue');
    });

    it('should get arg short value', () => {
      addArgv('-s');
      addArgv('shortArgValue');
      setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('shortArgValue');
    });

    it('should get envVar value', () => {
      setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('myProcessEnvVar');
    });

    it('should get package.json config value', () => {
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('myPackageConfigVal');
    });

    it('should get default value', () => {
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('defaultValue');
    });

  });

  describe('bundlerStrategy', () => {

    it('should get rollup by full arg', () => {
      addArgv('--rollup');
      addArgv('my.rollup.confg.js');
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by short arg', () => {
      addArgv('-r');
      addArgv('my.rollup.confg.js');
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by bundler arg', () => {
      addArgv('--bundler');
      addArgv('rollup');
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by env var', () => {
      setProcessEnv({
        ionic_bundler: 'rollup'
      });
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by package.json config', () => {
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get webpack with invalid env var', () => {
      setProcessEnv({
        ionic_bundler: 'bobsBundler'
      });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('webpack');
    });

    it('should get rollup by env var', () => {
      setProcessEnv({
        ionic_bundler: 'rollup'
      });
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by package.json config', () => {
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get webpack by default', () => {
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('webpack');
    });

  });

  describe('getUserConfigFile', () => {

    it('should get config from package.json config', () => {
      setAppPackageJsonData({
        config: { ionic_config: 'myconfig.js' }
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from env var', () => {
      setProcessEnv({
        IONIC_CONFIG: 'myconfig.js'
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from short arg', () => {
      addArgv('-s');
      addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from full arg', () => {
      addArgv('--full');
      addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get userConfigFile', () => {
      const userConfigFile = 'myconfig.js';
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should not get a user config', () => {
      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(null);
    });

  });

  describe('hasArg function', () => {
    it('should return false when a match is not found', () => {
      const result = hasArg('--full', '-f');
      expect(result).toBeFalsy();
    });

    it('should match on a fullname arg', () => {
      addArgv('--full');

      const result = hasArg('--full');
      expect(result).toBeTruthy();
    });

    it('should match on a shortname arg', () => {
      addArgv('-f');

      const result = hasArg('--full', '-f');
      expect(result).toBeTruthy();
    });

    it('should compare fullnames as case insensitive', () => {
      addArgv('--full');
      addArgv('--TEST');

      const result = hasArg('--Full');
      const result2 = hasArg('--test');
      expect(result).toBeTruthy();
      expect(result2).toBeTruthy();
    });

    it('should compare shortnames as case insensitive', () => {
      addArgv('-f');
      addArgv('-T');

      const result = hasArg('-F');
      const result2 = hasArg('-t');
      expect(result).toBeTruthy();
      expect(result2).toBeTruthy();
    })
  });

  let context: BuildContext;
  beforeEach(() => {
    setProcessArgs(['node', 'ionic-app-scripts']);
    setProcessEnv({});
    setCwd('');
    setAppPackageJsonData(null);
    context = generateContext({});
  });

});
