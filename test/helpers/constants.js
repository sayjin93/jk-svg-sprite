import path from 'node:path';

export const paths = {
  tmp: path.resolve(path.join(import.meta.dirname, '../../tmp')),
  fixtures: path.resolve(path.join(import.meta.dirname, '../fixture')),
  expectations: path.resolve(path.join(import.meta.dirname, '../expected'))
};

export const browser = {
  width: 1280,
  height: 1024
};
