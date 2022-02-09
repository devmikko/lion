import { localize } from '@lion/localize';
import { LionInput } from '@lion/input';
import { LibPhoneNumberManager } from './LibPhoneNumberManager.js';
import { formatPhoneNumber } from './formatters.js';
import { parsePhoneNumber } from './parsers.js';
import { IsPhoneNumber } from './validators.js';

/**
 * @typedef {import('../types/types').FormatStrategy} FormatStrategy
 * @typedef {import('../types/types').RegionCode} RegionCode
 * @typedef {* & import('awesome-phonenumber').default} PhoneNumber
 */

export class LionInputTel extends LionInput {
  static get properties() {
    return {
      regionCode: { type: String, attribute: 'region-code' },
      formatStategy: { type: String, attribute: 'format-strategy' },
    };
  }

  constructor() {
    super();

    /**
     * Determines what the formatter output should look like.
     * Formatting strategies as provided by google-libphonenumber
     * See: https://www.npmjs.com/package/google-libphonenumber
     * @type {FormatStrategy}
     */
    this.formatStrategy = 'national';

    /**
     * Supported countries/regions as provided via
     * `libphonenumber.PhoneNumberUtil.getInstance().getSupportedRegions()`
     * @type {RegionCode|''}
     */
    this.regionCode = '';

    this.__isPhoneNumberValidatorInstance = new IsPhoneNumber();
    this.defaultValidators.push(this.__isPhoneNumberValidatorInstance);
    // @ts-ignore [allow-protected] within our own code base
    this.__langIso = localize._getLangFromLocale(localize.locale).toUpperCase();

    if (!LibPhoneNumberManager.isLoaded) {
      LibPhoneNumberManager.loadComplete.then(() => {
        // Format when libPhoneNumber is loaded
        this._calculateValues({ source: null });
      });
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // Make sure we provide the correct regionCode at the right moment:
    // before `.validate` is called by ValidateMixin
    this.__isPhoneNumberValidatorInstance.param = this.regionCode;
  }

  /** @type {string} */
  get regionCode() {
    return this.__regionCode || this.__derivedRegionCode || this.__langIso;
  }

  get __derivedRegionCode() {
    if (!LibPhoneNumberManager.isLoaded) {
      return '';
    }
    // eslint-disable-next-line prefer-destructuring
    const PhoneNumber = /** @type {PhoneNumber} */ (LibPhoneNumberManager.PhoneNumber);
    return PhoneNumber(this.modelValue).getRegionCode();
  }

  /** @type {string} */
  set regionCode(newValue) {
    const oldValue = this.regionCode;
    this.__regionCode = newValue;
    this.requestUpdate('regionCode', oldValue);
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    this._inputNode.inputMode = 'tel';
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('regionCode')) {
      this._calculateValues({ source: null });
      this.__isPhoneNumberValidatorInstance.param = this.regionCode;
    }
  }

  /**
   * @param {string} modelValue
   * @returns {string}
   */
  formatter(modelValue) {
    return formatPhoneNumber(modelValue, {
      regionCode: /** @type {RegionCode} */ (this.regionCode),
      formatStrategy: this.formatStrategy,
    });
  }

  /**
   * @param {string} viewValue a phone number without (or with) country code, like '06 12345678'
   * @returns {string} a trimmed phone number with country code, like '+31612345678'
   */
  parser(viewValue) {
    return parsePhoneNumber(viewValue, {
      regionCode: /** @type {RegionCode} */ (this.regionCode),
    });
  }
}
