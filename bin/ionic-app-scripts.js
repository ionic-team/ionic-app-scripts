#!/usr/bin/env node

if (process.argv.length > 2) {

  if (process.env.npm_config_argv) {
    try {
      var npmRunArgs = JSON.parse(process.env.npm_config_argv);
      if (npmRunArgs && npmRunArgs.original) {
        // add flags from original "npm run" command
        for (var i = 0; i < npmRunArgs.original.length; i++) {
          if (npmRunArgs.original[i].charAt(0) === '-') {
            process.argv.push(npmRunArgs.original[i]);
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  require('../dist/index').run(process.argv[2]);

} else {
  console.error('Missing ionic app script task name');
}
