import { DOMParser } from '@xmldom/xmldom';
import XmlFixingError from '../errors/xml-fixing-error.js';

/**
 * @param {string} svgString    svg string to fix
 * @returns {string}            fixed svg string
 */
export default svgString => {
  let domParserError = false;

  // @xmldom/xmldom 0.9 replaced the `errorHandler` option with `onError`, and
  // silently ignores the old name — so this must stay `onError`, otherwise
  // malformed XML is never detected and this function stops throwing.
  const onError = () => {
    domParserError = true;
  };

  let fixedSVG;

  try {
    fixedSVG = new DOMParser({ onError })
      // 0.9 made the mimeType argument mandatory
      .parseFromString(svgString, 'text/xml')
      .toString()
      .replaceAll(/(\s)(\s+)/g, ' ');
  } catch {
    // 0.9 also throws a ParseError on fatal errors, on top of calling onError
    throw new XmlFixingError('Invalid XML string');
  }

  if (!domParserError) {
    return fixedSVG;
  }

  throw new XmlFixingError('Invalid XML string');
};
