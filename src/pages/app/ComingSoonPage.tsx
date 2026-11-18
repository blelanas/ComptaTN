import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NavItem } from '@/lib/navigation';

export default function ComingSoonPage({ item }: { item: NavItem }) {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="card p-8 md:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <item.icon className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{item.label}</h1>
        <p className="mt-2 text-muted">{item.description}</p>

        {item.upcoming && (
          <>
            <p className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-600">
              <Sparkles className="size-3.5" /> En préparation
            </p>
            <ul className="mt-3 space-y-2.5">
              {item.upcoming.map((u) => (
                <li key={u} className="flex gap-3 text-sm text-ink-soft">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  {u}
                </li>
              ))}
            </ul>
          </>
        )}

        <Link to="/app" className="btn btn-secondary mt-8">
          <ArrowLeft className="size-4" /> Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
