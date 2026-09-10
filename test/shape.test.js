import { Buffer } from 'node:buffer';
import path from 'node:path';
import { DOMParser } from '@xmldom/xmldom';
import SVGSpriter from '../lib/index.js';
import calculateSvgDimensions from '../lib/core/utils/calculate-svg-dimensions.js';

vi.mock('../lib/core/utils/calculate-svg-dimensions.js');

const expectations = [{
  svg: '46x46.svg',
  result: {
    width: 46,
    height: 46
  }
}, {
  svg: '2048x2048.svg',
  result: {
    width: 2048,
    height: 2048
  }
}];

const TEST_SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

describe('testing shapes', () => {
  it.each`
            svg                    | dimension
            ${expectations[0].svg} | ${expectations[0].result}
            ${expectations[1].svg} | ${expectations[1].result}
        `('should call calculateSvgDimensions if the $svg does not contain viewBox or height/width properties ($dimension)', async({
    svg, dimension
  }) => {
    expect.hasAssertions();

    const spriter = new SVGSpriter({
      shape: {
        dest: 'svg',
        dimension: {
          maxWidth: 4000,
          maxHeight: 4000
        }
      }
    });

    calculateSvgDimensions.mockReturnValueOnce(dimension);

    const svgFilePath = path.join(import.meta.dirname, `fixture/svg/special/without-dims/${svg}`);

    spriter.add(svgFilePath, svg, Buffer.from(TEST_SVG));

    expect(calculateSvgDimensions).toHaveBeenCalledWith(
      new DOMParser().parseFromString(`<?xml version="1.0" encoding="utf-8"?>${TEST_SVG}`, 'text/xml').toString()
    );

    const { result } = await spriter.compileAsync();

    expect(result).toBeInstanceOf(Object);
    expect(result.shapes).toBeInstanceOf(Array);

    const dom = new DOMParser().parseFromString(result.shapes[0]._contents.toString(), 'text/xml');

    expect(dom.documentElement.getAttribute('height')).toBe(dimension.height.toString());
    expect(dom.documentElement.getAttribute('width')).toBe(dimension.width.toString());
  });
});
