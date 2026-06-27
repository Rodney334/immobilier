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
        className="hidden lg:flex lg:w-[50%] xl:w-[55%] flex-col justify-between px-12 py-10 relative overflow-hidden"
        style={{ background: "var(--ink)" }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--ink)" }}>E</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--paper)", letterSpacing: "0.01em" }}>
            Estate Project
          </p>
        </div>

        {/* Hero */}
        <div className="space-y-5">
          <h1
            style={{ fontFamily: "var(--font-display)", color: "var(--paper)", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.01em", fontSize: "clamp(36px, 4.5vw, 52px)" }}
          >
            Vos biens.
            <br />
            Vos locataires.
            <br />
            Vos revenus.
            <br />
            Un seul endroit.
          </h1>
          <p style={{ fontFamily: "var(--font-serif)", color: "rgba(247,243,236,0.55)", fontSize: 15, lineHeight: 1.6, maxWidth: 360 }}>
            Conçu pour les propriétaires sérieux qui suivent chaque franc.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-7 flex-wrap">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(247,243,236,0.45)" }}>
            <Shield size={14} aria-hidden="true" />
            <span>Chiffré &amp; sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(247,243,236,0.45)" }}>
            <Clock size={14} aria-hidden="true" />
            <span>Synchronisation temps réel</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(247,243,236,0.45)" }}>
            <Users size={14} aria-hidden="true" />
            <span>+500 propriétaires</span>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "var(--paper)" }}>
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
