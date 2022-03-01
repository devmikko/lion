import { render, html, css, ref, createRef } from '@lion/core';
import { Unparseable } from '@lion/form-core';
import { LocalizeMixin, localize } from '@lion/localize';
import { LionInputTel } from './LionInputTel.js';

/**
 * Note: one could consider to implement LionInputTelDropdown as a
 * [combobox](https://www.w3.org/TR/wai-aria-practices-1.2/#combobox).
 * However, the country dropdown does not directly set the textbox value, it only determines
 * its region code. Therefore it does not comply to this criterium:
 * "A combobox is an input widget with an associated popup that enables users to select a value for
 * the combobox from a collection of possible values. In some implementations,
 * the popup presents allowed values, while in other implementations, the popup presents suggested
 * values, and users may either select one of the suggestions or type a value".
 * We therefore decided to consider the dropdown a helper mechanism that does not set, but
 * contributes to and helps format and validate the actual value.
 */

/**
 * @typedef {import('lit/directives/ref.js').Ref} Ref
 * @typedef {import('@lion/core').RenderOptions} RenderOptions
 * @typedef {import('../types/types').FormatStrategy} FormatStrategy
 * @typedef {import('../types/types').TemplateDataForDropdownInputTel} TemplateDataForDropdownInputTel
 * @typedef {import('../types/types').RegionMeta} RegionMeta
 * @typedef {* & import('awesome-phonenumber').default} PhoneNumber
 * @typedef {import('@lion/select-rich').LionSelectRich} LionSelectRich
 * @typedef {import('@lion/overlays').OverlayController} OverlayController
 * @typedef {TemplateDataForDropdownInputTel & {data: {regionMetaList:RegionMeta[]}}} TemplateDataForIntlInputTel
 */

// eslint-disable-next-line prefer-destructuring
/**
 * @param {string} char
 */
function getRegionalIndicatorSymbol(char) {
  return String.fromCodePoint(0x1f1e6 - 65 + char.toUpperCase().charCodeAt(0));
}

/**
 * LionInputTelDropdown renders a dropdown like element next to the text field, inside the
 * prefix slot. This could be a LionSelect, a LionSelectRich or a native select.
 * By default, the native `<select>` element is used for this, so that it's as lightweight as
 * possible. Also, it doesn't need to be a `FormControl`, because it's purely a helper element
 * to provide better UX: the modelValue (the text field) contains all needed info, since it's in
 * `e164` format that contains all info (both region code and national phone number).
 */
export class LionInputTelDropdown extends LocalizeMixin(LionInputTel) {
  /**
   * @configure LitElement
   * @type {any}
   */
  static properties = { regionCodesList: { type: Array }, preferredRegions: { type: Array } };

  /**
   * @property regionCodesList
   * @type {string[]}
   */
  get regionCodesList() {
    return this.__regionCodesList?.length
      ? this.__regionCodesList
      : this._phoneNumberUtil?.getSupportedRegionCodes();
  }

  set regionCodesList(regionCodesList) {
    if (!Array.isArray(regionCodesList)) {
      throw new Error(`Please provide an array of regions`);
    }

    const oldValue = this.regionCodesList;
    /** @type {string[]} */
    this.__regionCodesList = regionCodesList;
    this.requestUpdate('regionCodesList', oldValue);
    // Normally, a requestUpdate would trigger rerender. For light dom, we need to take care of this ourselves
    this._scheduleLightDomRender();
  }

  refs = {
    /** @type {{value?: HTMLElement}} */
    dropdown: /** @type {{value?: HTMLElement}} */ (createRef()),
  };

  /**
   * @configure LitElement
   * @enhance LionInputTel
   */
  static styles = [
    super.styles,
    css`
      /**
         * We need to align the height of the dropdown with the height of the text field.
         * We target the HTMLDivElement 'this.__dropdownRenderParent' here. Its child,
         * [data-ref=dropdown], recieves a 100% height as well via inline styles (since we
         * can't target from shadow styles).
         */
      ::slotted([slot='prefix']) {
        height: 100%;
      }
    `,
  ];

  static templates = {
    dropdown: (/** @type {TemplateDataForDropdownInputTel} */ TemplateDataForDropdown) => {
      const { refs, data } = TemplateDataForDropdown;
      const renderOption = (/** @type {RegionMeta} */ regionMeta) =>
        html`${this.templates.regionCodeOption(TemplateDataForDropdown, regionMeta)} `;

      // TODO: once spread directive available, use it per ref (like [data-ref=dropdown])
      return html`
        <select
          ${ref(refs?.dropdown?.ref)}
          aria-label="${refs?.dropdown?.labels?.country}"
          @change="${refs?.dropdown?.listeners?.change}"
          style="${refs?.dropdown?.props?.style}"
        >
          ${data?.regionMetaListPreferred?.length
            ? html`
                ${data.regionMetaListPreferred.map(renderOption)}
                <option disabled>---------------</option>
                ${data?.regionMetaList?.map(renderOption)}
              `
            : html` ${data?.regionMetaList?.map(renderOption)}`}
        </select>
      `;
    },
    /**
     * @param {TemplateDataForDropdownInputTel} TemplateDataForDropdown
     * @param {RegionMeta} codes
     */
    // eslint-disable-next-line class-methods-use-this
    regionCodeOption: (TemplateDataForDropdown, { regionCode, countryCode, flagSymbol }) => html`
      <option value="${regionCode}">${regionCode} (+${countryCode}) &nbsp; ${flagSymbol}</option>
    `,
  };

  /**
   * @protected
   * @type {HTMLElement|undefined}
   */
  get _dropdownNode() {
    return this.refs.dropdown.value;
  }

  /**
   * This method provides a TemplateData object to be fed to pure template functions, a.k.a.
   * Pure Templates™. The goal is to totally decouple presentation from logic here, so that
   * Subclassers can override all content without having to loose private info contained
   * within the template function that was overridden.
   *
   * Subclassers would need to make sure all the contents of the TemplateData object are implemented
   * by making sure they are coupled to the right 'ref' ([data-ref=dropdown] in this example),
   * with the help of lit's spread operator directive.
   * To enhance this process, the TemplateData object is completely typed. Ideally, this would be
   * enhanced by providing linters that make sure all of their required members are implemented by
   * a Subclasser.
   * When a Subclasser wants to add more data, this can be done via:
   * @example
   * ```js
   * get _templateDataDropdown() {
   *   return {
   *     ...super._templateDataDropdown,
   *     myExtraData: { x: 1, y: 2 },
   *   }
   * }
   * ```
   * @overridable
   * @type {TemplateDataForDropdownInputTel}
   */
  get _templateDataDropdown() {
    const initialRegionCode = this.regionCode;

    const refs = {
      dropdown: {
        ref: this.refs.dropdown,
        props: {
          style: `height: 100%;`,
        },
        listeners: {
          change: this._onDropdownValueChange,
          'model-value-changed': this._onDropdownValueChange,
        },
        labels: {
          // TODO: localize this
          country: 'Country',
        },
      },
    };
    return {
      refs,
      data: {
        initialRegionCode,
        regionMetaList: this.__regionMetaList,
        regionMetaListPreferred: this.__regionMetaListPreferred,
      },
    };
  }

  /**
   * @configure SlotMixin
   */
  get slots() {
    return {
      ...super.slots,
      prefix: () => {
        // First time we render the dropdown inside its parent.
        // Note that we return the parent (a div), so we keep it as a render hook
        this.__renderDropdown();
        return this.__dropdownRenderParent;
      },
    };
  }

  /**
   * @configure LocalizeMixin
   */
  onLocaleUpdated() {
    const localeRegionCode = localize.locale.split('-')[0].toLowerCase();
    // @ts-expect-error relatively new platform api
    this.__namesForLocale = new Intl.DisplayNames([localeRegionCode], {
      type: 'region',
    });
    this.__createRegionMeta();
    this._scheduleLightDomRender();
  }

  /**
   * @enhance LionInputTel
   */
  _onPhoneNumberUtilReady() {
    super._onPhoneNumberUtilReady();
    this.__createRegionMeta();
  }

  /**
   * @lifecycle platform
   */
  constructor() {
    super();

    /**
     * @configure {LionInputTel}
     * @type {FormatStrategy}
     */
    this.formatStrategy = 'international';

    /**
     * All regions that will be shown in the dropdown
     * @type {string[]}
     */
    this.regionCodesList = [];

    /**
     * Regions that will be shown on top of the dropdown
     * @type {string[]}
     */
    this.preferredRegions = [];

    /** @type {HTMLDivElement} */
    this.__dropdownRenderParent = document.createElement('div');

    /**
     * Contains everything needed for rendering region options:
     * region code, country code, display name according to locale, display name
     * @type {RegionMeta[]}
     */
    this.__regionMetaList = [];

    /**
     * A filtered `this.__regionMetaList`, containing all regions provided in `preferredRegions`
     * @type {RegionMeta[]}
     */
    this.__regionMetaListPreferred = [];

    /** @type {EventListener} */
    this._onDropdownValueChange = this._onDropdownValueChange.bind(this);
    /** @type {EventListener} */
    this.__syncRegionWithDropdown = this.__syncRegionWithDropdown.bind(this);
  }

  /**
   * @lifecycle LitElement
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);

    if (changedProperties.has('regionCodesList')) {
      this.__createRegionMeta();
    }
  }

  /**
   * @param {import('lit-element').PropertyValues } changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('_needsLightDomRender')) {
      this.__renderDropdown();
    }
    if (changedProperties.has('_derivedRegionCode')) {
      this.__syncRegionWithDropdown(this._derivedRegionCode);
    }
    // Note order matters here.
    if (changedProperties.has('regionCode')) {
      this.__syncRegionWithDropdown();
    }
  }

  /**
   * @protected
   * @param {Event & {target: {value?:string; modelValue?:string; _overlayCtrl?:OverlayController; };  detail?: {initialize: boolean;}}} event
   */
  _onDropdownValueChange(event) {
    const isInitializing = event.detail?.initialize || !this._phoneNumberUtil;
    if (isInitializing) {
      return;
    }
    const prevRegionCode = this.regionCode;
    this.regionCode = /** @type {string} */ (event.target.value || event.target.modelValue);

    // Prefill region code on change
    // From: https://bl00mber.github.io/react-phone-input-2.html
    if (prevRegionCode !== this.regionCode && !this.focused) {
      const countryCode =
        this._phoneNumberUtil && this._phoneNumberUtil.getCountryCodeForRegionCode(this.regionCode);
      if (countryCode) {
        this.modelValue = new Unparseable(`+${countryCode}`);
      }
    }

    // Put focus on text box
    const overlayController = event.target._overlayCtrl;
    if (overlayController) {
      if (overlayController.isShown) {
        setTimeout(() => {
          this._inputNode.focus();
        });
      }
    } else {
      // For native select
      this._inputNode.focus();
    }
  }

  /**
   * Abstract away rendering to light dom, so that we can rerender when needed
   * @private
   */
  __renderDropdown() {
    const ctor = /** @type {typeof LionInputTelDropdown} */ (this.constructor);
    const templates = this.templates || ctor.templates;
    render(
      templates.dropdown(this._templateDataDropdown),
      this.__dropdownRenderParent,
      /** @type {RenderOptions} */ ({
        scopeName: this.localName,
        eventContext: this,
      }),
    );
    this.__syncRegionWithDropdown();
  }

  /**
   * @private
   */
  __syncRegionWithDropdown(regionCode = this.regionCode) {
    if (!this._dropdownNode || !regionCode) {
      return;
    }
    if ('modelValue' in this._dropdownNode) {
      this._dropdownNode.modelValue = regionCode;
    } else {
      this._dropdownNode.value = regionCode;
    }
  }

  /**
   * Prepares data for options, like "Greece (Ελλάδα)", where "Greece" is `nameForLocale` and
   * "Ελλάδα" `nameForRegion`.
   * This should be run on change of:
   * - regionCodesList
   * - _phoneNumberUtil loaded
   * - locale
   * @private
   */
  __createRegionMeta() {
    if (!this.regionCodesList?.length) {
      return;
    }
    this.__regionMetaList = [];
    this.__regionMetaListPreferred = [];
    this.regionCodesList.forEach(regionCode => {
      // @ts-expect-error Intl.DisplayNames platform api not yet typed
      const namesForRegion = new Intl.DisplayNames([regionCode.toLowerCase()], {
        type: 'region',
      });
      const countryCode =
        this._phoneNumberUtil && this._phoneNumberUtil.getCountryCodeForRegionCode(regionCode);

      const flagSymbol =
        getRegionalIndicatorSymbol(regionCode[0]) + getRegionalIndicatorSymbol(regionCode[1]);

      const destinationList = this.preferredRegions.includes(regionCode)
        ? this.__regionMetaListPreferred
        : this.__regionMetaList;

      destinationList.push({
        regionCode,
        countryCode,
        flagSymbol,
        nameForLocale: this.__namesForLocale.of(regionCode),
        nameForRegion: namesForRegion.of(regionCode),
      });
    });
  }
}
