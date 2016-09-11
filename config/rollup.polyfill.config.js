const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');


module.exports = {
  entry: '.tmp/app/polyfills.js',
  sourceMap: true,
  format: 'iife',
  plugins: [
    commonjs({}),
    nodeResolve()
  ]
};
