interface BannerProps {
  tone: 'error' | 'info';
  children: React.ReactNode;
}

export function Banner({ tone, children }: BannerProps) {
  return (
    <div className={`nb-banner nb-banner--${tone}`} role="alert">
      {children}
    </div>
  );
}
