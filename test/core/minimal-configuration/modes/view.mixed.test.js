import path from 'node:path';
import fs from 'node:fs';
import mustache from 'mustache';
import { globSync } from 'node:fs';
import SVGSpriter from '../../../../lib/index.js';
import { addFixtureFiles } from '../../../helpers/add-files.js';
import writeFiles from '../../../helpers/write-files.js';
import writeFile from '../../../helpers/write-file.js';
import * as asyncRenderers from '../../../helpers/async-renderers.js';
import { paths } from '../../../helpers/constants.js';
import removeTmpPath from '../../../helpers/remove-temp-path.js';

const tmpPath = path.join(paths.tmp, 'view.mixed');

describe('svg-sprite: with «view» mode, packed layout and LESS render type', () => {
  let spriter;
  const cwdAlign = path.join(paths.fixtures, 'svg/css');
  const align = globSync('**/*.svg', { cwd: cwdAlign });
  const previewTemplate = fs.readFileSync(path.join(import.meta.dirname, '../../../tmpl/css.html'), 'utf8');
  let packedSvg;
  let data;

  beforeAll(async() => {
    await removeTmpPath(tmpPath);
    data = {};

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
        sprite: 'svg/view.packed.mixed.svg',
        layout: 'packed',
        dimensions: true,
        render: {
          less: {
            dest: 'sprite.mixed.less'
          }
        }
      }
    });
    writeFiles(result);
    data = cssData.view;
    packedSvg = path.basename(result.view.sprite.path);
  });

  it('creates visually correct sprite', async() => {
    expect.hasAssertions();

    const input = path.join(tmpPath, 'view/svg', packedSvg);
    const actual = fs.readFileSync(input, 'utf8');
    const expected = path.join(paths.expectations, 'png/css.packed.mixed.png');

    expect(actual).toMatchSnapshot();
    await expect(input).toBeVisuallyEqualTo(expected);
  });

  it('creates a visually correct stylesheet resource', async() => {
    expect.hasAssertions();

    const lessFile = path.join(tmpPath, 'view/sprite.mixed.less');
    const lessText = fs.readFileSync(lessFile, 'utf8');
    const output = await asyncRenderers.less(lessText, {});

    await writeFile(path.join(tmpPath, 'view/sprite.mixed.less.css'), output.css);

    data.css = '../sprite.mixed.less.css';

    const out = mustache.render(previewTemplate, data);
    const preview = await writeFile(path.join(tmpPath, 'view/html/less.packed.mixed.html'), out);
    const expected = path.join(paths.expectations, 'png/css.packed.aligned.html.png');

    await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
  });
});
