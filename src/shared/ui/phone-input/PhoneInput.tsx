import type { ComponentProps } from 'react';
import { formatPhone, parsePhoneCharacter } from '@/shared/lib/phone';
import { FormattedInput } from '@/shared/ui/formatted-input/FormattedInput';

type TPhoneInputProps = Omit<
  ComponentProps<typeof FormattedInput>,
  'parse' | 'format' | 'maxLength'
>;

export const PhoneInput = (props: TPhoneInputProps) => (
  <FormattedInput
    autoComplete="tel"
    inputMode="tel"
    placeholder="+7 (999) 123-45-67"
    type="tel"
    {...props}
    format={formatPhone}
    parse={parsePhoneCharacter}
  />
);
