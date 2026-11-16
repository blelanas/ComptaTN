import clsx from 'clsx';

/**
 * Raqib mark: an "R" with a watchful dot, the one who keeps an eye on the
 * accounts. Raqib (رقيب) means « celui qui veille, le contrôleur ».
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx('shrink-0', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path
        d="M10.5 23.5V8.5H16a4.5 4.5 0 0 1 0 9h-5.5M15.5 17.5l6 6"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="8.5" r="2.4" className="fill-clay-400" />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-8" />
      <span className={clsx('text-[22px] font-extrabold tracking-tight', inverted ? 'text-white' : 'text-ink')}>
        Raqib
      </span>
    </span>
  );
}
