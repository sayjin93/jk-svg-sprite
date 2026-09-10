/**
 * jk-svg-sprite is a Node.js module for creating SVG sprites
 *
 * @see https://github.com/sayjin93/jk-svg-sprite
 * @license MIT https://github.com/sayjin93/jk-svg-sprite/blob/main/LICENSE
 */

/**
 * Wrap a callback so that it can only ever be invoked once.
 *
 * @param {Function} fn   Callback to guard.
 * @returns {Function}    Guarded callback.
 */
function once(fn) {
  let called = false;
  return function(...args) {
    if (called) {
      return;
    }

    called = true;
    fn.apply(this, args);
  };
}

/**
 * Wrap a callback so that invoking it more than once throws, matching
 * `async`'s `onlyOnce` guard which surfaces double-callback bugs in tasks.
 *
 * @param {Function} fn   Callback to guard.
 * @returns {Function}    Guarded callback.
 */
function onlyOnce(fn) {
  let callFn = fn;
  return function(...args) {
    if (callFn === null) {
      throw new Error('Callback was already called.');
    }

    const fnToCall = callFn;
    callFn = null;
    fnToCall.apply(this, args);
  };
}

/**
 * Run an array of tasks in series, passing each task's results to the next.
 *
 * Drop-in replacement for `async.waterfall`.
 *
 * @param {Array<Function>} tasks   Tasks, each called with the previous task's results plus a callback.
 * @param {Function} [callback]     Called with the first error, or the final task's results.
 */
export function waterfall(tasks, callback = () => {}) {
  const done = once(callback);

  if (!Array.isArray(tasks)) {
    done(new TypeError('First argument to waterfall must be an array of functions'));
    return;
  }

  if (tasks.length === 0) {
    done();
    return;
  }

  let taskIndex = 0;

  const nextTask = args => {
    const task = tasks[taskIndex++];
    task(...args, onlyOnce(next));
  };

  function next(error, ...args) {
    // `async` treats an explicit `false` error as "cancel silently"
    if (error === false) {
      return;
    }

    if (error || taskIndex === tasks.length) {
      done(error, ...args);
      return;
    }

    nextTask(args);
  }

  nextTask([]);
}

/**
 * Run an array of tasks in parallel, with at most `limit` in flight at once.
 *
 * Drop-in replacement for `async.parallelLimit`. Results are collected into an
 * array positionally, and a task reporting a single result has it unwrapped
 * (rather than stored as a one-element array), exactly as `async` does.
 *
 * @param {Array<Function>} tasks   Tasks, each called with a callback.
 * @param {number} limit            Maximum concurrency.
 * @param {Function} [callback]     Called with the first error, or all results.
 */
export function parallelLimit(tasks, limit, callback = () => {}) {
  const done = once(callback);
  const results = [];

  if (!Array.isArray(tasks)) {
    done(new TypeError('First argument to parallelLimit must be an array of functions'));
    return;
  }

  if (limit <= 0) {
    throw new RangeError('concurrency limit cannot be less than 1');
  }

  if (tasks.length === 0) {
    done(null, results);
    return;
  }

  let nextIndex = 0;
  let running = 0;
  let finished = false;
  let looping = false;

  const taskCallback = error => {
    running -= 1;

    if (error) {
      finished = true;
      done(error, results);
      return;
    }

    if (finished && running <= 0) {
      done(null, results);
      return;
    }

    if (!looping) {
      replenish();
    }
  };

  function replenish() {
    looping = true;

    while (running < limit && !finished) {
      if (nextIndex >= tasks.length) {
        finished = true;

        if (running <= 0) {
          done(null, results);
        }

        looping = false;
        return;
      }

      const key = nextIndex++;
      const task = tasks[key];
      running += 1;

      task(onlyOnce((error, ...result) => {
        results[key] = result.length < 2 ? result[0] : result;
        taskCallback(error);
      }));
    }

    looping = false;
  }

  replenish();
}
