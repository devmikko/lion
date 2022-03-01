import { Validator } from '@lion/form-core';
import { LibPhoneNumberManager } from './LibPhoneNumberManager.js';

/**
 * @typedef {import('../types/types').RegionCode} RegionCode
 * @typedef {* & import('awesome-phonenumber').default} PhoneNumber
 */

/**
 * @param {string} modelValue telephone number without country prefix
 * @param {RegionCode} regionCode
 */
function hasFeedback(modelValue, regionCode) {
  // eslint-disable-next-line prefer-destructuring
  const PhoneNumber = /** @type {PhoneNumber} */ (LibPhoneNumberManager.PhoneNumber);

  if (regionCode && modelValue?.length >= 4 && modelValue?.length <= 16) {
    let isInvalidForRegion = true;
    try {
      const pn = PhoneNumber(modelValue, regionCode);
      isInvalidForRegion = !pn.isValid();
      // eslint-disable-next-line no-empty
    } catch (_) {}
    // return true if invalid
    return isInvalidForRegion;
  }

  return true;
}

export class IsPhoneNumber extends Validator {
  static get validatorName() {
    return 'IsPhoneNumber';
  }

  static get async() {
    // Will be run as async the first time if LibPhoneNumberManager hasn't loaded yet, sync afterwards
    return !LibPhoneNumberManager.isLoaded;
  }

  /**
   * @param {string} modelValue telephone number without country prefix
   * @param {RegionCode} regionCode
   */
  // eslint-disable-next-line class-methods-use-this
  execute(modelValue, regionCode) {
    if (!LibPhoneNumberManager.isLoaded) {
      // Return a Promise once not loaded yet. Since async Validators are meant for things like
      // loading server side data (in this case a lib), we continue as a sync Validator once loaded
      return new Promise(resolve => {
        LibPhoneNumberManager.loadComplete.then(() => {
          resolve(hasFeedback(modelValue, regionCode));
        });
      });
    }
    return hasFeedback(modelValue, regionCode);
  }

  // TODO: add a file for loadDefaultMessages
  static async getMessage() {
    return 'Not a valid phone number';
  }
}
