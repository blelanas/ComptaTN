# Qayd · قيد

**La comptabilité tunisienne, enfin simple.** SaaS de comptabilité conforme au
Système Comptable des Entreprises (SCE), en français, pour les entreprises et
les cabinets comptables.

> *Qayd* (قيد) signifie en arabe « l’écriture comptable », l’inscription au registre.

## État actuel

- Landing page, page de connexion (démo), interface de l’application.
- **Plan comptable** complet :
  - référentiel SCE (environ 300 comptes) ;
  - arborescence et recherche ;
  - création, modification et désactivation des comptes ;
  - import CSV avec aperçu, export CSV.
- Recherche rapide `Ctrl+K`.

Les données sont pour l’instant enregistrées dans le navigateur (`localStorage`).
Le backend est la prochaine étape.

- Liste complète des fonctionnalités : [`docs/fonctionnalites.md`](docs/fonctionnalites.md)
- Analyse de la concurrence : [`docs/analyse-concurrence.md`](docs/analyse-concurrence.md)

## Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS 4 (jetons de design dans `src/index.css`)
- React Router 7, lucide-react
- Vitest

## Démarrer

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # tests unitaires
pnpm build      # vérification des types + build de production
```

> Le bloc `pnpm.overrides` de `package.json` épingle des versions de dépendances
> transitives. Il a servi à installer le projet hors ligne et peut être supprimé
> sur une machine connectée (puis `pnpm install`).

## Déploiement (Firebase Hosting)

Le déploiement passe par GitHub Actions. Aucune installation locale n’est nécessaire.

- **Pull request** : l’action construit le site et le publie sur un lien de
  prévisualisation, valable 30 jours, ajouté en commentaire sur la PR
  (`.github/workflows/firebase-hosting-pr.yml`).
- **Fusion dans `main`** : l’action met à jour le site en ligne
  (`.github/workflows/firebase-hosting-main.yml`).

Configuration, une seule fois :

1. Créer un projet Firebase (plan Spark gratuit) et activer **Hosting**.
2. Dans Google Cloud, sous *IAM → Comptes de service*, créer un compte de service
   avec les rôles :
   - *Administrateur Firebase Hosting* ;
   - *Lecteur de clés API* ;
   - *Administrateur Firebase Authentication*.

   Créer ensuite une clé JSON pour ce compte.
3. Dans GitHub, sous *Settings → Secrets and variables → Actions*, créer le secret
   `FIREBASE_SERVICE_ACCOUNT` et y coller tout le contenu du fichier JSON. Ce
   fichier ne doit jamais être commité.

L’identifiant du projet est lu automatiquement dans la clé.

## Structure

```
src/
  pages/                 Landing, connexion, pages de l’app
  layout/                Interface de l’app (menu, barre du haut, palette Ctrl+K)
  components/            Logo, composants d’interface (modal, panneau, badge, toast)
  lib/                   Navigation, société courante
  features/plan-comptable/
    sceReference.ts      Plan de référence SCE
    accounts.ts          Logique pure (arbre, validation, CSV) + tests
    store.tsx            État et persistance
    PlanComptablePage.tsx, AccountDrawer.tsx, ImportDialog.tsx
docs/                    Fonctionnalités et analyse de la concurrence
```

## Règle de simplicité du plan comptable

L’utilisateur ne choisit jamais le « type » d’un compte. La hiérarchie se déduit
des numéros : `4011` est rattaché à `401`, lui-même rattaché à `40`. Un compte qui
a des sous-comptes devient un **compte de regroupement**. Les autres sont
**imputables**.

⚠️ Le plan de référence suit la nomenclature SCE. Il doit être relu par un
expert-comptable avant la mise en production, car certains sous-comptes (TVA,
retenues, organismes sociaux) varient selon les cabinets.
