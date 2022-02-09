import { html, ScopedElementsMixin } from '@lion/core';
import { localize } from '@lion/localize';
import { LionSelect } from '@lion/select';
import { LionFieldset } from '@lion/fieldset';
import { LionInputTel, LibPhoneNumberManager } from '@lion/input-tel';

/**
 * @typedef {import('../types/InputPhoneRenderData').InputPhoneRenderData} InputPhoneRenderData
 * @typedef {import('@lion/form-core/types/InteractionStateMixinTypes').InteractionStates} InteractionStates
 */

/**
 * @param {string} letter
 */
function getRegionalIndicatorSymbol(letter) {
  return String.fromCodePoint(0x1f1e6 - 65 + letter.toUpperCase().charCodeAt(0));
}

export class LionInputPhone extends ScopedElementsMixin(LionFieldset) {
  /** @type {any} */
  static get scopedElements() {
    return {
      'lion-input-tel': LionInputTel,
      'lion-select': LionSelect,
    };
  }

  constructor() {
    super();
    // @ts-ignore [allow-protected] within our own code base
    this.__langIso = localize._getLangFromLocale(localize.locale).toUpperCase();
  }

  async connectedCallback() {
    super.connectedCallback();
    await LibPhoneNumberManager.loadComplete;
    this.__renderLightContent();
  }

  __renderLightContent() {
    // Note that we render to light dom for accessibility
    const renderParent = document.createElement('div');
    // @ts-expect-error
    this.constructor.render(this._renderLightDom(), renderParent, {
      scopeName: this.localName,
      eventContext: this,
    });
    Array.from(renderParent.childNodes).forEach(childNode => {
      this.appendChild(/** @type {Node} */ (childNode));
    });
  }

  /**
   * @type {InputPhoneRenderData}
   */
  get _renderData() {
    /** @type {* & libphonenumber.PhoneNumberUtil} */
    const { phoneNumberUtil } = LibPhoneNumberManager;
    /** @type {string[]} */
    const countryCodes = phoneNumberUtil.getSupportedRegions();
    const initialCountryCode = this.modelValue.countryCode || this.__langIso;
    // @ts-expect-error
    return { data: { initialCountryCode, countryCodes, phoneNumberUtil } };
  }

  _renderLightDom() {
    return this._mainTemplate(this._renderData);
  }

  // TODO: use the spread directive once realized by Lit team
  // N.B. since we render to light dom, we accept inline styles for now.
  /**
   * @param {InputPhoneRenderData} renderData
   */
  _mainTemplate(renderData) {
    const { refs, data } = renderData;

    return html`
      <lion-select
        label-sr-only
        name="countryCode"
        label="Select country"
        style="${refs?.countryCode?.props?.style}"
        .modelValue="${data?.initialCountryCode}"
      >
        <select slot="input" style="${refs?.countryCodeNativeSelect?.props?.style}">
          <option selected hidden value="">Country</option>
          ${this._countryCodeOptionsTemplate(renderData)}
        </select>
      </lion-select>
      <lion-input-tel
        .countryCode="${data?.initialCountryCode}"
        .getFeedbackNodes="${() => this._feedbackNode}"
        label-sr-only
        name="phoneNumber"
        label="Phone number"
        style="${refs?.phoneNumber?.props?.style}"
      >
      </lion-input-tel>
    `;
  }

  /**
   * @param {InputPhoneRenderData} renderData
   */
  // eslint-disable-next-line class-methods-use-this
  _countryCodeOptionsTemplate(renderData) {
    const { data } = renderData;

    return html`
      ${data?.countryCodes.map(
        countryCode => html`
          <option value="${countryCode}">
            ${countryCode}
            ${getRegionalIndicatorSymbol(countryCode[0]) +
            getRegionalIndicatorSymbol(countryCode[1])}
            &nbsp; + ${data?.phoneNumberUtil.getCountryCodeForRegion(countryCode)}
          </option>
        `,
      )}
    `;
  }

  // /**
  //  * This method is run on
  //  * @param {string} modelValueNumberInput
  //  * @returns {string}
  //  */
  // _formatPhoneNumber(modelValueNumberInput) {
  //   const { modelValue } = /** @type {LionFieldset} */ (this._parentFormGroup);
  //   const langIso = this.modelValue.countryCode;

  //   if (
  //     langIso &&
  //     modelValue.countryCode &&
  //     modelValue?.numberInput?.length >= 4 &&
  //     modelValue?.numberInput?.length <= 16 &&
  //     phoneUtil.isValidNumberForRegion(
  //       phoneUtil.parse(modelValue.numberInput, modelValue.countryCode),
  //       modelValue.countryCode,
  //     )
  //   ) {
  //     return phoneUtil.formatInOriginalFormat(
  //       phoneUtil.parse(modelValue.numberInput, langIso),
  //       langIso,
  //     );
  //   }
  //   return modelValueNumberInput;
  // }

  /**
   * Makes sure that only the text input (not the country select) takes place in the computation
   * of interaction states + validity state of Required Validator
   * @override FormControlMixin
   */
  _isEmpty() {
    return !this.modelValue.numberInput;
  }

  // /**
  //  * Visibility of user feedback should be dependent on interaction with text field (not select)
  //  * @override InteractionStateMixin
  //  * @param {string} type
  //  * @param {InteractionStates} meta
  //  */
  // _showFeedbackConditionFor(type, meta) {
  //   return (
  //     (this.formElements.numberInput.touched && this.formElements.numberInput.dirty) ||
  //     meta.prefilled ||
  //     meta.submitted
  //   );
  // }

  // // Proxy the error visibility to parent
  // _showFeedbackConditionFor(type) {
  //   return this.formElements.phoneNumber.showsFeedbackFor.includes(type);
  // }
}
