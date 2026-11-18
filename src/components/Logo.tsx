import clsx from 'clsx';

/**
 * Raqib logo (source: docs/brand/raqib-logo.webp): an "R" whose stem is a
 * rising bar chart, crossed by a gold curve. Raqib (رقيب) means « celui qui
 * veille, le contrôleur ».
 *
 * `tone="light"` is for dark backgrounds (sidebar): the R turns white, the
 * curve stays gold.
 */
const NAVY = '#0B1F44';
const GOLD = '#D4A12E';

export function LogoMark({ className, tone = 'color' }: { className?: string; tone?: 'color' | 'light' }) {
  const ink = tone === 'light' ? '#FFFFFF' : NAVY;
  return (
    <svg viewBox="0 0 44 37" className={clsx('shrink-0', className)} aria-hidden="true">
      {/* R: top and bowl */}
      <path
        fill={ink}
        d="M7 0.8 10.8 5.2H24.5C28.4 5.2 30.4 7.4 30.4 10.4 30.4 14 27.5 17.6 23.8 20V21.6C31.5 18.6 37.8 14.6 37.8 9.4 37.8 4.2 33.6 0.8 27.5 0.8Z"
      />
      {/* R: leg */}
      <path fill={ink} d="M24.6 28 32.5 23.8 44 36.8H32Z" />
      {/* Bars (the stem of the R) */}
      <path fill={ink} d="M7 20.3 11 18.6V26.6L7 28.2Z" />
      <path fill={ink} d="M12.7 16.3 16.7 14.8V24.2L12.7 25.6Z" />
      <path fill={ink} d="M18.3 12.3 22.3 10.8V22.2L18.3 23.6Z" />
      {/* Gold curve */}
      <path
        fill={GOLD}
        d="M0.2 36.8C5 29.5 16 27 24 24.4 33 21.5 42 15 43.5 4.5 42.6 14.5 35 21.5 25 25.6 16 29.2 6 30.5 0.2 36.8Z"
      />
    </svg>
  );
}

/** "Raqib" with the gold dot on the i, as in the logo. */
export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={clsx('font-extrabold leading-none tracking-tight', inverted ? 'text-white' : 'text-brand-900', className)}
      role="img"
      aria-label="Raqib"
    >
      <span aria-hidden="true">
        Raq
        <span className="relative inline-block">
          ı
          <span className="absolute left-1/2 top-[0.02em] size-[0.2em] -translate-x-1/2 rounded-full bg-gold-500" />
        </span>
        b
      </span>
    </span>
  );
}

export function Logo({
  className,
  inverted = false,
  tagline = false,
}: {
  className?: string;
  inverted?: boolean;
  /** Shows « Gérer · Suivre · Grandir » under the name. */
  tagline?: boolean;
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-8 w-[38px]" tone={inverted ? 'light' : 'color'} />
      <span className="flex flex-col gap-1">
        <Wordmark className="text-[24px]" inverted={inverted} />
        {tagline && (
          <span
            className={clsx(
              'flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]',
              inverted ? 'text-brand-200' : 'text-muted',
            )}
          >
            Gérer <Dot /> Suivre <Dot /> Grandir
          </span>
        )}
      </span>
    </span>
  );
}

function Dot() {
  return <span className="inline-block size-1 rounded-full bg-gold-500" />;
}
