# Raqib · رقيب

**La comptabilité tunisienne, enfin simple.** SaaS de comptabilité conforme au
Système Comptable des Entreprises (SCE), en français, pour les entreprises et
les cabinets comptables.

> *Raqib* (رقيب) signifie en arabe « celui qui veille », le contrôleur. Le
> commissaire aux comptes se dit مراقب الحسابات. Slogan : « Vos comptes, sous bonne garde. »

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
  - référentiel SCE, comptes de mouvement à 8 chiffres ;
  - recherche, filtre par classe, affichage des regroupements ;
  - panneau d’actions : création (prochain numéro proposé), modification,
    fermeture, suppression protégée ;
  - import CSV avec aperçu, export CSV, impression.
- Interface : menu latéral par modules (Saisies, Comptabilité, Ventes & achats…),
  société et exercice dans la barre du haut, recherche rapide `Ctrl+K`.
- Identité visuelle : logo et couleurs dans `docs/brand/` et `src/index.css`.

Il n’y a pas de démo publique. En développement, sans configuration Firebase,
l’application s’ouvre en **mode local** (données dans le navigateur).

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

L’identifiant du projet est lu automatiquement dans la clé. Le site déployé est
`raqib-tn` (`firebase.json`), soit https://raqib-tn.web.app.

### Base de données et connexion (une seule fois)

Dans la console Firebase :

1. **Paramètres du projet → Vos applications → Web (`</>`)** : enregistrer une
   application web nommée « Raqib ». Firebase Hosting fournit ensuite la
   configuration automatiquement (`/__/firebase/init.json`) : aucune clé à copier.
2. **Authentication → Commencer → Adresse e-mail/Mot de passe** : activer.
3. **Firestore Database → Créer une base de données** :
   - mode production ;
   - emplacement en Europe, par exemple `eur3` ou `europe-west1` (définitif).
4. **Firestore Database → Règles** : coller le contenu de `firestore.rules`, puis
   **Publier**. À refaire à chaque modification de ce fichier.

En local, sans accès à Firebase, seul le mode local fonctionne. Pour utiliser un vrai
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

## Numérotation du plan comptable

L’utilisateur ne choisit jamais le « type » d’un compte : il se déduit du numéro.

- **2 ou 3 chiffres** (`40`, `401`) : **compte de regroupement**, il regroupe des
  comptes et ne reçoit pas d’écritures.
- **8 chiffres** (`40100186`) : **compte de mouvement**, on y passe les écritures.

La hiérarchie se déduit des préfixes : `40100186` est rattaché à `401`, lui-même
rattaché à `40`. Les plans enregistrés avec l’ancienne numérotation (`4011`) sont
convertis automatiquement à l’ouverture (`40110000`), et les numéros de 4 à 7
chiffres sont complétés à 8 lors d’un import.

⚠️ Le plan de référence suit la nomenclature SCE. Il doit être relu par un
expert-comptable avant la mise en production, car certains sous-comptes (TVA,
retenues, organismes sociaux) varient selon les cabinets.
