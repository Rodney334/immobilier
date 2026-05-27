# Charte Graphique & Design Tokens - Plateforme Immobilière

## 1. Palette de Couleurs (Tailwind v4)

L'IA doit impérativement utiliser ces jetons de couleur pour toute l'interface :

- **Primary :** `#1E2A38` (Deep Indigo) -> Pour les textes importants, titres, boutons principaux, Sidebar.
- **Secondary :** `#D4A373` (Warm Gold) -> Pour les lignes de tableau sélectionnées, accents de marque, indicateurs.
- **Success :** `#2A9D8F` (Emerald) -> Statuts payés, toasts de validation, succès.
- **Danger :** `#E76F51` (Soft Red) -> Alertes, factures impayées, erreurs, suppression.
- **Neutral :** `#F8F9FB` (Slate-like) -> Arrière-plan de l'application (Body background).
- **Surface :** `#FFFFFF` -> Arrière-plan des cartes (Cards), panneaux, modales, lignes de tableaux.
- **Border :** `#E5E7EB` -> Bordures de séparation par défaut.

## 2. Échelle Typographique (Type Scale)

- **DISPLAY :** `font-bold text-[32px] tracking-[-0.5px]`
- **H1 :** `font-semibold text-[24px] tracking-[-0.3px]`
- **H2 :** `font-semibold text-[20px]`
- **H3 :** `font-semibold text-[16px]`
- **BODY :** `text-[14px] font-normal leading-[1.6]`
- **CAPTION :** `text-[12px] font-normal`
- **LABEL :** `text-[12px] font-medium uppercase tracking-[0.06em]`
- **TABULAR :** `text-[14px] tabular-nums` (Toujours afficher les montants financiers en `tabular-nums` avec la devise **XOF** : ex: `12,345.67 XOF`).

## 3. Système d'Espacement & Dimensions

- **Base :** Grille basée sur des multiples de `4px` (`space-1` = 4px, `space-4` = 16px, etc.).
- **Navigation Sidebar :** Largeur fixe de `240px`, background `#1E2A38`. Gérer les états : default, hover, active.
- **Modal Shell :** Largeur fixe de `480px`, coins arrondis `rounded-[16px]` (16px radius). Structure : Header (fixe) + Body (scrollable) + Footer (fixe).

## 4. Composants UI Spécifiques (À respecter lors de la génération)

### Empty State (Composant de page vide)

Lorsqu'une liste ou un tableau est vide, générer une boîte centrée avec cette structure exacte :

- Un conteneur blanc (`bg-white border border-border rounded-lg p-8 text-center`).
- Une icône grise centrée (`#1E2A38` opacité réduite, ou gris) dans un cercle subtil.
- Un titre H2 : "No properties yet" (ou équivalent selon le contexte).
- Un sous-texte (`text-caption text-gray-500 max-w-sm mx-auto`).
- Un bouton d'action principal (CTA) centré : "Add Property" (`bg-primary text-white`).

### Notification Toast (Toasts d'alerte)

Les toasts doivent être empilables, avoir un fond blanc (`bg-white`), une bordure fine générale, et un **bord gauche coloré plus épais (3px ou 4px)** selon le statut :

- **Success Toast :** Bord gauche `#2A9D8F`, icône de validation verte. Exemple : "Payment received - $2,400 from Unit 4B...".
- **Danger/Error Toast :** Bord gauche `#E76F51`, icône d'avertissement rouge. Exemple : "Payment failed - Unable to process...".
- **Warning Toast :** Bord gauche `#D4A373` (Secondary), icône d'alerte dorée. Exemple : "Lease expiring soon - Unit 7C...".
- Chaque toast possède un bouton de fermeture (croix `X`) en haut à droite.

### Data Table Rows (Lignes de Tableau)

- **Default :** Fond `bg-white` ou transparent, bordure inférieure fine.
- **Hover :** Léger gris ou opacité.
- **Selected :** Fond teinté avec la couleur Secondary (`#D4A373` avec opacité très légère) ou bordure d'accent.

### Navigation Sidebar (Barre latérale - Spécifications Réelles)

- **Position :** Fixe à gauche. Largeur : `240px` (ou `260px` selon intégration flex).
- **Arrière-plan :** Fond uni sombre couleur Primary (`bg-[#1E2A38]`). Sans bordure droite.
- **Header :** Contient le logo "Estate Mangement" en haut, blanc et épuré.
- **Éléments de menu (Items) :**
  - Nom des onglets : Dashboard, Propriétés, Locaux, Contrats, Locataires, Paiements, Rapports, Paramètres.
  - État par défaut : Icône et texte en blanc (`text-white`), font-weight normal, fond transparent.
  - État au Hover : Le texte et l'icône prennent la couleur Neutral clair (`text-[#F8F9FB]`), sans changement de fond radical.
  - État Actif / Sélectionné : Le fond devient blanc pur (`bg-white`) avec des coins arrondis (ex: `rounded-lg` ou `rounded-l-lg` selon la maquette), et le texte ainsi que l'icône passent en Warm Gold couleur Secondary (`text-[#D4A373]`).
- **Footer de la Sidebar :** Informations du profil utilisateur tout en bas, textes en blanc/gris clair, avec le bouton de déconnexion.
