import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import convertSvg2Png from './convert-svg-2-png.js';
import comparePng2Png from './compare-png-2-png.js';

/**
 * Rasterize an SVG file and compare it to an expected image
 *
 * @param {string} svg                SVG file path
 * @param {string} png                PNG file path
 * @param {string} expected           Expected PNG file path
 */
export default async(svg, png, expected) => {
  await mkdir(path.dirname(png), { recursive: true });
  await convertSvg2Png(svg, png);

  return comparePng2Png(png, expected);
};
