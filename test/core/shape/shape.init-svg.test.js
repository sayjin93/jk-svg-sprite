 

import { Buffer } from 'node:buffer';
import File from 'vinyl';
import fixXMLString from '../../../lib/core/utils/fix-xml-string.js';
import ArgumentError from '../../../lib/core/errors/argument-error.js';
import SVGShape from '../../../lib/core/shape.js';

const TEST_SPRITER = {
  config: {
    shape: {
      meta: {},
      align: {}
    }
  },
  verbose: vi.fn()
};

// an ESM mock factory must return the module shape, not the export itself
vi.mock('../../../lib/core/utils/fix-xml-string.js', () => ({ default: vi.fn() }));

describe('testing _initSVG()', () => {
  it('should call fixXMLString if passed svg is not normal', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('s'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    fixXMLString.mockReturnValueOnce('<svg></svg>');

    new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(fixXMLString).toHaveBeenCalledWith('s');
  });

  it('should call fixXMLString and throw error if passed svg is not normal', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('s'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    fixXMLString.mockReturnValueOnce('<');

    expect(() => {
      new SVGShape(TEST_FILE, TEST_SPRITER);
    }).toThrow(new ArgumentError('Invalid SVG file'));

    expect(fixXMLString).toHaveBeenCalledWith('s');
  });

  it('should call fixXMLString and throw error if passed svg is not normal and fixXMLString thrown error', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('s'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    fixXMLString.mockImplementation(() => {
      throw new Error('error');
    });

    expect(() => {
      new SVGShape(TEST_FILE, TEST_SPRITER);
    }).toThrow(new ArgumentError('Invalid SVG file'));
    expect(fixXMLString).toHaveBeenCalledWith('s');
  });

  it('should not call fixXMLString if passed svg is normal', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('<svg></svg>'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(fixXMLString).not.toHaveBeenCalled();
  });

  it('should fill entities', () => {
    expect.hasAssertions();

    // The original fixture placed the DOCTYPE *inside* the root element, which
    // is not well-formed XML; @xmldom/xmldom 0.8 tolerated it and 0.9 rejects
    // it. Entity declarations belong in an internal subset before the root.
    const TEST_ENTITIES = [
      '<!ENTITY name1 "value1">',
      '<!ENTITY name2 "value2">'
    ];
    const TEST_FILE = new File({
      contents: Buffer.from(`<!DOCTYPE svg [${TEST_ENTITIES.join('')}]><svg xmlns="http://www.w3.org/2000/svg">&name1;&name2;</svg>`),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    // both declared entities are resolved in the shape source before parsing
    expect(shape.svg.current).toContain('value1');
    expect(shape.svg.current).toContain('value2');
    expect(shape.svg.current).not.toContain('&name1;');
    expect(shape.svg.current).not.toContain('&name2;');
  });

  it('should throw error if bad svg parsed', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from(
        '<<ddfasdfasdf>>'
      ),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    expect(() => {
      new SVGShape(TEST_FILE, TEST_SPRITER);
    }).toThrow('Invalid SVG file');
  });

  it('should set width and height', () => {
    expect.hasAssertions();

    const TEST_WIDTH = 200;
    const TEST_HEIGHT = 100;

    const TEST_FILE = new File({
      contents: Buffer.from(`<svg width="${TEST_WIDTH}" height="${TEST_HEIGHT}"></svg>`),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(shape.width).toBe(TEST_WIDTH);
    expect(shape.height).toBe(TEST_HEIGHT);
  });

  it('should set width, height and viewBox to false', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('<svg></svg>'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(shape.width).toBe(false);
    expect(shape.height).toBe(false);
    expect(shape.viewBox).toBe(false);
  });

  it('should set expected viewBox', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('<svg viewBox="0 1 2 3 4 5 20d ten"></svg>'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(shape.viewBox).toStrictEqual([0, 1, 2, 3, 4, 5, 20, Number.NaN]);
  });

  it('should fill viewBox', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('<svg viewBox="0 1"></svg>'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const TEST_SPRITER = {
      config: {
        shape: {
          meta: {},
          align: {}
        }
      },
      verbose: vi.fn()
    };

    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(shape.viewBox).toStrictEqual([0, 1, 0, 0]);
  });

  it('should set title and description to null', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('<svg></svg>'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });

    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(shape.title).toBeNull();
    expect(shape.description).toBeNull();
  });

  it('should set title and description accordingly to svg', () => {
    expect.hasAssertions();

    const TEST_FILE = new File({
      contents: Buffer.from('<svg><title>test title</title><desc>test description</desc></svg>'),
      path: '/test_base/test_path',
      base: '/test_base/',
      cwd: '/'
    });
    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

    expect(shape.title.toString()).toBe('<title>test title</title>');
    expect(shape.description.toString()).toBe('<desc>test description</desc>');
  });
});
