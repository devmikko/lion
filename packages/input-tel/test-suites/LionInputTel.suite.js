import {
  expect,
  fixture as _fixture,
  fixtureSync as _fixtureSync,
  html,
  defineCE,
  unsafeStatic,
  aTimeout,
} from '@open-wc/testing';
import sinon from 'sinon';
import { localize } from '@lion/localize';
import { mimicUserInput } from '@lion/form-core/test-helpers/mimicUserInput.js';
import { LionInputTel } from '../src/LionInputTel.js';
import { IsPhoneNumber } from '../src/validators.js';
import { LibPhoneNumberManager } from '../src/LibPhoneNumberManager.js';
import {
  mockLibPhoneNumberManager,
  restoreLibPhoneNumberManager,
} from '../test-helpers/mockLibPhoneNumberManager.js';

/**
 * @typedef {import('@lion/core').TemplateResult} TemplateResult
 */

const fixture = /** @type {(arg: string | TemplateResult) => Promise<LionInputTel>} */ (_fixture);
const fixtureSync = /** @type {(arg: string | TemplateResult) => LionInputTel} */ (_fixtureSync);

const getRegionCodeBasedOnLocale = () =>
  // @ts-expect-error [allow-protected]
  localize._getLangFromLocale(localize.locale).toUpperCase();

/**
 * @param {{ klass:LionInputTel }} config
 */
// @ts-ignore
export function runInputTelSuite({ klass = LionInputTel } = {}) {
  // @ts-ignore
  const tagName = defineCE(/** @type {* & HTMLElement} */ (class extends klass {}));
  const tag = unsafeStatic(tagName);

  describe('LionInputTel', () => {
    beforeEach(async () => {
      // Wait till LibPhoneNumberManager has been loaded
      await LibPhoneNumberManager.loadComplete;
    });

    describe('Region code', () => {
      it('automatically localizes based on current locale', async () => {
        const el = await fixture(html` <${tag}></${tag}> `);
        const currentCode = getRegionCodeBasedOnLocale();
        expect(el.regionCode).to.equal(currentCode);
      });

      it('deducts from modelValue when region code not provided', async () => {
        const el = await fixture(html` <${tag} .modelValue="${'+31612345678'}"></${tag}> `);
        // Region code for country code '31' is 'NL'
        expect(el.regionCode).to.equal('NL');
      });

      it('can preconfigure the region code via attr', async () => {
        const currentCode = getRegionCodeBasedOnLocale();
        const newCode = currentCode === 'DE' ? 'NL' : 'DE';
        const el = await fixture(html` <${tag} region-code="${newCode}"></${tag}> `);
        expect(el.regionCode).to.equal(newCode);
      });

      it('can preconfigure the region code via prop', async () => {
        const currentCode = getRegionCodeBasedOnLocale();
        const newCode = currentCode === 'DE' ? 'NL' : 'DE';
        const el = await fixture(html` <${tag} .regionCode="${newCode}"></${tag}> `);
        expect(el.regionCode).to.equal(newCode);
      });

      it('reformats when region code is changed on the fly', async () => {
        const el = await fixture(
          html` <${tag} .regionCode="${'NL'}" .modelValue="${'+31612345678'}" ></${tag}> `,
        );
        await el.updateComplete;
        expect(el.formattedValue).to.equal('06 12345678');
        el.regionCode = 'EN';
        await el.updateComplete;
        expect(el.formattedValue).to.equal('612345678');
      });

      it('region code takes precedence over modelValue when both contain country info', async () => {
        const el = await fixture(
          html` <${tag} .regionCode="${'DE'}" .modelValue="${'+31612345678'}" ></${tag}> `,
        );
        await el.updateComplete;
        expect(el.regionCode).to.equal('NL');
      });
    });

    describe('User interaction', () => {
      it('sets inputmode to "tel" for mobile keyboard', async () => {
        const el = await fixture(html` <${tag}></${tag}> `);
        // @ts-expect-error [allow-protected] inside tests
        expect(el._inputNode.inputMode).to.equal('tel');
      });

      it('formats according to locale', async () => {
        const el = await fixture(
          html` <${tag} .modelValue="${'+31612345678'}" region-code="NL"></${tag}> `,
        );
        await aTimeout(0);
        expect(el.formattedValue).to.equal('06 12345678');
      });
    });

    // https://www.npmjs.com/package/google-libphonenumber
    // https://en.wikipedia.org/wiki/E.164
    describe('Values', () => {
      it('stores a modelValue in E164 format', async () => {
        const el = await fixture(html` <${tag} region-code="NL"></${tag}> `);
        mimicUserInput(el, '612345678');
        await aTimeout(0);
        expect(el.modelValue).to.equal('+31612345678');
      });

      it('stores a serializedValue in E164 format', async () => {
        const el = await fixture(html` <${tag} region-code="NL"></${tag}> `);
        mimicUserInput(el, '612345678');
        await aTimeout(0);
        expect(el.serializedValue).to.equal('+31612345678');
      });

      it('stores a formattedValue in "format-strategy" format (phoneUtil.formatInOriginalFormat)', async () => {
        const el = await fixture(
          html` <${tag} format-strategy="original" region-code="NL"></${tag}> `,
        );
        mimicUserInput(el, '612345678');
        await aTimeout(0);
        expect(el.formattedValue).to.equal('06 12345678');
      });
    });

    describe('Validation', () => {
      it('applies IsPhoneNumber as default validator', async () => {
        const el = await fixture(html` <${tag}></${tag}> `);
        expect(el.defaultValidators.find(v => v instanceof IsPhoneNumber)).to.be.not.undefined;
      });

      it('configures IsPhoneNumber with regionCode before first validation', async () => {
        const el = fixtureSync(
          html` <${tag} .regionCode="${'NL'}" .modelValue="${'612345678'}"></${tag}> `,
        );
        const spy = sinon.spy(el, 'validate');
        const validatorInstance = /** @type {IsPhoneNumber} */ (
          el.defaultValidators.find(v => v instanceof IsPhoneNumber)
        );
        expect(validatorInstance.param).to.equal('NL');
        expect(spy).to.not.have.been.called;
        await el.updateComplete;
        expect(spy).to.have.been.called;
        spy.restore();
      });

      it('updates IsPhoneNumber param on regionCode change', async () => {
        const el = await fixture(
          html` <${tag} .regionCode="${'NL'}" .modelValue="${'612345678'}"></${tag}> `,
        );
        const validatorInstance = /** @type {IsPhoneNumber} */ (
          el.defaultValidators.find(v => v instanceof IsPhoneNumber)
        );
        el.regionCode = 'DE';
        await el.updateComplete;
        expect(validatorInstance.param).to.equal('DE');
      });
    });

    describe('User interaction', () => {
      it('sets inputmode to "tel" for mobile keyboard', async () => {
        const el = await fixture(html` <${tag}></${tag}> `);
        // @ts-expect-error [allow-protected] inside tests
        expect(el._inputNode.inputMode).to.equal('tel');
      });

      it('formats according to locale', async () => {
        const el = await fixture(html` <${tag} region-code="NL"></${tag}> `);
        await LibPhoneNumberManager.loadComplete;
        el.modelValue = '612345678';
        expect(el.formattedValue).to.equal('06 12345678');
      });
    });

    describe('Accessibility', () => {
      describe('Audit', () => {
        it('passes a11y audit', async () => {
          const el = await fixture(html`<${tag} label="tel" .modelValue=${'0123456789'}></${tag}>`);
          await expect(el).to.be.accessible();
        });

        it('passes a11y audit when readonly', async () => {
          const el = await fixture(
            html`<${tag} label="tel" readonly .modelValue=${'0123456789'}></${tag}>`,
          );
          await expect(el).to.be.accessible();
        });

        it('passes a11y audit when disabled', async () => {
          const el = await fixture(
            html`<${tag} label="tel" disabled .modelValue=${'0123456789'}></${tag}>`,
          );
          await expect(el).to.be.accessible();
        });
      });
    });

    describe('Lazy loading google-libphonenumber', () => {
      /** @type {(value:any) => void} */
      let resolveLoaded;
      beforeEach(() => {
        ({ resolveLoaded } = mockLibPhoneNumberManager());
      });

      afterEach(() => {
        restoreLibPhoneNumberManager();
      });

      it('reformats once lib has been loaded', async () => {
        const el = await fixture(
          html` <${tag} .modelValue="${'612345678'}" region-code="NL"></${tag}> `,
        );
        expect(el.formattedValue).to.equal('612345678');
        resolveLoaded(undefined);
        await aTimeout(0);
        expect(el.formattedValue).to.equal('06 12345678');
      });
    });
  });
}
