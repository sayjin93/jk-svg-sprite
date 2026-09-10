import path from 'node:path';
import { globSync } from 'node:fs';
import { paths } from './constants.js';

const cwdWeather = path.join(paths.fixtures, 'svg/single');
const cwdWithoutDims = path.join(paths.fixtures, 'svg/special/without-dims');
const weather = globSync('**/weather*.svg', { cwd: cwdWeather });
const withoutDims = globSync('**/*.svg', { cwd: cwdWithoutDims });

export const constants = {
  DEFAULT: {
    name: 'weather',
    namespace: '',
    files: weather,
    cwd: cwdWeather
  },
  WITHOUT_DIMS: {
    name: 'without-dims',
    namespace: '-without-dims',
    files: withoutDims,
    cwd: cwdWithoutDims
  }

};

export default [constants.DEFAULT, constants.WITHOUT_DIMS];
