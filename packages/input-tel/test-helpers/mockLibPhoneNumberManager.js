import { LibPhoneNumberManager } from '../src/LibPhoneNumberManager.js';

const originalLoadComplete = LibPhoneNumberManager.loadComplete;
const originalIsLoaded = LibPhoneNumberManager.isLoaded;

export function mockLibPhoneNumberManager() {
  /** @type {(value: any) => void} */
  let resolveLoaded;
  let isLoaded = false;
  LibPhoneNumberManager.loadComplete = new Promise(resolve => {
    resolveLoaded = () => {
      isLoaded = true;
      resolve(undefined);
    };
  });
  Object.defineProperty(LibPhoneNumberManager, 'isLoaded', { get: () => isLoaded });

  // @ts-ignore
  return { resolveLoaded };
}

export function restoreLibPhoneNumberManager() {
  LibPhoneNumberManager.loadComplete = originalLoadComplete;
  Object.defineProperty(LibPhoneNumberManager, 'isLoaded', { get: () => originalIsLoaded });
}
