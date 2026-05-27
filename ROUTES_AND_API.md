## 6. Spécifications API & Contrats d'Interface

Toutes les requêtes pointent vers l'API externe. L'URL de base est `process.env.NEXT_PUBLIC_API_URL`.
L'authentification utilise un jeton JWT de type Bearer (`Authorization: Bearer <token>`).

### 6.1 Cartographie des Interfaces, Routes Next.js et Endpoints API

L'application est divisée en deux grands espaces (Route Groups) : l'Espace Public / Authentification `(auth)` et l'Espace d'Administration `(dashboard)`.

---

### ESPACE 1 : Authentification & Compte `(auth)`

#### 1. Page de Connexion (Login)

- **Route Next.js :** `src/app/(auth)/login/page.tsx`
- **URL Publique :** `/login`
- **Endpoint API associé :** `POST /api/v1/auth/login`
- **Payload attendu :** `{ "email": "...", "password": "..." }`
- **Réponse :** Retourne le token JWT et les infos de l'utilisateur. Le token doit être stocké de manière sécurisée (Cookie HttpOnly ou géré via NextAuth/Zustand pour les Client Components).

#### 2. Page d'Inscription (Register)

- **Route Next.js :** `src/app/(auth)/register/page.tsx`
- **URL Publique :** `/register`
- **Endpoint API associé :** `POST /api/v1/auth/register`
- **Payload attendu :** `{ "name": "...", "email": "...", "password": "...", "role": "..." }`

#### 3. Mot de passe oublié & Gestion des emails

- **Routes Next.js :** - `/forgot-password` (`src/app/(auth)/forgot-password/page.tsx`) -> Appelle `POST /api/v1/auth/forgot-password`
  - `/forgot-password/success` -> Écran de confirmation.
  - `/change-password` -> Appelle `POST /api/v1/auth/change-password` (Changement à chaud si connecté).
  - `/verify-email` & `/verification-success` -> Processus de validation de compte.

---

### ESPACE 2 : Tableau de Bord `(dashboard)`

_Note pour l'IA : Tous les layouts de cet espace embarquent la Navigation Sidebar fixe de 240px (`bg-primary`)._

#### 1. Vue d'ensemble (Dashboard Home)

- **Route Next.js :** `src/app/(dashboard)/name/page.tsx` (À renommer ou utiliser comme page d'accueil du dashboard `/dashboard`)
- **URL Publique :** `/dashboard`
- **Composants requis :** KPI Cards (Nombre de biens, taux d'occupation, revenus du mois), Graphique des revenus (`Secondary` color), Liste des alertes récentes (ex: baux qui expirent).
- **Endpoints API cumulés (Server-side fetch) :** `GET /api/v1/dashboard/stats` (si disponible) ou agrégat des listes de biens et paiements.

#### 2. Gestion des Biens Immobiliers (Properties)

- **Route Liste :** `src/app/(dashboard)/properties/page.tsx` -> `/dashboard/properties`
  - _Composant UI :_ Data Table ou grille de cartes avec états `default / hover`. Si vide, utiliser le composant `Empty State` défini dans `@THEME.md`.
  - _Endpoint API :_ `GET /api/v1/properties`
- **Route Détail :** `src/app/(dashboard)/properties/[id]/page.tsx` -> `/dashboard/properties/123`
  - _Composant UI :_ Onglets (Détails du bien, liste des unités rattachées).
  - _Endpoint API :_ `GET /api/v1/properties/{id}`
- **Actions (Formulaires / Server Actions React 19) :**
  - Création : `POST /api/v1/properties`
  - Modification : `PUT /api/v1/properties/{id}`
  - Suppression : `DELETE /api/v1/properties/{id}`

#### 3. Gestion des Unités / Lots (Units)

- **Route Liste :** `src/app/(dashboard)/units/page.tsx` -> `/dashboard/units`
  - _Endpoint API :_ `GET /api/v1/units`
- **Actions associés (Filtres par bien) :**
  - Création : `POST /api/v1/units`
  - Détail & Modif : `GET /api/v1/units/{id}` | `PUT /api/v1/units/{id}` | `DELETE /api/v1/units/{id}`

#### 4. Gestion des Locataires (Tenants)

- **Route Liste :** `src/app/(dashboard)/tenants/page.tsx` -> `/dashboard/tenants`
  - _Composant UI :_ Tableau listant les locataires, leur statut, et l'unité occupée.
  - _Endpoint API :_ `GET /api/v1/tenants`
- **Actions :**
  - Création : `POST /api/v1/tenants`
  - Détail / Modif : `GET /api/v1/tenants/{id}` | `PUT /api/v1/tenants/{id}` | `DELETE /api/v1/tenants/{id}`

#### 5. Gestion des Contrats de Bail (Leases)

- **Route Liste :** `src/app/(dashboard)/leases/page.tsx` -> `/dashboard/leases`
  - _Composant UI :_ Tableau de suivi des baux (Date début, date fin, montant loyer). Déclencher un `Warning Toast` (Bord gauche `#D4A373`) si la date de fin est à moins de 30 jours.
  - _Endpoint API :_ `GET /api/v1/leases`
- **Actions :** `POST /api/v1/leases` | `GET /api/v1/leases/{id}` | `PUT /api/v1/leases/{id}` | `DELETE /api/v1/leases/{id}`

#### 6. Gestion des Paiements & Loyers (Payments)

- **Route Liste :** `src/app/(dashboard)/payments/page.tsx` -> `/dashboard/payments`
  - _Composant UI :_ Liste des transactions financières. Affichage obligatoire au format `TABULAR` (`tabular-nums` en devise **XOF**).
  - _Badges de Statut :_ Vert Émeraude (`#2A9D8F`) pour "PAID", Rouge Corail (`#E76F51`) pour "UNPAID/OVERDUE".
  - _Endpoint API :_ `GET /api/v1/payments`
- **Actions :**
  - Enregistrer un paiement : `POST /api/v1/payments`
  - Détail / Modifier : `GET /api/v1/payments/{id}` | `PUT /api/v1/payments/{id}`

#### 7. Profil Utilisateur (User Profile)

- **Route Next.js :** `src/app/(dashboard)/profile/page.tsx` -> `/dashboard/profile`
  - _Composant UI :_ Formulaire de mise à jour des informations de l'agent ou de l'administrateur.
  - _Endpoints API :_ `GET /api/v1/users/profile` (Lecture) et `PUT /api/v1/users/profile` (Mise à jour).
