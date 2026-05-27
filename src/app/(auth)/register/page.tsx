import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte Estate Mangement et gérez vos biens immobiliers.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
