import type { ReactNode } from 'react';
import { Shield, Clock, Users } from 'lucide-react';

// ─── Layout Auth — deux colonnes ──────────────────────────────────────────────
// Gauche : panneau hero sombre (bg-primary) — masqué sur mobile
// Droite : zone formulaire blanche avec language switcher

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — Hero ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[50%] xl:w-[55%] bg-primary flex-col justify-between px-12 py-10 relative overflow-hidden"
      >
        {/* Logo */}
        <div>
          <p className="text-white text-[20px] font-bold tracking-wide leading-none">
            Estate Management
          </p>
        </div>

        {/* Hero */}
        <div className="space-y-5">
          <h1
            className="text-white font-bold leading-[1.08] tracking-tight"
            style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}
          >
            Your properties.
            <br />
            Your tenants.
            <br />
            Your money.
            <br />
            One place.
          </h1>
          <p className="text-white/45 text-[15px] leading-relaxed max-w-sm">
            Built for serious property owners who track every franc.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-7 flex-wrap">
          <div className="flex items-center gap-2 text-white/50 text-[12px]">
            <Shield size={14} aria-hidden="true" />
            <span>Encrypted &amp; secure</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-[12px]">
            <Clock size={14} aria-hidden="true" />
            <span>Real-time sync</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-[12px]">
            <Users size={14} aria-hidden="true" />
            <span>Used by 500+ landlords</span>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col min-h-screen">
        {/* Language switcher */}
        <div className="flex justify-end px-8 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-3 text-[13px] select-none">
            <button
              type="button"
              className="font-semibold text-primary"
              aria-current="true"
            >
              FR
            </button>
            <span className="text-primary/20" aria-hidden="true">|</span>
            <button
              type="button"
              className="text-primary/40 hover:text-primary transition-colors"
            >
              EN
            </button>
          </div>
        </div>

        {/* Zone formulaire — centrée verticalement */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-[440px]">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}
