var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
var packageJSON = require('./package.json');
var configFiles = fs.readdirSync('./bin')
  .filter(file => file.indexOf('.') !== 0)
  .map(file => './bin/' + file);

var nodeModules = Object.keys(packageJSON.dependencies)
  .reduce((all, mod) => {
    all[mod] = 'commonjs ' + mod;
    return all;
  }, {});

module.exports = {
  entry: {
    main: './src/index.ts',
    'worker-process': './src/worker-process.ts'
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader']
      },
      {
        test: /\.json$/,
        loaders: ['json-loader']
      }
    ],
    noParse: [/commonjs-loader.js/]
  },

  resolve: {
    mainFields: ['main'],
    aliasFields: ['browser'],
    extensions: ['.js', '.ts', '.json']
  },

  plugins: [
    new ForkCheckerPlugin()
  ],

  target: 'node',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },

  externals: nodeModules,
  devtool: 'sourcemap',
  node: {
    __dirname: false,
    __filename: false
  }
};