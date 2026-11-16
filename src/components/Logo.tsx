import clsx from 'clsx';

/**
 * Qayd mark: a "Q" whose two dots echo the Arabic letter ق (qāf),
 * first letter of قيد — "écriture comptable".
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx('shrink-0', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <circle cx="16" cy="18" r="7" fill="none" stroke="#fff" strokeWidth="3.2" />
      <path d="M19.5 21.5 24 26" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="12.5" cy="6.8" r="2" className="fill-clay-400" />
      <circle cx="19.5" cy="6.8" r="2" className="fill-clay-400" />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-8" />
      <span className={clsx('text-[22px] font-extrabold tracking-tight', inverted ? 'text-white' : 'text-ink')}>
        Qayd
      </span>
    </span>
  );
}
