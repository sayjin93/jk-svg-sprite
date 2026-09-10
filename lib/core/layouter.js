/**
 * jk-svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/sayjin93/jk-svg-sprite
 * @license MIT https://github.com/sayjin93/jk-svg-sprite/blob/main/LICENSE
 */

import { merge, prettySize as pretty } from './utils/index.js';
import SVGSpriteCss from './mode/css.js';
import SVGSpriteView from './mode/view.js';
import SVGSpriteDefs from './mode/defs.js';
import SVGSpriteSymbol from './mode/symbol.js';
import SVGSpriteStack from './mode/stack.js';

/**
 * Sprite layout implementations, keyed by mode.
 *
 * Upstream resolved these with a dynamic `require(`./mode/${mode}`)`, which has
 * no ESM equivalent and is opaque to bundlers and tree-shakers. The set of modes
 * is fixed and validated in the config, so a static map is equivalent, faster
 * (no per-layout module resolution) and statically analysable.
 *
 * @type {object}
 */
const SPRITE_LAYOUTS = {
  css: SVGSpriteCss,
  view: SVGSpriteView,
  defs: SVGSpriteDefs,
  symbol: SVGSpriteSymbol,
  stack: SVGSpriteStack
};

const defaultConfig = {
  css: {
    dest: 'css',
    layout: 'packed',
    common: null,
    mixin: null,
    prefix: '.svg-%s',
    dimensions: '-dims',
    sprite: 'svg/sprite.css.svg',
    bust: true
  },
  view: {
    dest: 'view',
    layout: 'packed',
    common: null,
    mixin: null,
    prefix: '.svg-%s',
    dimensions: '-dims',
    sprite: 'svg/sprite.view.svg',
    bust: true
  },
  defs: {
    dest: 'defs',
    prefix: '.svg-%s',
    dimensions: '-dims',
    sprite: 'svg/sprite.defs.svg',
    inline: false,
    example: false,
    bust: false
  },
  symbol: {
    dest: 'symbol',
    prefix: '.svg-%s',
    dimensions: '-dims',
    sprite: 'svg/sprite.symbol.svg',
    inline: false,
    example: false,
    bust: false
  },
  stack: {
    dest: 'stack',
    prefix: '.svg-%s',
    dimensions: '-dims',
    sprite: 'svg/sprite.stack.svg',
    example: false,
    bust: false
  }
};

const defaultMustacheVariables = {
  date: new Date().toGMTString(),
  invert() {
    return (num, render) => -Number.parseFloat(render(num));
  },
  classname() {
    return (str, render) => {
      const classname = render(str).replaceAll(/\s+/g, ' ').split(' ').pop();
      return classname.startsWith('.') ? classname.substr(1) : classname;
    };
  },
  escape() {
    return (str, render) => render(str).split('\\').join('\\\\');
  },
  encodeHashSign() {
    return (str, render) => render(str).split('#').join('%23');
  }
};

export default class SVGSpriteLayouter {
  /**
   * SVGSprite layouter
   *
   * @param {SVGSpriter} spriter      SVG spriter
   * @param {object} config           Layout configuration
   */
  constructor(spriter, config) {
    this._spriter = spriter;
    this.config = config;
    this.mode = null;
    this.files = {};
    this.data = {};
    this._commonData = {
      shapes: [],
      ...defaultMustacheVariables,
      ...this._spriter.config.variables
    };

    // Register the common shapes data
    const lastShapeIndex = this._spriter._shapes.length - 1;

    for (const [index, shape] of this._spriter._shapes.entries()) {
      const { width, height } = shape.getDimensions();
      const { top, right, bottom, left } = shape.config.spacing.padding;

      this._commonData.shapes.push({
        name: shape.id,
        base: shape.base,
        master: shape.master?.id ?? null,
        width: {
          inner: width - right - left,
          outer: width
        },
        height: {
          inner: height - top - bottom,
          outer: height
        },
        first: index === 0,
        last: index === lastShapeIndex,
        fileSize: this.config.example ? pretty(shape.source.contents.length) : null
      });
    }

    this._spriter.debug('Created layouter instance');
  }

  /**
   * Layout as a sprite
   *
   * @param {object} files            Files
   * @param {string} key              Result key
   * @param {string} mode             Mode
   * @param {Function} cb             Callback
   */
  layout(files, key, mode, cb) {
    this._spriter.info('Laying out «%s» sprite («%s» mode)', key, mode);
    const SVGSpriteLayout = SPRITE_LAYOUTS[mode];

    if (!SVGSpriteLayout) {
      throw new TypeError(`Unknown sprite mode "${mode}"`);
    }

    const config = merge(merge(merge({}, defaultConfig[mode]), { svg: this._spriter.config.svg }), this.config[key] || {});
    const data = merge(merge(merge({}, this._commonData), this._spriter.config.variables), config.variables);
    const sprite = new SVGSpriteLayout(this._spriter, config, data, key);
    files[key] = {};
    sprite.layout(files[key], cb);
  }
};
