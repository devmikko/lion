import { expect, fixture as _fixture, html } from '@open-wc/testing';
import { LionInputTel } from '@lion/input-tel';
import { LionSelect } from '@lion/select';
import { LionSelectRich } from '@lion/select-rich';
import { localize } from '@lion/localize';

/**
 * @typedef {import('@lion/core').TemplateResult} TemplateResult
 */
const fixture = /** @type {(arg: string | TemplateResult) => Promise<LionInputTel>} */ (_fixture);

const isInstanceofSelectOrSelectRich = (/** @type {Element} */ instance) =>
  instance instanceof LionSelect || instance instanceof LionSelectRich;

const getCountryCodeBasedOnLocale = () =>
  // @ts-expect-error
  localize._getLangFromLocale(localize.locale).toUpperCase();

describe('LionInputPhone', () => {
  describe('Structure', () => {
    it('adds a select for country code', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
      const { countryCode } = el.formElements;
      expect(countryCode).to.exist;
      expect(isInstanceofSelectOrSelectRich(el)).to.be.true;
    });

    it('adds a text field for phone number', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
      const { phoneNumber } = el.formElements;
      expect(phoneNumber).to.exist;
      expect(phoneNumber).to.be.instanceOf(LionInput);
    });
  });

  describe('Localization', () => {
    it('allows for preconfiguring a country code', async () => {
      const el = await fixture(html`
        <lion-input-phone .modelValue="${{ countryCode: 'NL' }}"></lion-input-phone>
      `);
      const { countryCode } = el.formElements;
      expect(countryCode.modelValue).to.equal('NL');
    });

    it('automatically localizes based on current locale', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
      const currentCode = getCountryCodeBasedOnLocale();
      expect(el.formElements.countryCode.modelValue).to.equal(currentCode);
      expect(el.modelValue.countryCode).to.equal(currentCode);
    });
  });

  describe('ModelValue', () => {
    it('interacts via object { countryCode: string; phoneNumber: string }', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
      expect(el.modelValue).to.eql({
        countryCode: getCountryCodeBasedOnLocale(),
        phoneNumber: '',
      });
      const { countryCode, phoneNumber } = el.formElements;

      countryCode.modelValue = 'DE';
      phoneNumber.modelValue = '12312321';
    });
  });

  describe('User interaction', () => {
    it('sets inputmode to "tel" for mobile keyboard', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
      const { phoneNumber } = el.formElements;
      expect(phoneNumber.inputMode).to.equal('tel');
    });

    describe('Interaction States (validation)', () => {
      it('only shows user feedback on phoneNumber.touched and phoneNumber.dirty', async () => {
        const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
        const { countryCode, phoneNumber } = el.formElements;

        // Initial states
        expect(countryCode.dirty).to.be.false;
        expect(countryCode.touched).to.be.false;
        expect(phoneNumber.dirty).to.be.false;
        expect(phoneNumber.touched).to.be.false;

        // Note that by default, for fieldsets, its error would become visible once
        // ".touched" and ".dirty" are true on group level (meaning, one of their children should
        // have these states)
        countryCode.modelValue = 'DE';
        expect(countryCode.dirty).to.be.true;
        countryCode.focus();
        expect(countryCode.touched).to.be.true;

        // At this point, once in erroneous state, the error message should have become visible.
        // Let's bring the input-phone in erroneous state by entering an invalid phone number

        phoneNumber.focus();
        phoneNumber.modelValue = '123';
        expect(el.dirty).to.be.true;
        expect(countryCode.touched).to.be.false;
        expect(countryCode.dirty).to.be.true;

        expect(phoneNumber.inputMode).to.equal('tel');
      });
    });
  });

  describe('Accessibility', () => {
    it('extends LionFieldset for right accessible behavior', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
    });

    it('adds label-sr-only to children', async () => {
      const el = await fixture(html` <lion-input-phone></lion-input-phone> `);
      const { countryCode, phoneNumber } = el.formElements;
      expect(countryCode.labelSrOnly).to.equal(true);
      expect(phoneNumber.labelSrOnly).to.equal(true);
    });

    describe('Audit', () => {
      it('passes a11y audit', async () => {
        const el = await fixture(
          html`<lion-input-phone .modelValue=${'NL20INGB0001234567'}></lion-input-phone>`,
        );
        await expect(el).to.be.accessible();
      });

      it('passes a11y audit when readonly', async () => {
        const el = await fixture(
          html`<lion-input-phone readonly .modelValue=${'NL20INGB0001234567'}></lion-input-phone>`,
        );
        await expect(el).to.be.accessible();
      });

      it('passes a11y audit when disabled', async () => {
        const el = await fixture(
          html`<lion-input-phone disabled .modelValue=${'NL20INGB0001234567'}></lion-input-phone>`,
        );
        await expect(el).to.be.accessible();
      });
    });
  });
});
