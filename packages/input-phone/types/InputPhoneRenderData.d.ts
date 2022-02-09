type RefRenderData = {
  props?: { [key: string]: any };
};

export type InputPhoneRenderData = {
  refs: {
    countryCode: RefRenderData;
    countryCodeNativeSelect: RefRenderData;
    phoneNumber: RefRenderData;
  };
  data: {
    initialCountryCode: string;
    countryCodes: string[];
    phoneNumberUtil: libphonenumber.PhoneNumberUtil;
  };
};
