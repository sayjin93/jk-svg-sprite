/**
 * jk-svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/sayjin93/jk-svg-sprite
 * @license MIT https://github.com/sayjin93/jk-svg-sprite/blob/main/LICENSE
 */

import { optimize } from 'svgo';
import { merge, prettySize as pretty } from '../utils/index.js';

/**
 * SVGO transformation
 *
 * @param {SVGShape} shape                SVG shape
 * @param {object} config                 Transform configuration
 * @param {SVGSpriter} spriter            Spriter instance
 * @param {Function} cb                   Callback
 */
export default function(shape, config, spriter, cb) {
  const defaultPluginsConfig = ['preset-default'];

  config = merge({}, config);
  config.plugins = 'plugins' in config ? config.plugins : defaultPluginsConfig;

  if (!spriter.config.svg.xmlDeclaration) {
    // remove xml declaration if config.svg.xmlDeclaration is falsy
    config.plugins.push({
      name: 'removeXMLProcInst'
    });
  }

  if (!spriter.config.svg.doctypeDeclaration) {
    // remove docType if config.svg.doctypeDeclaration is falsy
    config.plugins.push({
      name: 'removeDoctype'
    });
  }

  const svg = shape.getSVG(false);
  const svgLength = svg.length;

  try {
    const result = optimize(svg, config);
    shape.setSVG(result.data);
    let optSVGLength = null;

    for (const transport of spriter.config.log.transports) {
      if (transport.level === 'debug') {
        optSVGLength = optSVGLength || shape.getSVG(false).length;
        const size = svgLength - optSVGLength;
        const percentage = Math.round(100 * size / svgLength);
        spriter.debug('Optimized "%s" with SVGO (saved %s / %s%%)', shape.name, pretty(size), percentage);
      }
    }

    cb(null);
  } catch (error) {
    spriter.error('Optimizing "%s" with SVGO failed with error "%s"', shape.name, error);
    cb(error);
  }
}
