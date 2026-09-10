import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {string} file               File
 * @param {string} content            Content
 * @returns {string}                  File
 */
export default async(file, content) => {
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
    return file;
  } catch {
    return null;
  }
};
