import sinon from 'sinon';
import { expect, aTimeout } from '@open-wc/testing';
import { IsPhoneNumber } from '../src/validators.js';
import { LibPhoneNumberManager } from '../src/LibPhoneNumberManager.js';
import {
  mockLibPhoneNumberManager,
  restoreLibPhoneNumberManager,
} from '../test-helpers/mockLibPhoneNumberManager.js';

describe('IsPhoneNumber validation', () => {
  beforeEach(async () => {
    // Wait till LibPhoneNumberManager has been loaded
    await LibPhoneNumberManager.loadComplete;
  });

  it('is valid when no input is provided (compatible with mutually exclusive Required Validator)', () => {
    const validator = new IsPhoneNumber();
    expect(validator.execute('', 'NL')).to.be.true;
  });

  it('is invalid when non digits are entered', () => {
    const validator = new IsPhoneNumber();
    expect(validator.execute('foo', 'NL')).to.be.true;
  });

  it('is valid when a phone number is entered', () => {
    const validator = new IsPhoneNumber();
    expect(validator.execute('0612345678', 'NL')).to.be.false;
  });

  it.skip('expects a regionCode', () => {
    const validator = new IsPhoneNumber();
    // @ts-ignore
    expect(() => validator.execute('foo')).to.throw();
    expect(() => validator.execute('foo', 'NL')).to.not.throw();
  });

  it('handles validation via google-lib-phonenumber', () => {
    const validator = new IsPhoneNumber();
    const spy = sinon.spy(
      /** @type {libphonenumber.PhoneNumberUtil} */ (LibPhoneNumberManager.phoneNumberUtil),
      'isValidNumberForRegion',
    );
    validator.execute('0123456789', 'NL');
    expect(spy).to.have.been.calledOnce;
    expect(spy.lastCall.args[1]).to.equal('NL');
    validator.execute('0123456789', 'DE');
    expect(spy.lastCall.args[1]).to.equal('DE');
    spy.restore();
  });

  describe('Lazy loading LibPhoneNumberManager', () => {
    /** @type {(value:any) => void} */
    let resolveLoaded;
    beforeEach(() => {
      ({ resolveLoaded } = mockLibPhoneNumberManager());
    });

    afterEach(() => {
      restoreLibPhoneNumberManager();
    });

    it('behaves asynchronously when lib is still loading', () => {
      expect(IsPhoneNumber.async).to.be.true;
      resolveLoaded(undefined);
      expect(IsPhoneNumber.async).to.be.false;
    });

    it('waits for the lib to be loaded before execution completes when still in async mode', async () => {
      const validator = new IsPhoneNumber();
      const spy = sinon.spy(
        /** @type {libphonenumber.PhoneNumberUtil} */ (LibPhoneNumberManager.phoneNumberUtil),
        'isValidNumberForRegion',
      );
      const validationResult = validator.execute('061234', 'NL');
      expect(validationResult).to.be.instanceOf(Promise);
      expect(spy).to.not.have.been.called;
      resolveLoaded(undefined);
      await aTimeout(0);
      expect(spy).to.have.been.calledOnce;
      spy.restore();
    });
  });
});
