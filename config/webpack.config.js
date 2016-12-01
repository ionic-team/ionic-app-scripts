var path = require('path');
var webpack = require('webpack');

var ionicWebpackFactoryPath = path.join(process.env.IONIC_APP_SCRIPTS_DIR, 'dist', 'webpack', 'ionic-webpack-factory.js');
var ionicWebpackFactory = require(ionicWebpackFactoryPath);

function getEntryPoint() {
  if (process.env.IONIC_ENV === 'prod') {
    return '{{SRC}}/app/main.ts';
  }
  return '{{SRC}}/app/main.ts';
}

function getPlugins() {
  return [ionicWebpackFactory.getIonicEnvironmentPlugin()];
}

function getDevtool() {
  if (process.env.IONIC_ENV === 'prod') {
    // for now, just force source-map for prod builds
    return 'source-map';
  }

  return process.env.IONIC_SOURCE_MAP;
}

module.exports = {
  bail: true,
  entry: getEntryPoint(),
  output: {
    path: '{{BUILD}}',
    filename: 'main.js',
    devtoolModuleFilenameTemplate: ionicWebpackFactory.getSourceMapperFunction(),
  },
  devtool: getDevtool(),

  resolve: {
    extensions: ['.js', '.ts', '.json'],
    modules: [path.resolve('node_modules')]
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.(ts|ngfactory.js)$/,
        loader: path.join(process.env.IONIC_APP_SCRIPTS_DIR, 'dist', 'webpack', 'typescript-sourcemap-loader-memory.js')
      }
    ]
  },

  plugins: getPlugins(),

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
