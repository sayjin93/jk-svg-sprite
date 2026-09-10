import path from 'node:path';
import fs from 'node:fs';
import mustache from 'mustache';
import sass from 'sass';
import { globSync } from 'node:fs';
import SVGSpriter from '../../../lib/index.js';
import { addFixtureFiles } from '../../helpers/add-files.js';
import writeFiles from '../../helpers/write-files.js';
import writeFile from '../../helpers/write-file.js';
import removeTmpPath from '../../helpers/remove-temp-path.js';
import { paths } from '../../helpers/constants.js';

const cwdAlign = path.join(paths.fixtures, 'svg/css');
const align = globSync('**/*.svg', { cwd: cwdAlign });
const previewTemplate = fs.readFileSync(path.join(import.meta.dirname, '../../tmpl/css.html'), 'utf8');

const tmpPath = path.join(paths.tmp, 'mixed');

describe(`svg-sprite: with mixed alignment and ${align.length} SVG files`, () => {
  beforeAll(removeTmpPath.bind(null, tmpPath));

  describe('with «view» mode, vertical layout and CSS render type', () => {
    let spriter = null;
    let data = null;
    let svgPath = null;

    beforeAll(async() => {
      spriter = new SVGSpriter({
        dest: tmpPath,
        shape: {
          align: path.join(paths.fixtures, 'yaml/align.mixed.yaml'),
          dimension: {
            maxWidth: 200,
            maxHeight: 200
          }
        }
      });
      addFixtureFiles(spriter, align, cwdAlign);
      const { result, data: cssData } = await spriter.compileAsync({
        view: {
          sprite: 'svg/view.vertical.mixed.svg',
          layout: 'vertical',
          dimensions: true,
          render: {
            css: {
              dest: 'sprite.mixed.css'
            }
          }
        }
      });
      writeFiles(result);
      data = cssData.view;
      svgPath = path.basename(result.view.sprite.path);
    });

    it('creates visually correct sprite', async() => {
      expect.hasAssertions();

      const input = path.join(tmpPath, 'view/svg', svgPath);
      const actual = fs.readFileSync(input, 'utf8');
      const expected = path.join(paths.expectations, 'png/css.vertical.mixed.png');

      expect(actual).toMatchSnapshot();
      await expect(input).toBeVisuallyEqualTo(expected);
    });

    it('creates a visually correct stylesheet resource', async() => {
      expect.hasAssertions();

      data.css = '../sprite.mixed.css';

      const out = mustache.render(previewTemplate, data);
      const preview = await writeFile(path.join(tmpPath, 'view/html/css.vertical.mixed.html'), out);
      const expected = path.join(paths.expectations, 'png/css.vertical.mixed.html.png');

      await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
  });

  describe('with «view» mode, horizontal layout and Sass render type', () => {
    let spriter = null;
    let data = null;
    let svgPath = null;

    beforeAll(async() => {
      spriter = new SVGSpriter({
        dest: tmpPath,
        shape: {
          align: path.join(paths.fixtures, 'yaml/align.mixed.yaml'),
          dimension: {
            maxWidth: 200,
            maxHeight: 200
          },
          dest: 'shapes'
        },
        svg: {
          namespaceIDs: true
        }
      });
      addFixtureFiles(spriter, align, cwdAlign);
      const { result, data: cssData } = await spriter.compileAsync({
        view: {
          sprite: 'svg/view.horizontal.mixed.svg',
          layout: 'horizontal',
          dimensions: true,
          render: {
            scss: {
              dest: 'sprite.mixed.scss'
            }
          }
        }
      });
      writeFiles(result);
      data = cssData.view;
      svgPath = path.basename(result.view.sprite.path);
    });

    it('creates visually correct sprite', async() => {
      expect.hasAssertions();

      const input = path.join(tmpPath, 'view/svg', svgPath);
      const actual = fs.readFileSync(input, 'utf8');
      const expected = path.join(paths.expectations, 'png/css.horizontal.mixed.png');

      expect(actual).toMatchSnapshot();
      await expect(input).toBeVisuallyEqualTo(expected);
    });

    it('creates a visually correct stylesheet resource', async() => {
      expect.hasAssertions();

      const scssText = sass.renderSync({ file: path.join(tmpPath, 'view/sprite.mixed.scss') });
      await writeFile(path.join(tmpPath, 'view/sprite.mixed.scss.css'), scssText.css);

      data.css = '../sprite.mixed.scss.css';

      const out = mustache.render(previewTemplate, data);
      const preview = await writeFile(path.join(tmpPath, 'view/html/scss.horizontal.mixed.html'), out);
      const expected = path.join(paths.expectations, 'png/css.horizontal.mixed.html.png');

      await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
  });
});
