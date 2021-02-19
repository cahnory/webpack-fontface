/* eslint-disable import/prefer-default-export */
import getRawTtfInfo from 'ttfinfo';

const FONT_FIELD_NAMES = [
  'copyright',
  'fontFamily',
  'fontSubFamily',
  'fontIdentifier',
  'fontName',
  'fontVersion',
  'postscriptName',
  'trademark',
  'manufacturer',
  'designer',
  'description',
  'vendorURL',
  'designerURL',
  'license',
  'licenseURL',
  'reserved',
  'preferredFamily',
  'preferredSubFamily',
  'compatibleFullName',
  'sampleText',
  'postScriptCIDfindfontName',
  'WWSFamilyName',
  'WWSSubFamilyName',
];

export default (content) =>
  new Promise((resolve, reject) =>
    getRawTtfInfo(content, (error, raw) => {
      if (error) {
        reject(error);
      } else {
        resolve(
          Object.entries(raw.tables.name).reduce((info, [index, value]) => {
            // eslint-disable-next-line no-param-reassign
            info[FONT_FIELD_NAMES[index] || index] = value;
            return info;
          }, {}),
        );
      }
    }),
  );
