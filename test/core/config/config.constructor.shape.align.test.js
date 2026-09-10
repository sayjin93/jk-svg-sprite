import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import * as yaml from 'js-yaml';
import SVGSpriterConfig from '../../../lib/core/config.js';

vi.mock('node:fs');
vi.mock('js-yaml');

describe('testing SVGSpriterConfig shape.align', () => {
  const DEFAULT_ALIGN = { '*': { '%s': 0 } };

  it('should set default object if align is not provided', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({});

    expect(config.shape.align).toStrictEqual(DEFAULT_ALIGN);
  });

  it('should set default object if passed anything but string', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({ shape: { align: true } });

    expect(config.shape.align).toStrictEqual(DEFAULT_ALIGN);
  });

  describe('if string passed', () => {
    it('should check stat if passed path to the file', () => {
      expect.hasAssertions();

      vi.spyOn(fs, 'lstatSync');
       
      new SVGSpriterConfig({ shape: { align: '.' } });

      expect(fs.lstatSync).toHaveBeenCalledWith(path.resolve('.'));
    });

    it('should set default object if stat is not a file', () => {
      expect.hasAssertions();

      vi.spyOn(fs, 'lstatSync').mockReturnValueOnce({
        isSymbolicLink: vi.fn().mockReturnValueOnce(false),
        isFile: vi.fn().mockReturnValueOnce(false)
      });

      const config = new SVGSpriterConfig({ shape: { align: '.' } });

      expect(config.shape.align).toStrictEqual(DEFAULT_ALIGN);
    });

    it('should set expected object read from correct yaml if stat is a file', () => {
      expect.hasAssertions();

      const TEST_FILE_NAME = 'TEST_FILE_NAME';
      const TEST_FILE_CONTENTS = Buffer.from('some kind of file');
      const TEST_ALIGN = {
        [TEST_FILE_NAME]: {
          TEST: 1,
          TEST_2: 2,
          TEST_3: 0,
          '%sTEST_4': 0,
          '': 1
        },
        SOME: true,
        SOMETHIHG_ELSE: 'test'
      };

      vi.spyOn(fs, 'lstatSync').mockReturnValueOnce({
        isSymbolicLink: vi.fn().mockReturnValueOnce(false),
        isFile: vi.fn().mockReturnValueOnce(true)
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(TEST_FILE_CONTENTS);
      vi.mocked(yaml.load).mockReturnValueOnce(TEST_ALIGN);

      const config = new SVGSpriterConfig({ shape: { align: '.' } });

      expect(yaml.load).toHaveBeenCalledWith(TEST_FILE_CONTENTS);
      expect(config.shape.align).toStrictEqual({
        ...DEFAULT_ALIGN,
        [path.join(path.dirname(TEST_FILE_NAME), path.basename(TEST_FILE_NAME, '.svg'))]: {
          '%sTEST': 1,
          '%sTEST_2': 1,
          '%sTEST_3': 0,
          '%sTEST_4': 0,
          '%s': 1
        }
      });
    });

    it('should follow symlink', () => {
      expect.hasAssertions();

      const TEST_DEST = '.';

      vi.spyOn(fs, 'readlinkSync').mockReturnValueOnce(TEST_DEST);
      vi.spyOn(fs, 'statSync').mockReturnValueOnce({
        isFile: vi.fn().mockReturnValueOnce(false)
      });

      vi.spyOn(fs, 'lstatSync').mockReturnValueOnce({
        isSymbolicLink: vi.fn().mockReturnValueOnce(true)
      });

       
      new SVGSpriterConfig({ shape: { align: '.' } });

      expect(fs.readlinkSync).toHaveBeenCalledWith(path.resolve('.'));
      expect(fs.statSync).toHaveBeenCalledWith(TEST_DEST);
    });
  });
});
