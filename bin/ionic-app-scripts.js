#!/usr/bin/env node

if (process.argv.length > 2) {
  require('../dist/index').run(process.argv[2]);

} else {
  console.error('Missing ionic app script task name');
}
