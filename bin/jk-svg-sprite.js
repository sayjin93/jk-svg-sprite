#!/usr/bin/env node

/**
 * jk-svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/sayjin93/jk-svg-sprite
 * @license MIT https://github.com/sayjin93/jk-svg-sprite/blob/main/LICENSE
 */

/**
 * Module dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import File from 'vinyl';
// js-yaml 5 is ESM and exposes no default export
import { load as loadYaml } from 'js-yaml';
// yargs 18 is ESM-only and no longer exports a pre-built singleton, so the
// instance has to be constructed explicitly from argv
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import SVGSpriter from '../lib/index.js';
import { isObject, merge, zipObject } from '../lib/core/utils/index.js';

// `__dirname` does not exist in ESM
const currentDirectory = import.meta.dirname;

// yargs' automatic version detection resolves the nearest package.json from the
// working directory, which is the *consuming* project once installed. Read our
// own manifest explicitly instead.
const { version: packageVersion } = JSON.parse(
  fs.readFileSync(path.resolve(currentDirectory, '../package.json'), 'utf8')
);

let cli = yargs(hideBin(process.argv))
  .usage('Create one or multiple sprites of the given SVG files, optionally along with some stylesheet resources.\nUsage: $0 [options] files')
  .version(packageVersion)
  .help('help', 'Display this help information')
  .wrap(null)
  .example('$0 --css --css-render-css --css-example --dest=out assets/*.svg', 'Create a CSS sprite of the given SVG files including example document to the subdirectory "out"')
  .example('$0 -cD out --ccss --cx assets/*.svg', 'Same as above')
  .example('$0 -cD out --cscss -p 10 assets/*.svg', 'Render Sass instead of CSS and add 10px padding around all shapes (no example document this time)')
  .showHelpOnFail(true)
  .demandCommand(1);

const config = {};
let JSONConfig = { mode: {} };
const optionsMap = {};

/**
 * Add a command line option
 *
 * @param {string} name Option name
 * @param {object} option Option configuration
 */
function addOption(name, option) {
  let alias = name;

  // If the this is an option itself
  if ('description' in option) {
    if ('alias' in option) {
      alias = option.alias;
      cli = cli.alias(alias, name);
    }

    cli = cli.describe(alias, option.description);

    if ('default' in option) {
      const template = name.endsWith('-template');
      const def = template ? path.resolve(path.dirname(currentDirectory), option.default) : option.default;
      cli = cli.default(alias, def);

      if (option.default === true || option.default === false) {
        cli = cli.boolean(name);
      }
    } else if (option.required) {
      cli = cli.demandOption(alias);
    }

    if ('map' in option) {
      optionsMap[option.map] = name;
    }
  }

  const { description, alias: optAlias, default: optDefault, map, ...children } = option;
  for (const [key, value] of Object.entries(children)) {
    addOption(`${name}-${key}`, value);
  }
}

/**
 * Add a value to the global configuration
 *
 * @param {object} store Configuration
 * @param {Array<string>} path Path
 * @param {any} value Value
 */
function addConfigMap(store, path, value) {
  const key = path.shift();
  if (path.length) {
    if (!(key in store) || !isObject(store[key])) {
      store[key] = {};
    }

    addConfigMap(store[key], path, value);
  } else {
    store[key] = value;
  }
}

/**
 * Recursively write files to disc
 *
 * @param {object} files Files
 * @returns {number}     Number of written files
 */
function writeFiles(files) {
  let written = 0;

  for (const file of Object.values(files)) {
    if (!isObject(file)) {
      continue;
    }

    if (file.constructor === File) {
      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.contents);
      ++written;
    } else {
      written += writeFiles(file);
    }
  }

  return written;
}

// Get document, or throw exception on error
try {
  const options = loadYaml(fs.readFileSync(path.resolve(currentDirectory, 'config.yaml'), 'utf8'));
  for (const [key, value] of Object.entries(options)) {
    addOption(key, value);
  }
} catch (error) {
  console.log(error);
}

const argv = cli.parseSync();

// Map all arguments to a global configuration object
for (const [key, value] of Object.entries(optionsMap)) {
  if (!(value in argv)) {
    continue;
  }

  addConfigMap(config, key.split('.'), argv[value]);
}

// Load external JSON config file
if (argv.config) {
  try {
    const file = argv.config;
    delete argv.config;
    delete argv.C;
    const JSONConfigContent = fs.readFileSync(path.resolve(file));
    const externalConfig = JSON.parse(JSONConfigContent);

    // Make a clone of initial config for options removal checks
    JSONConfig = JSON.parse(JSONConfigContent);
    if (!('mode' in JSONConfig)) {
      JSONConfig.mode = {};
    }

    // Expand shorthand mode definitions
    if ('mode' in externalConfig && isObject(externalConfig.mode)) {
      for (const emode in externalConfig.mode) {
        if (externalConfig.mode[emode] === true) {
          const defaultEmode = {
            render: {
              css: true
            }
          };
          externalConfig.mode[emode] = defaultEmode;
          JSONConfig.mode[emode] = defaultEmode;
        }
      }
    }

    merge(config, externalConfig);
  } catch (error) {
    console.error('[ERROR] Skipping --config file due to errors ("%s")', error.message.trim());
  }
}

// Refine particular config options
config.shape.spacing.padding = String(config.shape.spacing.padding).trim();
config.shape.spacing.padding = config.shape.spacing.padding.length ?
  config.shape.spacing.padding.split(',').map(dim => Number.parseFloat(dim || 0)) :
  [];

if (config.svg.rootAttributes && typeof config.svg.rootAttributes === 'string') {
  try {
    const JSONAttributesContent = fs.readFileSync(path.resolve(config.svg.rootAttributes));
    config.svg.rootAttributes = JSON.parse(JSONAttributesContent);
  } catch (error) {
    console.error('[ERROR] Skipping --svg-rootattrs file due to errors ("%s")', error.message.trim());
    config.svg.rootAttributes = {};
  }
}

// Expand transformation options
if (typeof config.shape.transform === 'string') {
  const transform = String(config.shape.transform).trim();
  config.shape.transform = [];
  (transform.length ? transform.split(',').map(trans => String(trans).trim()) : [])
  // TODO
    .forEach(function(transform) {
      if (transform.length) {
        if (`shape-transform-${transform}` in argv) {
          try {
            const transformConfigFile = argv[`shape-transform-${transform}`];
            const transformConfigJSON = fs.readFileSync(path.resolve(transformConfigFile), 'utf8');
            const transformConfig = transformConfigJSON.trim() ? JSON.parse(transformConfigJSON) : {};
            this.push(zipObject([transform], [transformConfig]));
          } catch {}
        } else {
          this.push(transform);
        }
      }
    }, config.shape.transform);
}

// Run through all sprite modes
// TODO
['css', 'view', 'defs', 'symbol', 'stack'].forEach(function(mode) {
  if (!argv[mode] && !(mode in JSONConfig.mode)) {
    delete this[mode];
    return;
  }

  // Remove excessive render types
  // TODO
  ['css', 'scss', 'less', 'styl'].forEach(function(render) {
    const arg = `${mode}-render-${render}`;
    if (render in this && !argv[arg] && (!(mode in JSONConfig.mode) || !('render' in JSONConfig.mode[mode]) || !(render in JSONConfig.mode[mode].render))) {
      delete this[render];
    }
  }, this[mode].render);

  if (!this[mode].dimensions.length) {
    this[mode].dimensions = true;
  }
}, config.mode);

// Remove excessive example options
for (const mode of Object.keys(config.mode)) {
  const example = `${mode}-example`;
  if (!argv[example] && (!(mode in JSONConfig.mode) || !('example' in JSONConfig.mode[mode])) && 'example' in config.mode[mode]) {
    delete config.mode[mode].example;
  }
}

// Read & parse Mustache variable JSON file
if ('variables' in config) {
  let variables = String(config.variables).trim();
  delete config.variables;
  variables = variables.length ? path.resolve(variables) : null;
  if (variables && fs.existsSync(variables)) {
    try {
      config.variables = JSON.parse(fs.readFileSync(variables));
    } catch (error) {
      console.error('[ERROR] Skipping --variables file due to errors ("%s")', error.message.trim());
    }
  }
}

const spriter = new SVGSpriter(config);
const files = argv._.reduce((f, g) => [...f, ...fs.globSync(String(g))], []);

for (let file of files) {
  let basename = file;
  file = path.resolve(file); // TODO: get rid of variable redefinition
  const stat = fs.lstatSync(file);

  if (stat.isSymbolicLink()) {
    file = fs.readlinkSync(file);
    basename = path.basename(file);
  } else {
    const basepos = basename.lastIndexOf('./');
    basename = basepos !== -1 ? basename.substr(basepos + 2) : path.basename(file);
  }

  spriter.add(file, basename, fs.readFileSync(file));
}

spriter.compile((error, result) => {
  if (error) {
    console.error(error);
  } else {
    writeFiles(result);
  }
});
