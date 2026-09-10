/**
 * jk-svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/sayjin93/jk-svg-sprite
 * @license MIT https://github.com/sayjin93/jk-svg-sprite/blob/main/LICENSE
 */

import { format } from 'node:util';

/**
 * Log levels, ordered by increasing verbosity. Mirrors the subset of npm log
 * levels that `winston` uses, so numeric comparisons behave identically.
 *
 * @type {object}
 */
const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 4,
  debug: 5
};

/**
 * ANSI colours matching `winston.format.colorize()` defaults.
 *
 * @type {object}
 */
const COLORS = {
  error: '\u001B[31m',
  warn: '\u001B[33m',
  info: '\u001B[32m',
  verbose: '\u001B[36m',
  debug: '\u001B[34m'
};

const RESET = '\u001B[39m';

/**
 * Decide whether to emit ANSI colour codes, honouring the `NO_COLOR` and
 * `FORCE_COLOR` conventions and falling back to TTY detection.
 *
 * @returns {boolean}   Whether colour output is appropriate.
 */
function supportsColor() {
  if (process.env.NO_COLOR) {
    return false;
  }

  if (process.env.FORCE_COLOR) {
    return process.env.FORCE_COLOR !== '0';
  }

  return Boolean(process.stderr.isTTY);
}

/**
 * Render a timestamp as `YYYY-MM-DD HH:mm:ss.SSS` in local time.
 *
 * Note: upstream svg-sprite configured `winston` with the format string
 * `YYYY-MM-DD HH:MM:ss.SSS`, where `MM` means *month* — so its logs printed the
 * month in the minutes position. This renders real minutes.
 *
 * @param {Date} [date]   Date to format.
 * @returns {string}      Formatted timestamp.
 */
export function timestamp(date = new Date()) {
  const pad = (value, length = 2) => String(value).padStart(length, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

/**
 * Minimal leveled logger with a `winston`-compatible surface.
 */
export class Logger {
  /**
   * @param {object} [options]            Options.
   * @param {string} [options.level]      Maximum level to emit.
   * @param {boolean} [options.silent]    Suppress all output.
   * @param {Function} [options.write]    Sink for formatted lines, defaults to stderr.
   */
  constructor({ level = 'info', silent = false, write } = {}) {
    this.level = level;
    this.silent = silent;
    this._write = write || (line => process.stderr.write(`${line}\n`));

    // Present so that duck-typed `winston` detection also recognises this logger
    this.transports = [{ level, silent }];
  }

  /**
   * Emit a message if the configured level permits it.
   *
   * @param {string} level     Level name.
   * @param {string} message   Message, optionally with `util.format` placeholders.
   * @param {...any} args      Format arguments.
   * @returns {Logger}         Self reference.
   */
  log(level, message, ...args) {
    if (this.silent) {
      return this;
    }

    const threshold = LEVELS[this.level] ?? LEVELS.info;
    const severity = LEVELS[level] ?? LEVELS.info;

    if (severity > threshold) {
      return this;
    }

    // `winston.format.splat()` equivalent — printf-style interpolation
    const text = args.length > 0 ? format(message, ...args) : String(message);
    const label = supportsColor() ? `${COLORS[level] || ''}${level}${RESET}` : level;

    this._write(`${timestamp()} - ${label}: ${text}`);

    return this;
  }

  /**
   * @param {...any} args   Message and format arguments.
   * @returns {Logger}      Self reference.
   */
  error(...args) {
    return this.log('error', ...args);
  }

  /**
   * @param {...any} args   Message and format arguments.
   * @returns {Logger}      Self reference.
   */
  warn(...args) {
    return this.log('warn', ...args);
  }

  /**
   * @param {...any} args   Message and format arguments.
   * @returns {Logger}      Self reference.
   */
  info(...args) {
    return this.log('info', ...args);
  }

  /**
   * @param {...any} args   Message and format arguments.
   * @returns {Logger}      Self reference.
   */
  verbose(...args) {
    return this.log('verbose', ...args);
  }

  /**
   * @param {...any} args   Message and format arguments.
   * @returns {Logger}      Self reference.
   */
  debug(...args) {
    return this.log('debug', ...args);
  }
}

/**
 * Create a logger.
 *
 * @param {object} [options]   See {@link Logger}.
 * @returns {Logger}           Logger instance.
 */
export function createLogger(options) {
  return new Logger(options);
}
