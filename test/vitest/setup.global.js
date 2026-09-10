import removeTmpPath from '../helpers/remove-temp-path.js';

export default async() => {
  await removeTmpPath();
};
