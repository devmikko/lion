import { LibPhoneNumberManager } from './LibPhoneNumberManager.js';
import { formatPhoneNumber } from './formatters.js';

/**
 * @typedef {import('../types/types').FormatStrategy} FormatStrategy
 * @typedef {import('../types/types').RegionCode} RegionCode
 * @typedef {* & import('awesome-phonenumber').default} PhoneNumber
 */

/**
 * @param {string} viewValue
 * @param {object} options
 * @param {RegionCode} options.regionCode
 * @param {string} options.prevViewValue
 * @param {number} options.currentCaretIndex
 * @param {FormatStrategy} options.formatStrategy
 * @returns {{viewValue:string; caretIndex:number;}|string}
 */
export function formatPhoneNumberAsYouType(
  viewValue,
  { regionCode, formatStrategy, prevViewValue, currentCaretIndex },
) {
  const diff = viewValue.length - prevViewValue.length;
  // Do not format when not loaded
  if (diff <= 0 || !LibPhoneNumberManager.isLoaded) {
    return viewValue;
  }

  // eslint-disable-next-line prefer-destructuring
  const PhoneNumber = /** @type {PhoneNumber} */ (LibPhoneNumberManager.PhoneNumber);
  const ayt = PhoneNumber.getAsYouType(regionCode);

  for (const char of viewValue) {
    if (char !== '') {
      ayt.addChar(char);
    }
  }

  let pn;
  try {
    pn = ayt.getPhoneNumber();
    // eslint-disable-next-line no-empty
  } catch (_) {}

  // console.log({ pn }, ayt.number());

  // // if (modelValue?.length >= 4 && modelValue?.length <= 16 && pn?.isValid()) {
  // let formattedValue;

  // switch (formatStrategy) {
  //   case 'e164':
  //     formattedValue = pn.getNumber('e164'); // -> '+46707123456' (default modelValue)
  //     break;
  //   case 'international':
  //     formattedValue = pn.getNumber('international'); // -> '+46 70 712 34 56'
  //     break;
  //   case 'national':
  //     formattedValue = pn.getNumber('national'); // -> '070-712 34 56'
  //     break;
  //   case 'rfc3966':
  //     formattedValue = pn.getNumber('rfc3966'); // -> 'tel:+46-70-712-34-56'
  //     break;
  //   case 'significant':
  //     formattedValue = pn.getNumber('significant'); // -> '707123456'
  //     break;
  //   default:
  //     break;
  // }

  const newViewValue = formatPhoneNumber(ayt.number(), { regionCode, formatStrategy });

  // console.log({ newViewValue });

  /**
   * Given following situation:
   * - viewValue: `+316123`
   * - currentCaretIndex: 2 (inbetween 3 and 1)
   * - prevViewValue `+36123` (we inserted '1' at position 2)
   * => we should get `+31 6123`, and new caretIndex should be 3, and not newViewValue.length
   */
  const diffBetweenNewAndCurrent = newViewValue.length - viewValue.length;
  const newCaretIndex = currentCaretIndex + diffBetweenNewAndCurrent;

  console.log({ newCaretIndex, currentCaretIndex, diffBetweenNewAndCurrent, newViewValue });
  // const finalCaretIndex =
  //   newCaretIndex <= newViewValue.length ? newCaretIndex : newViewValue.length;

  // const relevantChar = viewValue[currentCaretIndex]; // would be the first 1 in example above
  // let caretIndex;
  // if (relevantChar) {
  //   // Based on our new formattedValue, determine where the caret should go.
  //   if (relevantChar)
  //   caretIndex = viewValue.length;
  // } else {
  //   // Just put the caret at the end
  //   caretIndex = viewValue.length;
  // }

  return newViewValue ? { viewValue: newViewValue, caretIndex: newCaretIndex } : viewValue;
}

// export function filterOutNonPhoneChars(viewValue) {
//   const allowedChars = ['+', '(', ')', '-'];
//   return viewValue.replace('');
// }
