import { EventEmitter } from 'node:events';
import path from 'node:path';
import File from 'vinyl';
import SVGSpriterQueue from '../../lib/core/queue.js';
import Shape from '../../lib/core/shape.js';

vi.mock('../../lib/core/shape.js');
vi.mock('node:events');

describe('testing Queue', () => {
  describe('testing constructor()', () => {
    it('should be instance of EventEmitter', () => {
      expect.hasAssertions();

      const queue = new SVGSpriterQueue({ debug: vi.fn() });

      expect(queue).toBeInstanceOf(EventEmitter);
    });

    it('should set initial values and debug to console', () => {
      expect.hasAssertions();

      const spriter = { debug: vi.fn() };
      const queue = new SVGSpriterQueue(spriter);

      expect(queue._spriter).toBe(spriter);
      expect(queue._files).toStrictEqual([]);
      expect(queue.active).toBe(0);
      expect(spriter.debug).toHaveBeenCalledWith('Created processing queue instance');
    });

    it('should add events', () => {
      expect.hasAssertions();

      const testFn = vi.fn();

      /**
       * @returns {object} mock result
       */
      const testEventEmitter = function() {
        return {
          on(...args) {
            testFn(...args);
          },
          process: vi.fn()
        };
      };

      EventEmitter.mockImplementation(testEventEmitter);
       
      new SVGSpriterQueue({ debug: vi.fn() });

      expect(testFn).toHaveBeenCalledTimes(2);
      expect(testFn.mock.calls[0][0]).toBe('add');
      expect(testFn.mock.calls[1][0]).toBe('remove');
    });
  });

  describe('testing add()', () => {
    it('should debug info, add file to _files and emit "add" event', () => {
      expect.hasAssertions();

      const spriter = { debug: vi.fn() };
      const TEST_FILE_NAME = '/base/test.svg';
      const TEST_FILE = new File({
        path: TEST_FILE_NAME,
        base: '/base/'
      });
      const queue = new SVGSpriterQueue(spriter);

      vi.spyOn(queue, 'emit');

      queue.add(TEST_FILE);

      expect(spriter.debug).toHaveBeenLastCalledWith('Added "%s" to processing queue', path.basename(TEST_FILE_NAME));
      expect(queue._files).toStrictEqual([TEST_FILE]);
      expect(queue.emit).toHaveBeenCalledWith('add');
    });
  });

  describe('testing remove()', () => {
    let spriter;
    let queue;

    const TEST_DISTRIBUTE = [{ TEST: 'distribute' }];
    const TEST_SHAPE = { distribute: () => ([...TEST_DISTRIBUTE]) };

    beforeEach(() => {
      spriter = { debug: vi.fn(), _shapes: [] };
      queue = new SVGSpriterQueue(spriter);
    });

    it('should add shape to spriter', () => {
      expect.hasAssertions();

      queue.remove(null, TEST_SHAPE);

      expect(spriter._shapes).toStrictEqual(TEST_DISTRIBUTE);
    });

    it('should emit "remove" if active count is more than 1', () => {
      expect.hasAssertions();

      queue.active = 2;
      vi.spyOn(queue, 'emit');
      queue.remove(null, TEST_SHAPE);

      expect(queue.emit).toHaveBeenCalledWith('remove');
    });

    it('should emit "empty" if active count is 1', () => {
      expect.hasAssertions();

      queue.active = 1;
      vi.spyOn(queue, 'emit');
      queue.remove(null, TEST_SHAPE);

      expect(queue.emit).toHaveBeenCalledWith('empty');
    });
  });

  describe('testing process()', () => {
    let spriter;
    let queue;

    beforeEach(() => {
      spriter = {
        debug: vi.fn(),
        _limit: 10,
        error: vi.fn(),
        _transformShape: vi.fn().mockImplementation((shape, cb) => {
          return cb(null);
        })
      };
      queue = new SVGSpriterQueue(spriter);
    });

    it('should not do anything if files is empty', () => {
      expect.hasAssertions();

      queue._files = [];
      vi.spyOn(queue._files, 'shift');
      queue.process();

      expect(queue._files.shift).not.toHaveBeenCalled();
    });

    it('should not do anything if active is exceeding limit', () => {
      expect.hasAssertions();

      queue._files = [1];
      queue.active = 11;
      vi.spyOn(queue._files, 'shift');
      queue.process();

      expect(queue._files.shift).not.toHaveBeenCalled();
    });

    describe('testing positive case', () => {
      it('should increase active count call spriter._transformShape and shape.complement and then', async() => {
        expect.hasAssertions();

        const TEST_FILE = 'file';
        const TEST_SHAPE = {
          complement: vi.fn().mockImplementation(fn => {
            fn(TEST_SHAPE);
          })
        };
        const testFn = vi.fn();
        queue._files = [1];
        queue.active = 2;
        vi.spyOn(queue._files, 'shift').mockReturnValueOnce(TEST_FILE);
        // plain function, not an arrow: the queue calls `new Shape(...)`
        Shape.mockImplementation(function() {
          return TEST_SHAPE;
        });

        vi.spyOn(queue, 'remove').mockImplementation(() => {
          testFn();
        });

        queue.process();
        await new Promise(setImmediate); // await all async code to finish (async.waterfall)

        expect(queue.active).toBe(3);
        expect(spriter._transformShape).toHaveBeenCalledWith(TEST_SHAPE, expect.any(Function));
        expect(TEST_SHAPE.complement).toHaveBeenCalledWith(expect.any(Function));
        expect(testFn).toHaveBeenCalledWith();
      });

      it('should not increase active call _spriter.error and emit "remove" event if error occured', async() => {
        expect.hasAssertions();

        const TEST_FILE = new File({ path: '/base/file', base: '/base/' });
        const TEST_ERROR_MESSAGE = 'error';
        queue._files = [1];
        queue.active = 2;
        vi.spyOn(queue._files, 'shift').mockReturnValueOnce(TEST_FILE);
        vi.spyOn(queue, 'emit');
        Shape.mockImplementation(function() {
          throw new Error(TEST_ERROR_MESSAGE);
        });

        queue.process();
        await new Promise(setImmediate); // await all async code to finish (async.waterfall)

        expect(queue.active).toBe(2);
        expect(spriter.error).toHaveBeenCalledWith('Skipping "%s" (%s)', 'file', TEST_ERROR_MESSAGE);
        expect(queue.emit).toHaveBeenCalledWith('remove');
      });

      it('should not increase active call _spriter.error and emit "remove" event if error occured and active is zero', async() => {
        expect.hasAssertions();

        const TEST_FILE = new File({ path: '/base/file', base: '/base/' });
        queue._files = [1];
        queue.active = 0;
        vi.spyOn(queue._files, 'shift').mockReturnValueOnce(TEST_FILE);
        vi.spyOn(queue, 'emit');
        Shape.mockImplementation(() => {
          throw new Error('test');
        });

        queue.process();
        await new Promise(setImmediate); // await all async code to finish (async.waterfall)

        expect(queue.active).toBe(0);
        expect(queue.emit).toHaveBeenCalledWith('empty');
      });
    });
  });
});
