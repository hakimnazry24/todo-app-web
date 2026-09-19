import { useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="nb-field">
      <label className="nb-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="nb-field__control"
        aria-describedby={hintId}
        {...rest}
      />
      {hint && (
        <span className="nb-field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, ...rest }: TextAreaFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="nb-field">
      <label className="nb-field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="nb-field__control"
        aria-describedby={hintId}
        {...rest}
      />
      {hint && (
        <span className="nb-field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}
