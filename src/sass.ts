import { basename, dirname, join, sep } from 'path';
import { BuildContext, TaskInfo } from './interfaces';
import { fillConfigDefaults, generateContext, Logger } from './util';
import { getModulePathsCache } from './bundle';
import { SassConfig, SassResult, SassMap } from './interfaces';
import { writeFile } from 'fs';


export function sass(context?: BuildContext) {
  const logger = new Logger('sass');
  context = generateContext(context);
  fillConfigDefaults(context, SASS_TASK_INFO)

  if (!context.moduleFiles) {
    // we haven't already gotten the moduleFiles in this process
    // see if we have it cached
    context.moduleFiles = getModulePathsCache();
    if (!context.moduleFiles) {
      logger.fail('Cannot generate Sass files without first bundling JavaScript ' +
                  'files in order to know all used modules. Please build and bundle the JS files first.');
      return Promise.reject('Missing module paths for sass build');
    }
  }

  return generateSass(context.moduleFiles, context.sassConfig).then(() => {
    return logger.finish();
  }).catch(reason => {
    return logger.fail(reason);
  });
}


function generateSass(moduleFiles: string[], sassConfig?: SassConfig) {

  if (!sassConfig.outFile) {

  }

  sassConfig.includePaths = sassConfig.includePaths || [];
  sassConfig.includePaths.unshift(dirname(sassConfig.outFile));

  sassConfig.excludeModules = (sassConfig.excludeModules || []).map(function(excludeModule) {
    return sep + excludeModule;
  });

  sassConfig.sortComponentPathsFn = (sassConfig.sortComponentPathsFn || defaultSortComponentPathsFn);
  sassConfig.sortComponentFilesFn = (sassConfig.sortComponentFilesFn || defaultSortComponentFilesFn);

  sassConfig.componentSassFiles = (sassConfig.componentSassFiles || ['*.scss']);

  if (!sassConfig.file) {
    generateSassData(moduleFiles, sassConfig);
  }

  return render(sassConfig);
}


function generateSassData(moduleFiles: string[], sassConfig: SassConfig) {
  /**
   * 1) Import user sass variables first since user variables
   *    should have precedence over default library variables.
   * 2) Import all library sass files next since library css should
   *    be before user css, and potentially have library css easily
   *    overridden by user css selectors which come after the
   *    library's in the same file.
   * 3) Import the user's css last since we want the user's css to
   *    potentially easily override library css with the same
   *    css specificity.
   */

  const moduleDirectories: string[] = [];
  moduleFiles.forEach(moduleFile => {
    const moduleDirectory = dirname(moduleFile);
    if (moduleDirectories.indexOf(moduleDirectory) < 0) {
      moduleDirectories.push(moduleDirectory);
    }
  });

  const userSassVariableFiles = getUserSassVariableFiles(sassConfig);
  const componentSassFiles = getComponentSassFiles(moduleDirectories, sassConfig);

  const sassImports = userSassVariableFiles.concat(componentSassFiles).map(sassFile => '"' + sassFile + '"');

  if (sassImports.length) {
    sassConfig.data = `@charset "UTF-8"; @import ${sassImports.join(',')};`;
  }
}


function getUserSassVariableFiles(opts: SassConfig) {
  // user variable files should be the very first imports
  if (Array.isArray(opts.variableSassFiles)) {
    return opts.variableSassFiles;
  }
  return [];
}


function getComponentSassFiles(moduleDirectories: string[], sassConfig: SassConfig) {
  const glob = require('glob-all');

  const componentSassFiles: string[] = [];
  const componentDirectories = getComponentDirectories(moduleDirectories, sassConfig);

  // sort all components with the library components being first
  // and user components coming lass, so it's easier for user css
  // to override library css with the same specificity
  const sortedComponentPaths = componentDirectories.sort(sassConfig.sortComponentPathsFn);

  sortedComponentPaths.forEach(componentPath => {
    let componentFiles: string[] = glob.sync(sassConfig.componentSassFiles, {
      cwd: componentPath
    });

    if (!componentFiles.length && componentPath.indexOf(sep + 'node_modules') === -1) {
      // if we didn't find anything, see if this module is mapped to another directory
      for (const k in sassConfig.directoryMaps) {
        componentPath = componentPath.replace(sep + k + sep, sep + sassConfig.directoryMaps[k] + sep);
        componentFiles = glob.sync(sassConfig.componentSassFiles, {
          cwd: componentPath
        });
      }
    }

    if (componentFiles.length) {
      componentFiles = componentFiles.sort(sassConfig.sortComponentFilesFn);

      componentFiles.forEach(componentFile => {
        componentSassFiles.push(join(componentPath, componentFile));
      });
    }
  });

  return componentSassFiles;
}


function getComponentDirectories(moduleDirectories: string[], sassConfig: SassConfig) {
  // filter out module directories we know wouldn't have sibling component sass file
  // just a way to reduce the amount of lookups to be done later
  return moduleDirectories.filter(moduleDirectory => {
    for (var i = 0; i < sassConfig.excludeModules.length; i++) {
      if (moduleDirectory.indexOf(sassConfig.excludeModules[i]) > -1) {
        return false;
      }
    }
    return true;
  });
}


function render(sassConfig: SassConfig) {
  const nodeSass = require('node-sass');

  if (sassConfig.sourceMap) {
    sassConfig.sourceMap = basename(sassConfig.outFile);
    sassConfig.omitSourceMapUrl = true;
    sassConfig.sourceMapContents = true;
  }

  return new Promise((resolve, reject) => {
    nodeSass.render(sassConfig, (renderErr: any, sassResult: SassResult) => {
      if (renderErr) {
        // sass render error!
        Logger.error(`Sass Error: line: ${renderErr.line}, column: ${renderErr.column}\n${renderErr.message}`);
        reject('Sass compile error');

      } else {
        // sass render success!
        renderSassSuccess(sassResult, sassConfig).then(() => {
          return resolve();
        }).catch(reason => {
          return reject(reason);
        });
      }
    });
  });
}


function renderSassSuccess(sassResult: SassResult, sassConfig: SassConfig): Promise<any> {
  if (sassConfig.autoprefixer) {
    // with autoprefixer
    const postcss = require('postcss');
    const autoprefixer = require('autoprefixer');

    return postcss([autoprefixer(sassConfig.autoprefixer)])
      .process(sassResult.css, {
        to: basename(sassConfig.outFile),
        map: { inline: false }

      }).then((postCssResult: any) => {
        postCssResult.warnings().forEach((warn: any) => {
          Logger.warn(warn.toString());
        });

        let apMapResult: string = null;
        if (postCssResult.map) {
          apMapResult = JSON.parse(postCssResult.map.toString()).mappings;
        }

        return writeOutput(sassConfig, postCssResult.css, apMapResult);
      });
  }

  // without autoprefixer
  generateSourceMaps(sassResult, sassConfig);

  let sassMapResult: string = null;
  if (sassResult.map) {
    sassMapResult = JSON.parse(sassResult.map.toString()).mappings;
  }

  return writeOutput(sassConfig, sassResult.css, sassMapResult);
}


function generateSourceMaps(sassResult: SassResult, sassConfig: SassConfig) {
  // this can be async and nothing needs to wait on it

  // build Source Maps!
  if (sassResult.map) {
    // transform map into JSON
    const sassMap: SassMap = JSON.parse(sassResult.map.toString());

    // grab the stdout and transform it into stdin
    const sassMapFile = sassMap.file.replace(/^stdout$/, 'stdin');

    // grab the base file name that's being worked on
    const sassFileSrc = sassConfig.outFile;

    // grab the path portion of the file that's being worked on
    const sassFileSrcPath = dirname(sassFileSrc);
    if (sassFileSrcPath) {
      // prepend the path to all files in the sources array except the file that's being worked on
      const sourceFileIndex = sassMap.sources.indexOf(sassMapFile);
      sassMap.sources = sassMap.sources.map((source, index) => {
        return (index === sourceFileIndex) ? source : join(sassFileSrcPath, source);
      });
    }

    // remove 'stdin' from souces and replace with filenames!
    sassMap.sources = sassMap.sources.filter(src => {
      if (src !== 'stdin') {
        return src;
      }
    });

    // Replace the map file with the original file name (but new extension)
    // sassMap.file = gutil.replaceExtension(sassFileSrc, '.css');
    // Apply the map
    // applySourceMap(file, sassMap);
  }
}


function writeOutput(sassConfig: SassConfig, cssOutput: string, mappingsOutput: string) {
  return new Promise((resolve, reject) => {

    writeFile(sassConfig.outFile, cssOutput, (fsWriteErr: any) => {
      if (fsWriteErr) {
        reject(`Error writing css file, ${sassConfig.outFile}: ${fsWriteErr}`);
        return;
      }

      if (mappingsOutput) {
        const sourceMapPath = join(dirname(sassConfig.outFile), basename(sassConfig.outFile) + '.map');

        writeFile(sourceMapPath, mappingsOutput, (fsWriteErr: any) => {
          if (fsWriteErr) {
            reject(`Error writing css map file, ${sourceMapPath}: ${fsWriteErr}`);
            return;
          }

          resolve();
        });
        return;
      }

      resolve();
    });
  });
}


function defaultSortComponentPathsFn(a: any, b: any): number {
  const aIndexOfNodeModules = a.indexOf('node_modules');
  const bIndexOfNodeModules = b.indexOf('node_modules');

  if (aIndexOfNodeModules > -1 && bIndexOfNodeModules > -1) {
    return (a > b) ? 1 : -1;
  }

  if (aIndexOfNodeModules > -1 && bIndexOfNodeModules === -1) {
    return -1;
  }

  if (aIndexOfNodeModules === -1 && bIndexOfNodeModules > -1) {
    return 1;
  }

  return (a > b) ? 1 : -1;
}


function defaultSortComponentFilesFn(a: any, b: any): number {
  const aPeriods = a.split('.').length;
  const bPeriods = b.split('.').length;
  const aDashes = a.split('-').length;
  const bDashes = b.split('-').length;

  if (aPeriods > bPeriods) {
    return 1;
  } else if (aPeriods < bPeriods) {
    return -1;
  }

  if (aDashes > bDashes) {
    return 1;
  } else if (aDashes < bDashes) {
    return -1;
  }

  return (a > b) ? 1 : -1;
}

const SASS_TASK_INFO: TaskInfo = {
  contextProperty: 'sassConfig',
  fullArgOption: '--sass',
  shortArgOption: '-s',
  defaultConfigFilename: 'sass.config'
};
