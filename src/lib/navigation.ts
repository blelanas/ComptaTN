import {
  Calculator,
  FileText,
  Landmark,
  LayoutDashboard,
  Percent,
  PieChart,
  Settings,
  ShoppingBag,
  SquarePen,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** 'ready' = implemented, 'soon' = placeholder page listing what is coming. */
  status: 'ready' | 'soon';
  description: string;
  /** What the module will contain — shown on the "bientôt" page. */
  upcoming?: string[];
}

/** A sidebar entry: a direct link, or a group that unfolds into sub-pages. */
export interface NavEntry {
  label: string;
  icon: LucideIcon;
  /** Direct link (no sub-pages). */
  item?: NavItem;
  /** Sub-pages of a group. */
  items?: NavItem[];
}

type Leaf = Omit<NavItem, 'icon'>;

function link(icon: LucideIcon, leaf: Leaf): NavEntry {
  return { label: leaf.label, icon, item: { ...leaf, icon } };
}

function group(label: string, icon: LucideIcon, leaves: Leaf[]): NavEntry {
  return { label, icon, items: leaves.map((leaf) => ({ ...leaf, icon })) };
}

/**
 * The app menu, organised like the accounting workflow: groups unfold into
 * their pages (Saisies, Comptabilité, Ventes & achats…).
 */
export const NAV: NavEntry[] = [
  link(LayoutDashboard, {
    label: 'Tableau de bord',
    path: '/app',
    status: 'ready',
    description: 'Vue d’ensemble de la société et des tâches à traiter.',
  }),
  group('Saisies', SquarePen, [
    {
      label: 'Saisie des journaux',
      path: '/app/saisie',
      status: 'soon',
      description: 'Saisie au kilomètre, journal par journal et mois par mois.',
      upcoming: [
        'Mode folio au clavier (un journal × un mois)',
        'Saisie rapide en 3 champs : tiers, montant TTC, taux de TVA',
        'Brouillons, validation et numérotation chronologique',
      ],
    },
    {
      label: 'Liste des écritures',
      path: '/app/saisie/ecritures',
      status: 'soon',
      description: 'Toutes les écritures, filtrables et exportables.',
      upcoming: ['Recherche par compte, journal, montant ou libellé', 'Contrôle des écritures déséquilibrées', 'Export Excel'],
    },
  ]),
  group('Comptabilité', Calculator, [
    {
      label: 'Modèles & récurrences',
      path: '/app/comptabilite/modeles',
      status: 'soon',
      description: 'Écritures types et abonnements générés chaque mois.',
      upcoming: ['Modèles d’écritures (loyer, salaires, abonnements)', 'Génération mensuelle automatique'],
    },
    {
      label: 'Journaux',
      path: '/app/comptabilite/journaux',
      status: 'soon',
      description: 'Journaux auxiliaires et centralisateur.',
      upcoming: ['Journaux ACH, VTE, BQ, CAI, OD', 'Journal centralisateur par mois', 'Impression et export'],
    },
    {
      label: 'Plan comptable',
      path: '/app/comptabilite/plan-comptable',
      status: 'ready',
      description: 'Comptes de la société, basés sur le SCE tunisien.',
    },
    {
      label: 'Grand livre',
      path: '/app/comptabilite/grand-livre',
      status: 'soon',
      description: 'Détail des mouvements de chaque compte.',
      upcoming: ['Grand livre filtrable par compte et période', 'Lettrage depuis le grand livre', 'Export Excel et PDF'],
    },
    {
      label: 'Balance',
      path: '/app/comptabilite/balance',
      status: 'soon',
      description: 'Balance générale et auxiliaire.',
      upcoming: ['Balance générale à 4, 6 ou 8 colonnes', 'Balance clients et fournisseurs', 'Comparaison N / N-1'],
    },
    {
      label: 'Balance d’ouverture',
      path: '/app/comptabilite/balance-ouverture',
      status: 'soon',
      description: 'Reprise des soldes au début de l’exercice.',
      upcoming: ['Saisie ou import Excel des soldes d’ouverture', 'Reprise automatique depuis l’exercice précédent'],
    },
    {
      label: 'Immobilisations',
      path: '/app/comptabilite/immobilisations',
      status: 'soon',
      description: 'Registre et plan d’amortissement.',
      upcoming: ['Registre des immobilisations', 'Amortissements linéaires et dégressifs', 'Écritures de dotation générées'],
    },
    {
      label: 'Exercices & clôture',
      path: '/app/comptabilite/cloture',
      status: 'soon',
      description: 'Clôture et report à nouveau.',
      upcoming: ['Contrôles avant clôture', 'Écritures de report à nouveau générées', 'Verrouillage de l’exercice clôturé'],
    },
  ]),
  group('Ventes & achats', ShoppingBag, [
    {
      label: 'Factures clients',
      path: '/app/factures',
      status: 'soon',
      description: 'Devis, factures et avoirs clients.',
      upcoming: [
        'Factures numérotées sans trou (FV-2026-0001)',
        'TVA par taux, droit de timbre, net à payer',
        'Facture électronique El Fatoora (TTN)',
      ],
    },
    {
      label: 'Factures fournisseurs',
      path: '/app/factures/fournisseurs',
      status: 'soon',
      description: 'Factures d’achat et retenues à la source.',
      upcoming: ['Saisie ou lecture automatique des factures', 'Retenue à la source calculée', 'Échéances de paiement'],
    },
  ]),
  group('Tiers', Users, [
    {
      label: 'Clients & fournisseurs',
      path: '/app/tiers',
      status: 'soon',
      description: 'Fiches clients et fournisseurs.',
      upcoming: ['Fiche tiers avec matricule fiscal', 'Compte auxiliaire créé automatiquement (401…, 411…)'],
    },
    {
      label: 'Lettrage & échéances',
      path: '/app/tiers/lettrage',
      status: 'soon',
      description: 'Rapprochement des factures et règlements.',
      upcoming: ['Lettrage automatique', 'Échéancier clients et fournisseurs', 'Relances'],
    },
  ]),
  group('Trésorerie', Landmark, [
    {
      label: 'Banques',
      path: '/app/tresorerie',
      status: 'soon',
      description: 'Relevés et rapprochement bancaire.',
      upcoming: [
        'Import de relevés CSV avec mémorisation du format de chaque banque',
        'Rapprochement automatique par montant, date et référence',
      ],
    },
    {
      label: 'Caisse',
      path: '/app/tresorerie/caisse',
      status: 'soon',
      description: 'Journal de caisse.',
      upcoming: ['Brouillard de caisse', 'Contrôle du solde de caisse'],
    },
  ]),
  link(Percent, {
    label: 'Fiscalité',
    path: '/app/fiscalite',
    status: 'soon',
    description: 'TVA, retenue à la source et déclaration mensuelle.',
    upcoming: [
      'Déclaration mensuelle préremplie (TVA, RS, TFP, FOPROLOS)',
      'Certificats de retenue à la source (TEJ)',
      'Taux datés : TVA 19 / 13 / 7 %, timbre fiscal',
    ],
  }),
  link(PieChart, {
    label: 'États financiers',
    path: '/app/etats-financiers',
    status: 'soon',
    description: 'Bilan, état de résultat, flux de trésorerie.',
    upcoming: ['Bilan et état de résultat (modèle SCE)', 'État des flux de trésorerie', 'Notes aux états financiers'],
  }),
  link(FileText, {
    label: 'Documents',
    path: '/app/documents',
    status: 'soon',
    description: 'Pièces justificatives.',
    upcoming: ['Dépôt de pièces (PDF, photos)', 'Lecture automatique des factures (OCR)', 'Pièces manquantes à réclamer'],
  }),
  link(Settings, {
    label: 'Paramètres',
    path: '/app/parametres',
    status: 'ready',
    description: 'Société, exercices et utilisateurs.',
  }),
];

export const NAV_ITEMS: NavItem[] = NAV.flatMap((entry) => (entry.item ? [entry.item] : (entry.items ?? [])));
