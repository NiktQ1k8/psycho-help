import type { InputHTMLAttributes } from 'react';
import type { FormatFunction, ParseFunction } from 'input-format';
import { useInput } from 'input-format/react-hook';

type TNativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onKeyDown'
>;

type TFormattedInputProps = TNativeInputProps & {
  value: string;
  onChange: (value: string) => void;
  parse: ParseFunction;
  format: FormatFunction;
};

export const FormattedInput = (props: TFormattedInputProps) => {
  const inputProps = useInput<TNativeInputProps>(props);
  return <input {...inputProps} />;
};
