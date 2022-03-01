# Inputs >> Input Tel >> Features ||20

```js script
import { html } from '@mdjs/mdjs-preview';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import '@lion/input-tel/define';
```

## Region code

```js preview-story
export const countryCode = () => html`
  <lion-input-tel
    label="Telephone number"
    help-text="With region code 'NL'"
    region-code="NL"
    .modelValue=${'0612345678'}
    name="phoneNumber"
  ></lion-input-tel>
  <h-output .show="${['modelValue']}"></h-output>
`;
```

## Format strategy

Possible values:

| strategy      |                 output |
| :------------ | ---------------------: |
| e164          |         '+46707123456' |
| international |     '+46 70 712 34 56' |
| national      |        '070-712 34 56' |
| significant   |            '707123456' |
| rfc3966       | 'tel:+46-70-712-34-56' |

```js preview-story
export const formatStrategy = () => html`
  <lion-input-tel
    label="Telephone number"
    help-text="Format strategy"
    .modelValue=${'0612345678'}
    format-strategy="rfc3966"
    region-code="NL"
    name="phoneNumber"
  ></lion-input-tel>
`;
```

## Auto format

```js preview-story
export const autoformat = () => html`
  <lion-input-tel
    label="Telephone number"
    help-text="Automatically format on valu change"
    .modelValue=${'0612345678'}
    format-strategy="international"
    region-code="NL"
    auto-format
    name="phoneNumber"
  ></lion-input-tel>
`;
```

## Input Tel Dropdown

InputTelDropdown is an advanced version of the InputTel. It prefixes a dropdown list with region
codes that automatically sync validation and formatting with the text field when selected.

```js preview-story
export const InputTelDropdown = () => html`
  <lion-input-tel-dropdown
    label="Select region via dropdown"
    help-text="With region code 'NL'"
    region-code="${'NL'}"
    .modelValue=${'0612345678'}
    name="phoneNumber"
  ></lion-input-tel-dropdown>
`;
```

## Input Tel Dropdown with preconfigured regionCodesList

InputTelDropdown is an advanced version of the InputTel. It prefixes a dropdown list with region
codes that automatically sync validation and formatting with the text field when selected.

```js preview-story
export const regionCodesList = () => html`
  <lion-input-tel-dropdown
    label="Select region via dropdown"
    help-text="With region code 'NL'"
    region-code="${'NL'}"
    .modelValue=${'0612345678'}
    name="phoneNumber"
    .regionCodesList=${['NL', 'DE', 'GB']}
  ></lion-input-tel-dropdown>
`;
```

## Input Tel Dropdown with preferred region codes

Preferred region codes show up on top

```js preview-story
export const preferredRegionCodes = () => html`
  <lion-input-tel-dropdown
    label="Select region via dropdown"
    help-text="Preferred regions show on top"
    region-code="${'NL'}"
    .modelValue=${'0612345678'}
    name="phoneNumber"
    .regionCodesList=${['NL', 'DE', 'GB', 'BE', 'US', 'CA']}
    .preferredRegions=${['NL', 'DE']}
  ></lion-input-tel-dropdown>
`;
```
