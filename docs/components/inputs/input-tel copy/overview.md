# Inputs >> Input Phone >> Overview ||10

Input field for entering phone numbers, including validation, formatting and mobile keyboard support.

```js script
import { html } from '@mdjs/mdjs-preview';
import '@lion/input-phone/define';
```

```js preview-story
export const main = () => {
  return html` <lion-input-phone label="Telephone number" name="phoneNumber"></lion-input-phone> `;
};
```

## Features

- Extends our [input](../input/overview.md)
- Shows a mobile telephone keypad on mobile (by having a native `<input inputmode="tel">` inside)
- Can be configured with a country code
- Will be preconfigured with country derived from locale
- Uses google-libphonenumber
  - Formats phone numbers, based on country code
  - Validates phone numbers, based on country code

## Installation

```bash
npm i --save @lion/input-phone
```

```js
import { LionInputTel } from '@lion/input-phone';
// or
import '@lion/input-phone/define';
```
