import path from 'node:path';
import { readFile } from 'node:fs/promises';
import mustache from 'mustache';
import writeFiles from '../../../helpers/write-files.js';
import writeFile from '../../../helpers/write-file.js';
import SVGSpriter from '../../../../lib/index.js';
import { addFixtureFiles } from '../../../helpers/add-files.js';
import { paths } from '../../../helpers/constants.js';
import removeTmpPath from '../../../helpers/remove-temp-path.js';
import { constants } from '../../../helpers/test-configs.js';

describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
`('svg-sprite: $name: «symbol» mode', ({ testConfigKey }) => {
  const testConfig = constants[testConfigKey];

  const tmpPath = path.join(paths.tmp, `view${testConfig.namespace}.packed`);
  let spriter;
  let svg;
  let data;

  beforeAll(removeTmpPath.bind(null, tmpPath));

  // Test the view mode
  describe(`svg-sprite: ${testConfig.name} in «view» mode`, () => {
    beforeAll(async() => {
      data = {};
      spriter = new SVGSpriter({ dest: tmpPath });
      addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
      const { result, data: cssData } = await spriter.compileAsync({
        view: {
          sprite: `svg/view.packed${testConfig.namespace}.svg`,
          layout: 'packed',
          dimensions: '-dims',
          render: {
            css: true
          }
        }
      });
      writeFiles(result);
      data = cssData.view;
      svg = path.basename(result.view.sprite.path);
    });

    // Packed layout
    it('creates visually correct sprite with packed layout', async() => {
      expect.hasAssertions();

      const input = path.join(tmpPath, 'view/svg', svg);
      const actual = await readFile(input, 'utf8');
      const expected = path.join(paths.expectations, `png/css.packed${testConfig.namespace}.png`);

      expect(actual).toMatchSnapshot();
      await expect(input).toBeVisuallyEqualTo(expected);
    });

    it('creates a visually correct stylesheet resource in CSS format', async() => {
      expect.hasAssertions();

      data.css = '../sprite.css';

      const previewTemplate = await readFile(path.join(import.meta.dirname, '../../../tmpl/view.html'), 'utf8');
      const out = mustache.render(previewTemplate, data);
      const preview = await writeFile(path.join(tmpPath, 'view/html/view.html'), out);
      const expected = path.join(paths.expectations, `png/view.html${testConfig.namespace}.png`);

      await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
  });
});
