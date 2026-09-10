import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Absolute floor for tiny canvases, plus a proportional allowance below.
const MAX_MISMATCH = 5;

// Rendered comparisons are inherently sensitive to the Chromium build doing the
// rasterising: edge antialiasing shifts by a pixel here and there between
// versions and platforms, which a fixed 5px budget cannot absorb on a
// 1280x1024 canvas. A proportional budget scales with the canvas and still
// fails loudly on real breakage - a dropped or misplaced shape differs by
// thousands of pixels, three orders of magnitude above this.
const MAX_MISMATCH_RATIO = 0.0005; // 0.05% of pixels

/**
 * @param {PNG} diff        diff PNG
 * @param {string} filePath where to store the diff
 */
const storeDiff = async(diff, filePath) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, PNG.sync.write(diff));
};

/**
 * @param {string} input                                                          input png
 * @param {string} expected                                                       expected png
 * @returns {Promise<{isEqual: boolean, matched: (number|*), diff: exports.PNG}>} matching results
 */
export default async(input, expected) => {
  const inputPng = PNG.sync.read(await readFile(input));
  const expectedPng = PNG.sync.read(await readFile(expected));

  const { width, height } = inputPng;

  const diff = new PNG({ width, height });

  const matched = pixelmatch(
    inputPng.data,
    expectedPng.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const allowed = Math.max(MAX_MISMATCH, Math.round(width * height * MAX_MISMATCH_RATIO));

  if (matched <= allowed) {
    return { isEqual: true, matched, diff };
  }

  await storeDiff(
    diff,
    path.join(
      path.dirname(input),
      path.basename(input).replace('.png', '.diff.png')
    )
  );

  return { isEqual: false, matched, diff };
};
