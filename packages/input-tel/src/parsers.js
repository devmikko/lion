import { LibPhoneNumberManager } from './LibPhoneNumberManager.js';

/**
 * @typedef {import('../types/types').RegionCode} RegionCode
 * @typedef {* & import('awesome-phonenumber').default} PhoneNumber
 */

/**
 * @param {string} viewValue
 * @param {{regionCode:RegionCode;}} options
 * @returns {string}
 */
export function parsePhoneNumber(viewValue, { regionCode }) {
  // Do not format when not loaded
  if (!LibPhoneNumberManager.isLoaded) {
    return viewValue;
  }

  // eslint-disable-next-line prefer-destructuring
  const PhoneNumber = /** @type {PhoneNumber} */ (LibPhoneNumberManager.PhoneNumber);

  let pn;
  try {
    pn = PhoneNumber(viewValue, regionCode);
    // eslint-disable-next-line no-empty
  } catch (_) {}

  if (pn) {
    return pn.getNumber('e164');
  }

  return viewValue;
}
