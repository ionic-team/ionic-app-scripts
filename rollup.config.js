import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
	plugins: [
    typescript({
      typescript: require('typescript')
    }),
    json(),
    nodeResolve({
      jsnext: true,
      main: true,
      skip: ['webpack', 'typescript', 'node-sass', 'spawn-sync', 'uglify-js', 'graceful-fs'],
      extensions: [ '.js', '.json' ],
      preferBuiltins: true
    }),
    commonjs({
      namedExports: {
        fs: [
          'realpath', 'default'
        ],
        'fs-extra': [
          'readJSONSync', 'statSync', 'accessSync', 'writeFile', 'readFile', 'outputJson', 'readJsonSync',
          'mkdirs', 'emptyDirSync', 'createProgram', 'readFileSync', 'outputJsonSync', 'copy', 'readdirSync',
          'ensureDirSync', 'remove'
        ],
        minimatch: [
          'Minimatch'
        ],
        tslint: [
          'createProgram', 'getFileNames', 'findConfiguration'
        ], 
        chalk: [ 'red', 'cyan', 'grey', 'dim', 'green', 'yellow', 'bgRed' ] 
      }
    }),
	],
	targets: [
		{ dest: 'dist/bundle.js', format: 'cjs' }
  ],
  entry: 'bin/ionic-app-scripts.ts',
  moduleName: 'ionic-app-scripts',
	sourceMap: false
};