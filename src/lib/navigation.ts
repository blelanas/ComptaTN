import {
  BookOpen,
  Building2,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  ListTree,
  Percent,
  PieChart,
  ReceiptText,
  Scale,
  Settings,
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

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * The whole app menu. Deliberately flat: one level, short section titles,
 * no accordions — every module is one click away.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: 'Tableau de bord',
        path: '/app',
        icon: LayoutDashboard,
        status: 'ready',
        description: 'Vue d’ensemble de la société et des tâches à traiter.',
      },
      {
        label: 'Saisie',
        path: '/app/saisie',
        icon: SquarePen,
        status: 'soon',
        description: 'Toutes les écritures, au même endroit.',
        upcoming: [
          'Saisie rapide en 3 champs : tiers, montant TTC, taux de TVA',
          'Mode folio au clavier (un journal × un mois)',
          'Brouillons, validation et numérotation chronologique',
          'Modèles et écritures récurrentes',
        ],
      },
    ],
  },
  {
    title: 'Activité',
    items: [
      {
        label: 'Ventes & achats',
        path: '/app/factures',
        icon: ReceiptText,
        status: 'soon',
        description: 'Factures clients et fournisseurs.',
        upcoming: [
          'Factures numérotées sans trou (FV-2026-0001)',
          'TVA par taux, droit de timbre, net à payer',
          'Relances clients automatiques',
          'Facture électronique El Fatoora (TTN)',
        ],
      },
      {
        label: 'Banque & caisse',
        path: '/app/tresorerie',
        icon: Landmark,
        status: 'soon',
        description: 'Relevés, rapprochement et caisse.',
        upcoming: [
          'Import de relevés CSV avec mémorisation du format de chaque banque',
          'Rapprochement automatique par montant, date et référence',
          'Frais bancaires en un clic',
        ],
      },
      {
        label: 'Tiers',
        path: '/app/tiers',
        icon: Users,
        status: 'soon',
        description: 'Clients, fournisseurs, lettrage et échéances.',
        upcoming: ['Fiches clients et fournisseurs', 'Lettrage automatique', 'Échéancier'],
      },
    ],
  },
  {
    title: 'Comptabilité',
    items: [
      {
        label: 'Plan comptable',
        path: '/app/comptabilite/plan-comptable',
        icon: ListTree,
        status: 'ready',
        description: 'Comptes de la société, basés sur le SCE tunisien.',
      },
      {
        label: 'Journaux',
        path: '/app/comptabilite/journaux',
        icon: BookOpen,
        status: 'soon',
        description: 'Journaux auxiliaires et centralisateur.',
        upcoming: ['Journaux ACH, VTE, BQ, CAI, OD', 'Journal centralisateur par mois', 'Impression et export'],
      },
      {
        label: 'Grand livre',
        path: '/app/comptabilite/balance',
        icon: Scale,
        status: 'soon',
        description: 'Grand livre, balance et balance d’ouverture.',
        upcoming: ['Grand livre filtrable', 'Balance générale et auxiliaire', 'Balance d’ouverture', 'Clôture d’exercice'],
      },
      {
        label: 'Immobilisations',
        path: '/app/comptabilite/immobilisations',
        icon: Building2,
        status: 'soon',
        description: 'Registre et plan d’amortissement.',
        upcoming: ['Registre des immobilisations', 'Amortissements linéaires et dégressifs', 'Écritures de dotation générées'],
      },
    ],
  },
  {
    title: 'Déclarations',
    items: [
      {
        label: 'Fiscalité',
        path: '/app/fiscalite',
        icon: Percent,
        status: 'soon',
        description: 'TVA, retenue à la source et déclaration mensuelle.',
        upcoming: [
          'Déclaration mensuelle préremplie (TVA, RS, TFP, FOPROLOS)',
          'Certificats de retenue à la source (TEJ)',
          'Taux datés : TVA 19 / 13 / 7 %, timbre fiscal',
        ],
      },
      {
        label: 'États financiers',
        path: '/app/etats-financiers',
        icon: PieChart,
        status: 'soon',
        description: 'Bilan, état de résultat, flux de trésorerie.',
        upcoming: ['Bilan et état de résultat (modèle SCE)', 'État des flux de trésorerie', 'Notes aux états financiers'],
      },
    ],
  },
  {
    title: 'Organisation',
    items: [
      {
        label: 'Documents',
        path: '/app/documents',
        icon: FolderOpen,
        status: 'soon',
        description: 'Pièces justificatives.',
        upcoming: ['Dépôt de pièces (PDF, photos)', 'Lecture automatique des factures (OCR)', 'Pièces manquantes à réclamer'],
      },
      {
        label: 'Paramètres',
        path: '/app/parametres',
        icon: Settings,
        status: 'soon',
        description: 'Société, utilisateurs, journaux, options.',
        upcoming: ['Sociétés et exercices', 'Utilisateurs et rôles', 'Journaux et options comptables', 'Import de données et journal d’audit'],
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
