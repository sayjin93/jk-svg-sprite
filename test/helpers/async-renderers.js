import stylusModule from 'stylus';
import lessModule from 'less';

/**
 * Promisified Stylus renderer.
 *
 * @param {...any} args   Arguments forwarded to `stylus.render`.
 * @returns {Promise<any>}   Rendered result.
 */
export async function stylus(...args) {
  return new Promise((resolve, reject) => {
    stylusModule.render(...args, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}

/**
 * Promisified LESS renderer.
 *
 * @param {...any} args   Arguments forwarded to `less.render`.
 * @returns {Promise<any>}   Rendered result.
 */
export async function less(...args) {
  return new Promise((resolve, reject) => {
    lessModule.render(...args, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
}
