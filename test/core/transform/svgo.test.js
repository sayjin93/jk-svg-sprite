import * as svgo from 'svgo';
import svgoTransform from '../../../lib/core/transform/svgo.js';

const TEST_SVG = '<svg></svg>';

vi.mock('svgo');

describe('testing transforms.svgo', () => {
  let noop;

  beforeEach(() => {
    noop = vi.fn();
  });

  it('should set default config with expected params if not provided 1', () => {
    expect.hasAssertions();

    const spriter = {
      config: {
        svg: {
          xmlDeclaration: false,
          doctypeDeclaration: false
        }
      },
      error: vi.fn()
    };
    const shape = {
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValue(TEST_SVG)
    };
    const TEST_RESULT = 'test result';

    vi.mocked(svgo.optimize).mockReturnValueOnce(TEST_RESULT);
    svgoTransform(shape, {}, spriter, noop);

    expect(svgo.optimize).toHaveBeenCalledWith(TEST_SVG, {
      plugins: ['preset-default', {
        name: 'removeXMLProcInst'
      }, {
        name: 'removeDoctype'
      }]
    });
  });

  it('should set default config with expected params if not provided 2', () => {
    expect.hasAssertions();

    const spriter = {
      config: {
        svg: {
          xmlDeclaration: true,
          doctypeDeclaration: true
        }
      },
      error: vi.fn()
    };
    const shape = {
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValue(TEST_SVG)
    };
    const TEST_RESULT = 'test result';

    vi.mocked(svgo.optimize).mockReturnValueOnce(TEST_RESULT);
    svgoTransform(shape, {}, spriter, noop);

    expect(svgo.optimize).toHaveBeenCalledWith(TEST_SVG, { plugins: ['preset-default'] });
  });

  it('should add provided config', () => {
    expect.hasAssertions();

    const TEST_PLUGINS = [{
      name: 'preset-default',
      params: {
        overrides: {
          removeTitle: false,
          removeDesc: false
        }
      }
    }];
    const spriter = {
      config: {
        svg: {
          xmlDeclaration: true,
          doctypeDeclaration: true
        }
      },
      error: vi.fn()
    };
    const shape = {
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValue(TEST_SVG)
    };
    const TEST_RESULT = 'test result';

    vi.mocked(svgo.optimize).mockReturnValueOnce(TEST_RESULT);
    svgoTransform(shape, { plugins: TEST_PLUGINS }, spriter, noop);

    expect(svgo.optimize).toHaveBeenCalledWith(TEST_SVG, { plugins: expect.arrayContaining(TEST_PLUGINS) });
  });

  it('should log about optimizations', () => {
    expect.hasAssertions();

    const MOCKED_ORIGINAL_SVG = 'svgsvg';
    const MOCKED_OPTIMIZED_SVG = 'svg';
    const spriter = {
      config: {
        svg: {},
        log: {
          transports: [{
            level: 'debug'
          }, {
            level: 'debug'
          }]
        }
      },
      error: vi.fn(),
      debug: vi.fn()
    };
    const shape = {
      name: 'name',
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValueOnce(MOCKED_ORIGINAL_SVG).mockReturnValueOnce(MOCKED_OPTIMIZED_SVG)
    };

    vi.mocked(svgo.optimize).mockReturnValueOnce({});
    svgoTransform(shape, {}, spriter, noop);

    expect(spriter.debug).toHaveBeenCalledTimes(2);
    expect(spriter.debug).toHaveBeenCalledWith('Optimized "%s" with SVGO (saved %s / %s%%)', 'name', '3 Bytes', 50);
  });

  it('should not log about optimizations', () => {
    expect.hasAssertions();

    const spriter = {
      config: {
        svg: {},
        log: {
          transports: [{
            level: 'info'
          }]
        }
      },
      error: vi.fn(),
      debug: vi.fn()
    };
    const shape = {
      name: 'name',
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValue(TEST_SVG)
    };

    vi.mocked(svgo.optimize).mockReturnValueOnce({});
    svgoTransform(shape, {}, spriter, noop);

    expect(spriter.debug).not.toHaveBeenCalled();
  });

  it('should call callback', () => {
    expect.hasAssertions();

    const spriter = {
      config: {
        svg: {},
        log: {
          transports: []
        }
      },
      error: vi.fn(),
      debug: vi.fn()
    };
    const shape = {
      name: 'name',
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValue(TEST_SVG)
    };

    vi.mocked(svgo.optimize).mockReturnValueOnce({});
    svgoTransform(shape, {}, spriter, noop);

    expect(noop).toHaveBeenCalledWith(null);
  });

  it('should call callback with error and call spriter.error if error raised', () => {
    expect.hasAssertions();

    const TEST_ERROR = new Error('test');

    const spriter = {
      config: {
        svg: {}
      },
      error: vi.fn(),
      debug: vi.fn()
    };
    const shape = {
      name: 'name',
      setSVG: vi.fn(),
      getSVG: vi.fn().mockReturnValue(TEST_SVG)
    };

    vi.mocked(svgo.optimize).mockImplementationOnce(() => {
      throw TEST_ERROR;
    });
    svgoTransform(shape, {}, spriter, noop);

    expect(noop).toHaveBeenCalledWith(TEST_ERROR);
    expect(spriter.error).toHaveBeenCalledWith('Optimizing "%s" with SVGO failed with error "%s"', 'name', TEST_ERROR);
  });
});
