/** @type {(value: any) => void} */
let resolveLoaded;

/**
 * - Handles lazy loading of the (relatively large) google-libphonenumber library, allowing
 * for quick first paints
 * - Maintains one instance of phoneNumberUtil that can be shared across multiple places
 * - Allows for easy mocking in unit tests
 */
export class LibPhoneNumberManager {
  static async loadLibPhoneNumber() {
    const PhoneNumber = (await import('../lib/awesome-phonenumber-esm.js')).default;
    // this.libphonenumber = window.libphonenumber;
    // // Set default phoneNumberUtil instance
    // this.phoneNumberUtil = window.libphonenumber.PhoneNumberUtil.getInstance();
    this.PhoneNumber = PhoneNumber;
    resolveLoaded(undefined);
    return PhoneNumber;
  }

  /**
   * Check if google-libphonenumber has been loaded
   */
  static get isLoaded() {
    return Boolean(this.PhoneNumber);
  }
}

/**
 * Wait till google-libphonenumber has been loaded
 * @example
 * ```js
 * await LibPhoneNumberManager.loadComplete;
 * ```
 */
LibPhoneNumberManager.loadComplete = new Promise(resolve => {
  resolveLoaded = resolve;
});

// initialize
LibPhoneNumberManager.loadLibPhoneNumber();
