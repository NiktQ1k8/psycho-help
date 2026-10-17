import { AsYouType, parsePhoneNumberCharacter } from 'libphonenumber-js/max';

export const PHONE_MAX_LENGTH = 16; // «+» и до 15 цифр в международном номере.

export const parsePhoneCharacter = (character: string, value: string) => {
  if (value.length >= PHONE_MAX_LENGTH) return;
  const parsed = parsePhoneNumberCharacter(character, value);
  if (!value && parsed && parsed !== '+') {
    return parsed === '7' || parsed === '8' ? '+7' : `+7${parsed}`;
  }
  return parsed;
};

export const formatPhone = (value = '') => {
  const hasSevenCode = value.startsWith('+7');
  const formatter = new AsYouType(hasSevenCode ? 'RU' : undefined);
  const text = formatter.input(hasSevenCode ? `8${value.slice(2)}` : value);
  const template = formatter.getTemplate();
  return {
    text: hasSevenCode ? text.replace(/^8/, '+7') : text,
    template: hasSevenCode ? template.replace(/^x/, 'xx') : template,
  };
};
