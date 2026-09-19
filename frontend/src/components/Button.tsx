import type { ButtonHTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'accent';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  small?: boolean;
}

export function Button({
  variant = 'default',
  block = false,
  small = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'nb-button',
    variant !== 'default' ? `nb-button--${variant}` : '',
    block ? 'nb-button--block' : '',
    small ? 'nb-button--small' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...rest} />;
}
