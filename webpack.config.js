var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;

var nodeModules = [
  'typescript', 'tslint', 'webpack', 'rollup', 'node-sass', 'fsevents', 'fs-extra', 'uglify-js',
  'rollup-plugin-node-resolve', 'rollup-plugin-commonjs', 'rollup-plugin-node-globals', 'rollup-plugin-node-builtins',
  'rollup-plugin-json', 'tiny-lr'
]
  .reduce(function(all, mod) {
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
    ]
  },

  resolve: {
    mainFields: ['main'],
    aliasFields: ['browser'],
    extensions: ['.js', '.ts', '.json']
  },

  plugins: [
    new ForkCheckerPlugin(),
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