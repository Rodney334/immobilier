"use client";

import { useState } from "react";
import { User, Mail, Phone, Shield, Camera, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { userService } from "@/lib/services/user.service";
import { authService } from "@/lib/services/auth.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Input } from "@/components/ui/Input";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border-custom rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border-custom">
        <h2 className="text-[15px] font-semibold text-primary">{title}</h2>
        <p className="text-[12px] text-primary/40 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Status banner ────────────────────────────────────────────────────────────

function Banner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] mb-4
      ${type === "success"
        ? "bg-success/8 border border-success/20 text-success"
        : "bg-danger/8 border border-danger/20 text-danger"
      }`}
    >
      {type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
      {message}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsClient() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Profile form
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Password reset
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Photo upload
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const phoneNumber = (form.get("phoneNumber") as string).trim();
    const countryCode = (form.get("countryCode") as string).trim();

    if (!name || !email) {
      setProfileStatus({ type: "error", msg: "Le nom et l'email sont obligatoires." });
      return;
    }

    setProfileLoading(true);
    setProfileStatus(null);
    try {
      const res = await userService.update(user._id, {
        name,
        email,
        phoneNumber: phoneNumber || undefined,
        countryCode: countryCode || undefined,
      });
      setUser(res.data);
      setProfileStatus({ type: "success", msg: "Profil mis à jour avec succès." });
    } catch {
      setProfileStatus({ type: "error", msg: "Impossible de mettre à jour le profil." });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!user) return;
    setPwLoading(true);
    setPwStatus(null);
    try {
      await authService.forgotPassword({ email: user.email });
      setPwStatus({
        type: "success",
        msg: `Un email de réinitialisation a été envoyé à ${user.email}.`,
      });
    } catch {
      setPwStatus({ type: "error", msg: "Impossible d'envoyer l'email de réinitialisation." });
    } finally {
      setPwLoading(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoLoading(true);
    setPhotoStatus(null);
    try {
      const res = await userService.uploadPhoto(file);
      setUser({ ...user, photoUrl: res.data.photoUrl });
      setPhotoStatus({ type: "success", msg: "Photo de profil mise à jour." });
    } catch {
      setPhotoStatus({ type: "error", msg: "Impossible de mettre à jour la photo." });
    } finally {
      setPhotoLoading(false);
    }
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 bg-surface border-b border-border-custom shrink-0">
        <h1 className="font-semibold text-[20px] text-primary">Paramètres</h1>
        <p className="text-[12px] text-primary/40 mt-0.5">Gérez votre profil et vos préférences</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        {/* ── Avatar ── */}
        <Section title="Photo de profil" description="Votre photo apparaît dans l'interface.">
          {photoStatus && <Banner type={photoStatus.type} message={photoStatus.msg} />}
          <div className="flex items-center gap-5">
            <div className="relative">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border-custom"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center">
                  <span className="text-[20px] font-bold text-primary/50">{initials}</span>
                </div>
              )}
              {photoLoading && (
                <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-primary" />
                </div>
              )}
            </div>
            <div>
              <label
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-custom text-[13px] font-medium text-primary cursor-pointer hover:bg-primary/4 hover:border-primary/30 transition-colors"
              >
                <Camera size={14} />
                Changer la photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={photoLoading}
                />
              </label>
              <p className="text-[11px] text-primary/35 mt-1.5">JPG, PNG ou WebP · max 5 Mo</p>
            </div>
          </div>
        </Section>

        {/* ── Profile form ── */}
        <Section title="Informations personnelles" description="Modifiez vos informations de profil.">
          {profileStatus && <Banner type={profileStatus.type} message={profileStatus.msg} />}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              name="name"
              label="Nom complet"
              placeholder="Jean Dupont"
              defaultValue={user.name}
              required
            />
            <Input
              name="email"
              type="email"
              label="Adresse email"
              placeholder="jean@exemple.com"
              defaultValue={user.email}
              required
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                name="countryCode"
                label="Indicatif"
                placeholder="+229"
                defaultValue={user.countryCode}
              />
              <div className="col-span-2">
                <Input
                  name="phoneNumber"
                  type="tel"
                  label="Téléphone"
                  placeholder="01 23 45 67"
                  defaultValue={user.phoneNumber}
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-[#263447] disabled:opacity-60 transition-colors"
              >
                {profileLoading && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        </Section>

        {/* ── Account info ── */}
        <Section title="Informations du compte" description="Données en lecture seule liées à votre compte.">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral border border-border-custom">
              <div className="w-8 h-8 rounded-lg bg-primary/6 flex items-center justify-center">
                <User size={14} className="text-primary/50" />
              </div>
              <div>
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Rôle</p>
                <p className="text-[13px] font-medium text-primary capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral border border-border-custom">
              <div className="w-8 h-8 rounded-lg bg-primary/6 flex items-center justify-center">
                <Mail size={14} className="text-primary/50" />
              </div>
              <div>
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Email vérifié</p>
                <p className={`text-[13px] font-medium ${user.isEmailVerified ? "text-success" : "text-danger"}`}>
                  {user.isEmailVerified ? "Oui" : "Non"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral border border-border-custom">
              <div className="w-8 h-8 rounded-lg bg-primary/6 flex items-center justify-center">
                <Phone size={14} className="text-primary/50" />
              </div>
              <div>
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.06em]">Membre depuis</p>
                <p className="text-[13px] font-medium text-primary">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Password ── */}
        <Section title="Mot de passe" description="Modifiez votre mot de passe via un lien envoyé par email.">
          {pwStatus && <Banner type={pwStatus.type} message={pwStatus.msg} />}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary/6 flex items-center justify-center shrink-0 mt-1">
              <Shield size={16} className="text-primary/50" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-primary/70 leading-relaxed mb-3">
                Pour des raisons de sécurité, la modification du mot de passe se fait
                par lien envoyé à <span className="font-medium text-primary">{user.email}</span>.
              </p>
              <button
                onClick={handlePasswordReset}
                disabled={pwLoading}
                className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border-custom text-[13px] font-medium text-primary hover:bg-primary/4 hover:border-primary/30 disabled:opacity-60 transition-colors"
              >
                {pwLoading && <Loader2 size={13} className="animate-spin" />}
                Envoyer le lien de réinitialisation
              </button>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
