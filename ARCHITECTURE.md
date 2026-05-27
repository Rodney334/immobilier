Design System : Se référer scrupuleusement au fichier @THEME.md pour les couleurs, typographies, toasts et composants UI.

## 4. Stack Technique & Versions Strictes

Antigravity doit impérativement respecter les règles de codage imposées par ces versions spécifiques :

- **React v19.2+ & React-DOM v19.2+**
  - Utilisation native du React Compiler via le plugin `babel-plugin-react-compiler`. Interdiction d'écrire des `useMemo` ou `useCallback` sauf cas d'extrême nécessité justifié.
  - Utilisation des nouvelles fonctionnalités de React 19 (les Actions via l'attribut `action` des formulaires, les hooks `useActionState` et `useFormStatus` pour la gestion des formulaires).
  - Le hook `use` peut être utilisé pour consommer des promesses ou du contexte directement dans le rendu.

- **Next.js v16.2+ (App Router)**
  - Toutes les routes et hooks doivent respecter les conventions asynchrones de l'App Router moderne (les objets `params` et `searchParams` reçus par les pages/layouts sont des Promesses et doivent être résolus avec `await` ou `use()`).
  - Strict respect des Server Components par défaut.

- **Tailwind CSS v4.0+**
  - **ATTENTION :** Tailwind v4 n'utilise plus de fichier `tailwind.config.js`. Tout se passe via les directives CSS natives dans `src/app/globals.css` en utilisant `@theme` ou `@import "tailwindcss";`.
  - Pas d'anciennes syntaxes de configuration de thèmes dans un fichier JS externe.

- **TypeScript v5.0+ & ESLint v9.0+**
  - Typage strict requis pour toutes les fonctions, les props des composants et les retours d'API.

## 5. Structure du Projet (App Router)

L'architecture doit suivre scrupuleusement la structure recommandée pour Next.js 16:

├── public/
│ ├── fonts/ # Vos fichiers de polices (.woff2, .ttf)
│ └── assets/ # Vos images statiques, logos, svg
├── src/
│ ├── app/
│ │ ├── (auth)/ # Authentification (avec son propre layout)
│ │ │ ├── change-password/
│ │ │ ├── check-email/
│ │ │ ├── forgot-password//success/
│ │ │ ├── login/
│ │ │ ├── password-reset-success/
│ │ │ ├── register/
│ │ │ ├── verification-success/
│ │ │ └── verify-email/
│ │ ├── (dashboard)/ # Espace client / admin (avec son propre layout)
│ │ │ └── name/
│ │ ├── favicon.ico
│ │ ├── globals.css # Styles globaux (Tailwind)
│ │ ├── layout.tsx # Layout racine (HTML, Body, Providers)
│ │ └── page.tsx # Landing page / Page d'accueil publique
│ ├── assets/ # Si vous y stockez des icônes ou fichiers TS de configuration média
│ ├── components/
│ │ ├── ui/ # Composants atomiques génériques (bouton, input)
│ │ └── features/ # Composants métiers (cartes immobilières, filtres)
│ ├── hooks/ # Hooks personnalisés globaux
│ ├── lib/
│ │ ├── api/ # Configuration des clients API (Axios, Fetch instances)
│ │ ├── services/ # Logique métier (ex: CRUD des annonces immobilières)
│ │ ├── stores/ # État global (Zustand)
│ │ └── utils/ # Fonctions utilitaires génériques (formatage de prix, dates)
│ ├── types/ # Fichiers de définitions TypeScript (.ts ou .d.ts)
│ └── proxy.ts # Votre configuration de proxy si nécessaire
