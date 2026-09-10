import process from 'node:process';
import SVGSpriterConfig from '../../../lib/core/config.js';
import { Logger } from '../../../lib/core/utils/logger.js';

describe('testing log', () => {
  /**
   * Build a minimal object matching the logger duck-type the config accepts.
   *
   * Deliberately hand-rolled rather than a real `winston` logger: the contract
   * is "anything with a level, a transports array and a log method is used
   * as-is", and a `winston` logger satisfies it. Asserting against the shape
   * rather than the library keeps the promise testable without the dependency.
   *
   * @returns {object}   A logger-shaped object.
   */
  const getLogger = () => {
    return {
      level: 'info',
      transports: [{ level: 'info' }],
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      verbose: vi.fn(),
      debug: vi.fn()
    };
  };

  it('should set an externally supplied logger if it is passed as config.log', () => {
    expect.hasAssertions();

    const TEST_LOGGER = getLogger();
    const config = new SVGSpriterConfig({
      log: TEST_LOGGER
    });

    expect(config.log).toStrictEqual(TEST_LOGGER);
  });

  it('should accept the built-in Logger as an externally supplied logger', () => {
    expect.hasAssertions();

    const TEST_LOGGER = new Logger({ level: 'info', write: vi.fn() });
    const config = new SVGSpriterConfig({
      log: TEST_LOGGER
    });

    expect(config.log).toBe(TEST_LOGGER);
  });

  it('should call debug 6 times and verbose 1 time if shape has no meta and align', () => {
    expect.hasAssertions();

    const TEST_LOGGER = getLogger();

     
    new SVGSpriterConfig({
      log: TEST_LOGGER
    });

    expect(TEST_LOGGER.debug).toHaveBeenCalledTimes(6);
    expect(TEST_LOGGER.debug.mock.calls[0][0]).toBe('Started logging');
    expect(TEST_LOGGER.debug.mock.calls[1][0]).toBe('Prepared general options');
    expect(TEST_LOGGER.debug.mock.calls[2][0]).toBe('Prepared `shape` options');
    expect(TEST_LOGGER.debug.mock.calls[3][0]).toBe('Prepared `svg` options');
    expect(TEST_LOGGER.debug.mock.calls[4][0]).toBe('Prepared `mode` options');
    expect(TEST_LOGGER.debug.mock.calls[5][0]).toBe('Prepared `variables` options');
    expect(TEST_LOGGER.verbose).toHaveBeenCalledTimes(1);
    expect(TEST_LOGGER.verbose).toHaveBeenCalledWith('Initialized spriter configuration');
  });

  describe('should create the default logger', () => {
    beforeEach(() => {
      // the default logger writes to stderr; keep the test output clean.
      // `mockReset` in vitest.config.js clears spies between tests, so this
      // has to be re-applied per test rather than once in `beforeAll`.
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    it.each(
      ['info', 'verbose', 'debug']
    )('non-silent with %p log level if passed config.log has %p value', logLevel => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        log: logLevel
      });

      expect(config.log).toBeDefaultLogger();
      expect(config.log.transports[0].level).toBe(logLevel);
      expect(config.log.transports[0].silent).toBe(false);
    });

    it('non-silent with info level if passed truthy value', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        log: true
      });

      expect(config.log).toBeDefaultLogger();
      expect(config.log.transports[0].level).toBe('info');
      expect(config.log.transports[0].silent).toBe(false);
    });

    it('silent with info level if passed falsy value', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        log: false
      });

      expect(config.log).toBeDefaultLogger();
      expect(config.log.transports[0].level).toBe('info');
      expect(config.log.transports[0].silent).toBe(true);
    });
  });
});
