import clsx from 'clsx';
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** True once the element has entered the screen (never goes back to false). */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined' || reducedMotion()) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);
  return [ref, inView] as const;
}

/** Fades and lifts its content in when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag ref={ref} className={clsx('reveal', inView && 'is-visible', className)} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Counts from 0 to `value` once visible. */
export function CountUp({
  value,
  duration = 1400,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reducedMotion()) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration]);
  return (
    <span ref={ref} className={clsx('num', className)}>
      {format(shown)}
    </span>
  );
}

/** Style helper for the CSS `--d` delay used by .animate-* classes. */
export const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;
