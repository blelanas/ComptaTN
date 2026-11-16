# Qayd · قيد

**La comptabilité tunisienne, enfin simple.** SaaS de comptabilité conforme au
Système Comptable des Entreprises (SCE), en français, pour les entreprises et
les cabinets comptables.

> *Qayd* (قيد) signifie en arabe « l’écriture comptable », l’inscription au registre.

## État actuel

- Landing page et interface de l’application.
- **Comptes** (Firebase Authentication) : inscription, connexion, mot de passe
  oublié, confirmation de l’e-mail.
- **Sociétés** :
  - plusieurs sociétés par compte, changement en un clic ;
  - fiche société (raison sociale, matricule fiscal…) ;
  - exercices à dates libres ;
  - invitation de collaborateurs par lien.
- **Plan comptable** complet, enregistré par société :
  - référentiel SCE (environ 300 comptes) ;
  - arborescence et recherche ;
  - création, modification et désactivation des comptes ;
  - import CSV avec aperçu, export CSV.
- Recherche rapide `Ctrl+K`.
- **Mode démo** sans compte : les données restent dans le navigateur.

Les données des comptes sont enregistrées dans **Cloud Firestore** (plan gratuit
Spark). Les règles de sécurité sont dans `firestore.rules` ; le modèle de données
est décrit dans `src/lib/repository.firestore.ts`.

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

### Base de données et connexion (une seule fois)

Dans la console Firebase :

1. **Paramètres du projet → Vos applications → Web (`</>`)** : enregistrer une
   application web nommée « Qayd ». Firebase Hosting fournit ensuite la
   configuration automatiquement (`/__/firebase/init.json`) : aucune clé à copier.
2. **Authentication → Commencer → Adresse e-mail/Mot de passe** : activer.
3. **Firestore Database → Créer une base de données** :
   - mode production ;
   - emplacement en Europe, par exemple `eur3` ou `europe-west1` (définitif).
4. **Firestore Database → Règles** : coller le contenu de `firestore.rules`, puis
   **Publier**. À refaire à chaque modification de ce fichier.

En local, sans accès à Firebase, seule la démo fonctionne. Pour utiliser un vrai
projet en local, définir `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` et
`VITE_FIREBASE_APP_ID` dans un fichier `.env.local`.

## Structure

```
src/
  pages/                 Landing, connexion, pages de l’app
  layout/                Interface de l’app (menu, barre du haut, palette Ctrl+K)
  components/            Logo, composants d’interface (modal, panneau, badge, toast)
  lib/
    firebase.ts          Initialisation Firebase (chargée à la demande)
    session.tsx          Session : connexion, démo, garde des routes
    company.tsx          Sociétés, société et exercice courants
    repository*.ts       Accès aux données : Firestore ou navigateur (démo)
  features/societes/
    model.ts             Logique pure (matricule, exercices, invitations) + tests
    SettingsPage.tsx     Paramètres : société, exercices, utilisateurs
    OnboardingPage.tsx, CompanySwitcher.tsx, NewCompanyForm.tsx…
  features/plan-comptable/
    sceReference.ts      Plan de référence SCE
    accounts.ts          Logique pure (arbre, validation, CSV) + tests
    store.tsx            État et enregistrement en arrière-plan
    PlanComptablePage.tsx, AccountDrawer.tsx, ImportDialog.tsx
firestore.rules          Règles de sécurité Firestore
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
