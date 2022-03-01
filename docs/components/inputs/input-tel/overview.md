# Inputs >> Input Tel >> Overview ||10

Input field for entering phone numbers, including validation, formatting and mobile keyboard support.

```js script
import { html } from '@mdjs/mdjs-preview';
import '@lion/input-tel/define';
```

```js preview-story
export const main = () => {
  return html` <lion-input-tel label="Telephone number" name="phoneNumber"></lion-input-tel> `;
};
```

## Features

- Extends our [input](../input/overview.md)
- Shows a mobile telephone keypad on mobile (by having a native `<input inputmode="tel">` inside)
- Can be configured with a region code
- Will be preconfigured with region derived from locale
- Has the [e164 standard format](https://en.wikipedia.org/wiki/E.164) as modelValue
- Uses [awesome-phonenumber](https://www.npmjs.com/package/awesome-phonenumber) (a performant, concise version of [google-lib-phonenumber](https://www.npmjs.com/package/google-libphonenumber)):
  - Formats phone numbers, based on region code
  - Validates phone numbers, based on region code
- Lazy loads awesome-phonenumber, so that the first paint of this component will be brought to your screen as quick as possible

## Installation

```bash
npm i --save @lion/input-tel
```

```js
import { LionInputTel } from '@lion/input-tel';
// or
import '@lion/input-tel/define';
```
