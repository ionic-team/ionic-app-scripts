const rollupNG2 = require('../dist/plugins/rollupNG2').rollupNG2;
const nodeResolve = require('rollup-plugin-node-resolve');


module.exports = {
  entry: '.tmp/app/main.js',
  sourceMap: true,
  format: 'iife',
  plugins: [
    rollupNG2(),
    nodeResolve({module: true,
      jsnext: true,
      main: true,
      extensions: ['.js']
    })
  ]
};
