var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: {
    main: './bin/ionic-app-scripts.ts'
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader'],
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
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },

  externals: nodeModules,
  devtool: 'sourcemap'
};