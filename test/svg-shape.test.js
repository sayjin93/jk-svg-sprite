import { Buffer } from 'node:buffer';
import path from 'node:path';
import fs from 'node:fs';
import File from 'vinyl';
import { globSync } from 'node:fs';
import getShape from '../lib/core/shape.js';
import SVGSpriter from '../lib/index.js';
import fixXMLString from '../lib/core/utils/fix-xml-string.js';
import ArgumentError from '../lib/core/errors/argument-error.js';

// an ESM mock factory must return the module shape, not the export itself
vi.mock('../lib/core/utils/fix-xml-string.js', () => ({ default: vi.fn() }));

const TEST_SVG = `<svg viewBox="0 0
                                16 16"></svg>`;
const FIXED_TEST_SVG = '<svg viewBox="0 0 16 16"></svg>';

describe('testing SVGShape initialization', () => {
  let spriter;

  beforeEach(() => {
    spriter = new SVGSpriter({
      shape: {
        dest: 'svg'
      }
    });
  });

  it('should not throw an error and should call fixXMLString if fixXMLString is not throwing error', () => {
    expect.hasAssertions();

    fixXMLString.mockReturnValueOnce(FIXED_TEST_SVG);

    expect(() => {
      getShape(new File({
        path: import.meta.dirname,
        contents: Buffer.from(TEST_SVG)
      }), spriter);
    }).not.toThrow(ArgumentError);
    expect(fixXMLString).toHaveBeenCalledWith(TEST_SVG);
  });

  it('should throw error and should call fixXMLString if fixXMLString is throwing error', () => {
    expect.hasAssertions();

    fixXMLString.mockImplementation(() => {
      throw new Error('some error');
    });

    expect(() => {
      getShape(new File({
        path: import.meta.dirname,
        contents: Buffer.from(TEST_SVG)
      }), spriter);
    }).toThrow(new ArgumentError('Invalid SVG file'));
    expect(fixXMLString).toHaveBeenCalledWith(TEST_SVG);
  });

  it('should throw an error and should call fixXMLString on non-svg files', () => {
    expect.hasAssertions();

    const TEST_NON_SVG = '<div class="test">123</div>';

    expect(() => {
      getShape(new File({
        path: import.meta.dirname,
        contents: Buffer.from(TEST_NON_SVG)
      }), spriter);
    }).toThrow(ArgumentError);
    expect(fixXMLString).toHaveBeenCalledWith(TEST_NON_SVG);
  });

  it('should not throw an error and should not call fixXMLString on actual valid svg files', () => {
    expect.hasAssertions();

    const cwd = path.join(import.meta.dirname, 'fixture/svg/single');
    const weatherFiles = globSync('**/weather*.svg', { cwd });

    expect.assertions(weatherFiles.length * 2);

    for (const weatherFile of weatherFiles) {
      const svgFileBuffer = fs.readFileSync(path.join(cwd, weatherFile));

      expect(() => {
        getShape(new File({
          path: import.meta.dirname,
          contents: svgFileBuffer
        }), spriter);
      }).not.toThrow(ArgumentError);
      expect(fixXMLString).not.toHaveBeenCalled();
    }
  });
});
