import SVGSpriter from '../../../lib/index.js';

class TestError extends Error {}

describe('svg-sprite: errors', () => {
  let spriter;

  beforeEach(() => {
    spriter = new SVGSpriter({
      shape: {
        dest: 'svg'
      },
      mode: {
        symbol: true
      }
    });
    vi.spyOn(spriter, '_layout').mockImplementation((_, cb) => {
      cb(new TestError(), {}, {});
    });
  });

  it('should throw error if compilation has failed in async mode', async() => {
    expect.hasAssertions();
    await expect(async() => {
      await spriter.compileAsync();
    }).rejects.toThrow(TestError);
  });

  it('should throw error if compilation has failed in callback mode', async() => {
    expect.hasAssertions();

    // vitest removed jest's `done` callback, so the callback API is bridged
    // to a promise the test can await
    const error = await new Promise(resolve => {
      spriter.compile(resolve);
    });

    expect(error).toBeInstanceOf(TestError);
  });
});
