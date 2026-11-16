# Qayd — Liste complète des fonctionnalités

> **Qayd** (قيد) : en arabe, *l’écriture comptable*, l’inscription au registre.
> SaaS de comptabilité tunisienne (SCE), en français, pour entreprises et cabinets.

Chaque fonctionnalité a un identifiant (ex. `PC-03`) pour pouvoir la choisir et
la suivre une par une. Priorité :

- **MVP** : indispensable pour tenir une comptabilité complète.
- **V1** : attendu par le marché tunisien (parité avec la concurrence).
- **V2** : différenciant.

Statut : ✅ fait · 🟡 partiel · ⬜ à faire

---

## 0. Socle et expérience générale

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| UI-01 | Landing page (présentation, fonctionnalités, cabinets, FAQ, appel à l’essai) | MVP | ✅ |
| UI-02 | Interface de l’application : menu latéral à un seul niveau, barre société + exercice | MVP | ✅ |
| UI-03 | Recherche rapide `Ctrl+K` (pages, comptes ; plus tard tiers, pièces, écritures) | V1 | 🟡 |
| UI-04 | Pages « Bientôt » qui décrivent les modules à venir | MVP | ✅ |
| UI-05 | Responsive mobile / tablette | MVP | ✅ |
| UI-06 | Mode sombre | V2 | ⬜ |
| UI-07 | Visites guidées / aide contextuelle | V2 | ⬜ |
| UI-08 | Interface en arabe (RTL), en plus du français | V2 | ⬜ |
| SY-01 | Backend + base de données (API, persistance serveur) | MVP | ⬜ |
| SY-02 | Authentification (e-mail + mot de passe, réinitialisation, 2FA) | MVP | ⬜ |
| SY-03 | Montants en TND à 3 décimales (millimes), arrondis maîtrisés | MVP | ⬜ |

## 1. Sociétés, utilisateurs et abonnements

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| SO-01 | Création de société : raison sociale, matricule fiscal, RNE, activité, adresse, devise | MVP | 🟡 société démo |
| SO-02 | Exercices comptables (ouverture, dates libres, exercice courant) | MVP | 🟡 sélecteur |
| SO-03 | Multi-sociétés et changement de société en un clic | MVP | ⬜ |
| SO-04 | Utilisateurs et invitations par e-mail | MVP | ⬜ |
| SO-05 | Rôles : propriétaire, chef comptable, comptable, assistant, auditeur (lecture seule) | V1 | ⬜ |
| SO-06 | Journal d’audit immuable (qui a fait quoi, quand) | V1 | ⬜ |
| SO-07 | Abonnements (formules, essai gratuit, limites par formule) | V1 | ⬜ |

## 2. Plan comptable

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| PC-01 | Plan de référence SCE installé à la création de la société | MVP | ✅ |
| PC-02 | Arborescence par classe (1 à 7), dépliage, regroupements déduits des numéros | MVP | ✅ |
| PC-03 | Création de compte avec aperçu du rattachement et suggestion du prochain numéro libre | MVP | ✅ |
| PC-04 | Modification du libellé, activation / désactivation | MVP | ✅ |
| PC-05 | Suppression protégée (refusée si sous-comptes ; plus tard si écritures) | MVP | 🟡 |
| PC-06 | Recherche par numéro ou libellé (sans accents), filtre par classe, vue « comptes imputables » | MVP | ✅ |
| PC-07 | Import CSV / Excel avec aperçu (nouveau, modifié, identique, erreur) | MVP | ✅ CSV |
| PC-08 | Export CSV compatible Excel | MVP | ✅ |
| PC-09 | Import d’un fichier `.xlsx` natif et import assisté par IA (colonnes devinées) | V2 | ⬜ |
| PC-10 | Impression / PDF du plan | V1 | ⬜ |
| PC-11 | Longueur de compte paramétrable (ex. 8 chiffres complétés par des zéros) | V1 | ⬜ |
| PC-12 | Comptes auxiliaires de tiers créés automatiquement (401xxxxx, 411xxxxx) | V1 | ⬜ |

## 3. Journaux et saisie

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| JO-01 | Journaux paramétrables (ACH, VTE, BQ, CAI, OD, AN), compte de contrepartie par défaut | MVP | ⬜ |
| SA-01 | Saisie d’une pièce (lignes débit / crédit, contrôle d’équilibre en direct) | MVP | ⬜ |
| SA-02 | Saisie rapide en 3 champs : tiers + montant TTC + taux de TVA → lignes générées (HT, TVA, timbre) | MVP | ⬜ |
| SA-03 | Mode folio (un journal × un mois) entièrement au clavier, autocomplétion des comptes | V1 | ⬜ |
| SA-04 | Brouillard → validation, numérotation chronologique sans trou | MVP | ⬜ |
| SA-05 | Modèles d’écritures et écritures récurrentes (loyers, abonnements) | V1 | ⬜ |
| SA-06 | Pièces jointes sur chaque écriture | V1 | ⬜ |
| SA-07 | Contre-passation et extourne automatique | V1 | ⬜ |
| SA-08 | Liste des écritures avec filtres et recherche | MVP | ⬜ |

## 4. Consultation et révision

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| CO-01 | Journal auxiliaire et journal centralisateur (totaux par journal et par mois) | MVP | ⬜ |
| CO-02 | Grand livre filtrable (compte, période), export | MVP | ⬜ |
| CO-03 | Balance générale et balance auxiliaire (clients, fournisseurs) | MVP | ⬜ |
| CO-04 | Lettrage manuel, partiel et automatique | V1 | ⬜ |
| CO-05 | Échéancier clients / fournisseurs | V1 | ⬜ |
| CO-06 | Contrôles de révision (comptes à solde anormal, écritures déséquilibrées, trésorerie négative) | V2 | ⬜ |

## 5. Ventes et achats

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| FA-01 | Articles et prestations (prix, taux de TVA, compte de produit / charge) | V1 | ⬜ |
| FA-02 | Factures clients numérotées sans trou (FV-2026-0001), devis → facture | V1 | ⬜ |
| FA-03 | Calculs : HT, TVA par taux, droit de timbre, net à payer, FODEC si applicable | V1 | ⬜ |
| FA-04 | Factures fournisseurs et avoirs | V1 | ⬜ |
| FA-05 | Comptabilisation automatique des factures | V1 | ⬜ |
| FA-06 | Relances clients automatiques | V2 | ⬜ |
| FA-07 | Facture électronique **El Fatoora / TTN** (XML TEIF, signature TunTrust, statuts) | V2 | ⬜ |
| FA-08 | Paiement en ligne des factures (Konnect, Flouci, Paymee) | V2 | ⬜ |

## 6. Tiers

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| TI-01 | Fiches clients et fournisseurs (matricule fiscal, adresse, conditions de paiement) | MVP | ⬜ |
| TI-02 | Profil fiscal du tiers (assujetti, exonéré, export, retenue à la source applicable) | V1 | ⬜ |
| TI-03 | Solde et historique par tiers | MVP | ⬜ |

## 7. Trésorerie

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| TR-01 | Comptes bancaires et caisses | MVP | ⬜ |
| TR-02 | Import de relevés CSV avec mémorisation du format par banque (BIAT, STB, BNA, Attijari, UIB…) | V1 | ⬜ |
| TR-03 | Rapprochement bancaire : suggestions par montant, date et référence ; écran en deux colonnes | V1 | ⬜ |
| TR-04 | Frais bancaires et agios comptabilisés en un clic | V1 | ⬜ |
| TR-05 | Prévision de trésorerie | V2 | ⬜ |

## 8. Fiscalité tunisienne

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| FI-01 | Table des taux **datés** : TVA 19 / 13 / 7 %, timbre, RS, TFP, FOPROLOS, avec comptes associés | MVP | ⬜ |
| FI-02 | Déclaration mensuelle préremplie (TVA, RS, TFP, FOPROLOS) à partir des écritures validées | V1 | ⬜ |
| FI-03 | Retenue à la source appliquée au paiement fournisseur + certificat | V1 | ⬜ |
| FI-04 | Certificats de retenue via la plateforme **TEJ** (obligatoire depuis 2026) | V2 | ⬜ |
| FI-05 | Calendrier fiscal et rappels d’échéances | V1 | ⬜ |
| FI-06 | Acomptes provisionnels et impôt sur les sociétés | V2 | ⬜ |

## 9. Immobilisations

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| IM-01 | Registre des immobilisations | V1 | ⬜ |
| IM-02 | Plan d’amortissement linéaire / dégressif, prorata temporis | V1 | ⬜ |
| IM-03 | Écritures de dotation générées en fin d’exercice, cessions | V1 | ⬜ |

## 10. Clôture et états financiers

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| CL-01 | Balance d’ouverture (import ou report à nouveau automatique) | MVP | ⬜ |
| CL-02 | Clôture d’exercice avec verrouillage | V1 | ⬜ |
| EF-01 | Bilan (modèle SCE) | MVP | ⬜ |
| EF-02 | État de résultat | MVP | ⬜ |
| EF-03 | État des flux de trésorerie | V1 | ⬜ |
| EF-04 | Notes aux états financiers | V2 | ⬜ |
| EF-05 | Paramétrage des rubriques (mapping comptes → postes) | V1 | ⬜ |
| EF-06 | Exports PDF / Excel des états | MVP | ⬜ |

## 11. Documents et automatisation

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| DO-01 | Dépôt de pièces (PDF, photo) et rattachement aux écritures | V1 | ⬜ |
| DO-02 | Lecture automatique des factures (OCR / IA) : tiers, HT, TVA, timbre préremplis → « validez au lieu de saisir » | V2 | ⬜ |
| DO-03 | Pièces manquantes à réclamer | V2 | ⬜ |
| DO-04 | Portail client du cabinet (le client dépose ses pièces) | V2 | ⬜ |

## 12. Cabinets comptables

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| CA-01 | Portefeuille du cabinet : indicateurs par société (CA, résultat, trésorerie, brouillons) | V1 | ⬜ |
| CA-02 | Tableau des échéances de tous les clients (TVA, RS, clôtures) en vert / orange / rouge | V2 | ⬜ |
| CA-03 | Import d’un dossier complet depuis un autre logiciel (plan, tiers, écritures, balances) | V1 | ⬜ |
| CA-04 | Export complet du dossier (ZIP) | V1 | ⬜ |

## 13. Tableau de bord

| ID | Fonctionnalité | Priorité | Statut |
|----|----------------|----------|--------|
| TB-01 | Tableau de bord : guide de démarrage, résumé du plan comptable | MVP | ✅ |
| TB-02 | Indicateurs réels : CA, charges, trésorerie, résultat provisoire, créances, dettes | MVP | 🟡 emplacements prêts |
| TB-03 | Graphique d’activité mensuelle | V1 | ⬜ |
| TB-04 | Points d’attention (brouillons à valider, trésorerie négative, déclarations) | V1 | ⬜ |

---

## Ordre de réalisation proposé

1. ✅ **UI-01/02, PC-01→08** : landing, interface, plan comptable *(cette PR)*
2. **SY-01/02, SO-01→04** : backend, authentification, sociétés et exercices
3. **JO-01, SA-01/02/04/08, TI-01** : journaux, saisie, tiers
4. **CO-01→03, CL-01** : journaux, grand livre, balance, balance d’ouverture
5. **FI-01/02, EF-01/02/06** : fiscalité et états financiers
6. Banque, factures, immobilisations, cabinet, puis les différenciants V2 (OCR, El Fatoora, TEJ)
