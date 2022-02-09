# Inputs >> Input Phone >> Features ||20

```js script
import { html } from '@mdjs/mdjs-preview';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import '@lion/input-phone/define';
```

## Country code

```js preview-story
export const counrtyCode = () => html`
  <lion-input-phone
    label="Telephone number"
    help-text="With country code 'NL'"
    country-code="${'NL'}"
    .modelValue=${'0612345678'}
    name="phoneNumber"
  ></lion-input-phone>
`;
```

## Prefilled

```js preview-story
export const prefilled = () => html`
  <lion-input-phone
    label="Telephone number"
    help-text="Prefilled"
    .modelValue=${'0612345678'}
    name="phoneNumber"
  ></lion-input-phone>
`;
```
