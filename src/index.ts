export { build, buildUpdate } from './build';
export { bundle, bundleUpdate } from './bundle';
export { clean } from './clean';
export { cleancss } from './cleancss';
export { copy, copyUpdate } from './copy';
export { lint } from './lint';
export { minify } from './minify';
export { ngc, ngcUpdate } from './ngc';
export { sass, sassUpdate } from './sass';
export { transpile } from './transpile';
export { uglifyjs } from './uglifyjs';
export { watch } from './watch';
export * from './util/config';
export * from './util/helpers';
export * from './util/interfaces';


export function run(task: string) {
  try {
    require(`../dist/${task}`)[task]().catch((e: Error) => {
      console.error(`Error running ionic app script "${task}": ${e}`);
      process.exit(1);
    });
  } catch (e) {
    console.error(`Error running ionic app script "${task}": ${e}`);
    process.exit(1);
  }
}
