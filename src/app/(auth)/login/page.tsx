import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace de gestion immobilière Estate Mangement.",
};

export default function LoginPage() {
  return <LoginForm />;
}
