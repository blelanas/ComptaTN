import { LogoMark } from '@/components/Logo';

export function FullPageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="size-10 animate-pulse" />
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`${className} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`}
    />
  );
}
