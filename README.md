# Ionic App Scripts

Helper scripts to get Ionic apps up and running quickly (minus the config overload).


### Config Defaults

Out of the box, Ionic starters have been preconfigured with great defaults for building fast apps, including:

- Transpiling source code to ES5 JavaScript
- Ahead of Time (AoT) template compiling
- Bundling modules for faster runtime execution
- Treeshaking unused components and code
- Generating CSS from bundled component Sass files
- Minifying JavaScript files
- Compressing CSS files

Just the bullet list above is a little overwhelming, and each task requires quite a bit of development time just to get started. Ionic App Script's goal is to make it easier to complete common tasks so developers can focus on building their app, rather than building build scripts.


### NPM Scripts

Instead of depending on external task runners, Ionic App Scripts now prefers being executed from [NPM scripts](https://docs.npmjs.com/misc/scripts). Ionic's NPM scripts come preconfigured within the project's `package.json` file. For example, this is the default setup for npm scripts within each starters:

```
  "scripts": {
    "build": "ionic-app-scripts build",
    "compress": "ionic-app-scripts compress",
    "watch": "ionic-app-scripts watch"
  },
```


## Custom Config Files

In most cases, the defaults which Ionic provides covers the scenarios required by developers. However, Ionic App Scripts also comes with multiple ways to configure and override the defaults for each of the various tasks. Note that Ionic will also apply its defaults for any property that was not provided by custom configurations.

### NPM Config

Within the `package.json` file, NPM also provides a handy [config](https://docs.npmjs.com/misc/config#per-package-config-settings) property. Below is an example of setting a custom config file using the `config` property in a project's `package.json`.

```
  "config": {
    "ionic_rollup" : "./config/rollup.config.js",
    "ionic_cleancss" : "./config/cleancss.config.js"
  },
```

### Command-line Flags

Remember how we're actually calling `ionic-app-scripts` from the `scripts` property of project's `package.json` file? Well we can also add command-line flags to each script, or make new scripts with these custom flags. For example:

```
  "scripts": {
    "build": "ionic-app-scripts build --rollup ./config/rollup.config.js",
    "compress": "ionic-app-scripts compress --cleancss ./config/cleancss.config.js",
  },
```


### Overriding Config Files

| Config File | NPM Config Property | Cmd-line Flag    |
|-------------|---------------------|------------------|
| CleanCss    | ionic_cleancss      | --cleancss or -e |
| Copy        | ionic_copy          | --copy or -y     |
| NGC         | ionic_ngc           | --ngc or -n      |
| Rollup      | ionic_rollup        | --rollup or -r   |
| Sass        | ionic_sass          | --sass or -s     |
| UglifyJS    | ionic_uglifyjs      | --uglifyjs or -u |


### Overriding Config Values

| Config Values   | NPM Config Property | Cmd-line Flag | Defaults        |
|-----------------|---------------------|---------------|-----------------|
| root directory  | ionic_root_dir      | --rootDir     | `process.cwd()` |
| tmp directory   | ionic_tmp_dir       | --tmpDir      | `.tmp`          |
| src directory   | ionic_src_dir       | --srcDir      | `src`           |
| www directory   | ionic_www_dir       | --wwwDir      | `www`           |
| build directory | ionic_build_dir     | --buildDir    | `build`         |


## The Stack

- TypeScript Compiler
- Angular Compiler (NGC)
- Rollup Module Bundler
- Component Sass
- UglifyJS
- CleanCss
