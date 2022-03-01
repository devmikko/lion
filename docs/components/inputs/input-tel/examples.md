# Inputs >> Input Tel >> Examples ||30

```js script
import { html } from '@mdjs/mdjs-preview';
import '@lion/select-rich/define';
import './src/intl-input-tel-dropdown.js';
```

## Input Tel International

Example implementation for https://intl-tel-input.com/

```js preview-story
export const IntlInputTelDropdown = () => html`
  <intl-input-tel-dropdown
    region-code="NL"
    .preferredRegions="${['NL', 'BE']}"
    .modelValue=${'0612345678'}
    label="Telephone number"
    help-text="Advanced dropdown and styling"
    name="phoneNumber"
  ></intl-input-tel-dropdown>
`;
```
