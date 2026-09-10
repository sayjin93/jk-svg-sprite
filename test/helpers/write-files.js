import fs from 'node:fs';
import path from 'node:path';
import File from 'vinyl';
import { isObject } from '../../lib/core/utils/index.js';

/**
 * Recursively write files to disc
 *
 * @param {object | Array} files      Files
 * @returns {number}                  Number of written files
 */
export default function writeFiles(files) {
  let written = 0;
  for (const file of Object.values(files)) {
    if (isObject(file) || Array.isArray(file)) {
      if (file.constructor === File) {
        fs.mkdirSync(path.dirname(file.path), { recursive: true });
        fs.writeFileSync(file.path, file.contents);
        ++written;
      } else {
        written += writeFiles(file);
      }
    }
  }

  return written;
};
