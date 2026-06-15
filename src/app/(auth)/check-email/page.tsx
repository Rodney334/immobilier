import { Suspense } from "react";
import { CheckEmailClient } from "./CheckEmailClient";

export const metadata = { title: "Vérifiez votre email | Estate Management" };

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailClient />
    </Suspense>
  );
}
