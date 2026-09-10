import { rm } from 'node:fs/promises';
import { paths } from './constants.js';

/**
 * Removing tempPath for tests
 *
 * @param {string} pathName path
 * @returns {Promise<void>}
 */
export default async(pathName = paths.tmp) => {
  await rm(pathName, { force: true, recursive: true });
};
