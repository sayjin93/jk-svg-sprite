/**
 * jk-svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/sayjin93/jk-svg-sprite
 * @license MIT https://github.com/sayjin93/jk-svg-sprite/blob/main/LICENSE
 */

/**
 * Checks if value is a callable function.
 *
 * @param {any} value    The value to check.
 * @returns {boolean}    Returns true if value is correctly classified, else false.
 */
export function isFunction(value) {
  return Boolean(value && typeof value === 'function');
}

/**
 * Checks if value is the language type of Object (e.g. objects, regexes, new Number(0),
 * and new String('')). Excluding arrays (new Array())
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is an object, else false.
 */
export function isObject(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * Checks if value is an Object
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is an plain object, else false.
 */
export function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Checks if value is a String
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is a String, else false.
 */
export function isString(value) {
  return Object.prototype.toString.call(value) === '[object String]';
}

/**
 * Trim the start of a string of the specified characters.
 *
 * @param {string} inputString The string to trim the start of.
 * @param {string} [charsToTrim] The characters to trim from the start of the string. Defaults to a single space. The order of the characters does not matter.
 * @returns {string} The trimmed string.
 */
export function trimStart(inputString, charsToTrim = ' ') {
  if (!inputString) {
    return '';
  }

  const firstNonTrimCharIndex = [...inputString].findIndex(
    char => !charsToTrim.includes(char)
  );
  return inputString.substring(firstNonTrimCharIndex);
}

/**
 * @param {Array} array1    First array
 * @param {Array} array2    Second array
 * @returns {object}        The zipped Object
 */
export function zipObject(array1, array2) {
  if (!Array.isArray(array1) && !Array.isArray(array2)) {
    throw new TypeError('Both parameters must be an array');
  }

  return Object.fromEntries(array1.map((_, i) => ([array1[i], array2[i]])));
}

/**
 * HTML entity map used by {@link escape}.
 *
 * @type {object}
 */
const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escape the HTML-special characters `&`, `<`, `>`, `"` and `'`.
 *
 * Drop-in replacement for `lodash.escape`.
 *
 * @param {string} [value]   The string to escape.
 * @returns {string}         The escaped string.
 */
export function escape(value) {
  const string = value === null || value === undefined ? '' : String(value);
  return string.replaceAll(/[&<>"']/g, char => HTML_ESCAPES[char]);
}

/**
 * Recursive worker for {@link merge}.
 *
 * `stack` maps each source object already being merged to the target it is
 * being merged into, which is what makes circular structures terminate — SVG
 * shapes hold back-references (DOM parent links, the spriter itself), so this
 * is load-bearing, not defensive.
 *
 * @param {object} target      Destination, mutated in place.
 * @param {object} source      Source object.
 * @param {WeakMap} stack      Sources already visited, mapped to their targets.
 * @returns {object}           The mutated target.
 */
function baseMerge(target, source, stack) {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];

    // lodash.merge never overwrites an existing value with `undefined`
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = target[key];
    const sourceIsArray = Array.isArray(sourceValue);

    if (sourceIsArray || isPlainObject(sourceValue)) {
      if (stack.has(sourceValue)) {
        target[key] = stack.get(sourceValue);
        continue;
      }

      const merged = sourceIsArray ?
        (Array.isArray(targetValue) ? targetValue : []) :
        (isObject(targetValue) && !Array.isArray(targetValue) ? targetValue : {});

      stack.set(sourceValue, merged);
      baseMerge(merged, sourceValue, stack);
      target[key] = merged;
    } else {
      target[key] = sourceValue;
    }
  }

  return target;
}

/**
 * Deep-merge `sources` into `target`, mutating and returning `target`.
 *
 * Drop-in replacement for `lodash.merge` covering the behaviour this project
 * relies on: recursive merging of plain objects and arrays, `undefined` source
 * values never clobbering existing target values, circular references resolved
 * rather than recursed into, and everything else (class instances, functions,
 * buffers, regexes) assigned by reference.
 *
 * @param {object} target    Destination object, mutated in place.
 * @param {...any} sources   Source objects, applied left to right.
 * @returns {object}         The mutated target.
 */
export function merge(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) {
      continue;
    }

    // The root source is deliberately not pre-seeded into the stack: lodash
    // copies a self-reference into a new self-referential object rather than
    // pointing it back at `target`, and recursion still terminates because
    // nested visits are stacked.
    baseMerge(target, source, new WeakMap());
  }

  return target;
}

/**
 * Size units used by {@link prettySize}.
 *
 * @type {Array<string>}
 */
const SIZE_UNITS = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

/**
 * Format a byte count as a human readable string, e.g. `64.9 kB`.
 *
 * Drop-in replacement for `prettysize`, matching its output exactly: 1024-based
 * units, `Bytes` spelled out below 1 kB, one decimal place, and a trailing `.0`
 * trimmed off (so 1048576 renders as `1 MB`, not `1.0 MB`).
 *
 * @param {number} bytes   Number of bytes.
 * @returns {string}       Human readable size.
 */
export function prettySize(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value)) {
    return '0 Bytes';
  }

  const sign = value < 0 ? '-' : '';
  let size = Math.abs(value);
  let unit = 0;

  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024;
    unit++;
  }

  if (unit === 0) {
    return `${sign}${size} ${SIZE_UNITS[unit]}`;
  }

  const rounded = size.toFixed(1).replace(/\.0$/, '');
  return `${sign}${rounded} ${SIZE_UNITS[unit]}`;
}
