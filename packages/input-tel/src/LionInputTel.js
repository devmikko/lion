import { localize } from '@lion/localize';
import { LionInput } from '@lion/input';
import { LibPhoneNumberManager } from './LibPhoneNumberManager.js';
import { formatPhoneNumberAsYouType } from './preprocessors.js';
import { formatPhoneNumber } from './formatters.js';
import { parsePhoneNumber } from './parsers.js';
import { IsPhoneNumber } from './validators.js';

/**
 * @typedef {import('../types/types').FormatStrategy} FormatStrategy
 * @typedef {import('../types/types').RegionCode} RegionCode
 * @typedef {* & import('awesome-phonenumber').default} PhoneNumber
 */

export class LionInputTel extends LionInput {
  /**
   * @configure LitElement
   */
  static properties = {
    regionCode: { type: String, attribute: 'region-code' },
    formatStategy: { type: String, attribute: 'format-strategy' },
    autoFormat: { type: Boolean, attribute: 'auto-format' },
    _phoneNumberUtil: { type: Object, state: true },
    _needsLightDomRender: { type: Number, state: true },
    _derivedRegionCode: { type: String, state: true },
  };

  /**
   * @property regionCode
   * @type {string}
   */
  get regionCode() {
    return this.__regionCode || this._derivedRegionCode || this.__langIso;
  }

  set regionCode(newValue) {
    const oldValue = this.regionCode;
    this.__regionCode = newValue;
    this.requestUpdate('regionCode', oldValue);
  }

  /**
   * @property _phoneNumberUtilLoadComplete
   * @protected
   * @type {Promise<PhoneNumber>}
   */
  // eslint-disable-next-line class-methods-use-this
  get _phoneNumberUtilLoadComplete() {
    return LibPhoneNumberManager.loadComplete;
  }

  /**
   * @lifecycle platform
   */
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
     * When not provided, will be derived from provided phone number text
     * @type {RegionCode|''}
     */
    this.regionCode = '';

    // TODO: make this more generic: discriminate between 'live formatters'(meant for autoFormat),
    // 'regular formatters' and 'regular preprocessors' (meant for filtering out certain chars)
    /**
     * Automatically formats code while typing. It smartly updates the
     * caret position for best UX.
     * @type {boolean}
     */
    this.autoFormat = false;

    /**
     * @protected
     * @type {RegionCode|''}
     * The region code that's derived from international phone numbers typed by the user
     */
    this._derivedRegionCode = '';

    /** @private */
    // @ts-ignore [allow-protected] within our own code base
    this.__langIso = localize._getLangFromLocale(localize.locale).toUpperCase();

    /** @private */
    this.__isPhoneNumberValidatorInstance = new IsPhoneNumber();
    /**  @configures ValidateMixin */
    this.defaultValidators.push(this.__isPhoneNumberValidatorInstance);

    // Expose awesome-phonenumber lib for Subclassers
    /**
     * @protected
     * @type {PhoneNumber|null}
     */
    this._phoneNumberUtil = LibPhoneNumberManager.isLoaded
      ? /** @type {PhoneNumber} */ (LibPhoneNumberManager.PhoneNumber)
      : null;

    /**
     * Helper that triggers a light dom render aligned with update loop.
     * TODO: combine with render fn of SlotMixin
     * @protected
     * @type {number}
     */
    this._needsLightDomRender = 0;

    if (!LibPhoneNumberManager.isLoaded) {
      LibPhoneNumberManager.loadComplete.then(() => {
        this._onPhoneNumberUtilReady();
      });
    }
  }

  /**
   * @lifecycle platform
   */
  connectedCallback() {
    super.connectedCallback();
    // Make sure we provide the correct regionCode at the right moment:
    // before `.validate` is called by ValidateMixin
    this.__isPhoneNumberValidatorInstance.param = this.regionCode;
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);

    if (changedProperties.has('modelValue')) {
      this.__calculateDerivedRegionCode();
    }
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    // This will trigger the right keyboard on mobile
    this._inputNode.inputMode = 'tel';
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('regionCode')) {
      // Make sure new modelValue is computed, but prevent formattedValue from being set when focused
      this.__isUpdatingRegionWhileFocused = this.focused;
      this._calculateValues({ source: 'formatted' });
      this.__isUpdatingRegionWhileFocused = false;

      this.__isPhoneNumberValidatorInstance.param = this.regionCode;
    }
  }

  /**
   * @configure FormatMixin
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
   * @configure FormatMixin
   * @param {string} viewValue a phone number without (or with) country code, like '06 12345678'
   * @returns {string} a trimmed phone number with country code, like '+31612345678'
   */
  parser(viewValue) {
    return parsePhoneNumber(viewValue, {
      regionCode: /** @type {RegionCode} */ (this.regionCode),
    });
  }

  /**
   * @configure FormatMixin
   * @param {string} viewValue
   * @param {object} options
   * @param {string} options.prevViewValue
   * @param {number} options.currentCaretIndex
   * @returns {{ viewValue:string; caretIndex:number;  }|string}
   */
  preprocessor(viewValue, { currentCaretIndex, prevViewValue }) {
    if (!this.autoFormat) {
      return viewValue;
    }
    // console.log('preprocessor', viewValue);
    return formatPhoneNumberAsYouType(viewValue, {
      regionCode: /** @type {RegionCode} */ (this.regionCode),
      formatStrategy: this.formatStrategy,
      currentCaretIndex,
      prevViewValue,
    });
  }

  /**
   * @protected
   */
  _onPhoneNumberUtilReady() {
    // This should trigger a rerender in shadow dom
    this._phoneNumberUtil = /** @type {PhoneNumber} */ (LibPhoneNumberManager.PhoneNumber);
    // This should trigger a rerender in light dom
    this._scheduleLightDomRender();
    // Format when libPhoneNumber is loaded
    this._calculateValues({ source: null });
    this.__calculateDerivedRegionCode();
  }

  /**
   * This allows to hook into the update hook
   * @protected
   */
  _scheduleLightDomRender() {
    this._needsLightDomRender += 1;
  }

  /**
   * @private
   */
  __calculateDerivedRegionCode() {
    this._derivedRegionCode = this._phoneNumberUtil
      ? this._phoneNumberUtil(this.value).getRegionCode()
      : '';
  }
}
