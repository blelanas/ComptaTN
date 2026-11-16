/** Turns Firebase and network errors into short French messages. */

const MESSAGES: Record<string, string> = {
  // Authentication
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'E-mail ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez le mot de passe.',
  'auth/weak-password': 'Mot de passe trop faible.',
  'auth/missing-password': 'Indiquez votre mot de passe.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/too-many-requests': 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  'auth/network-request-failed': 'Connexion au serveur impossible. Vérifiez votre connexion internet.',
  'auth/operation-not-allowed': 'La connexion par e-mail n’est pas activée dans Firebase (Authentication → Sign-in method).',
  'auth/configuration-not-found': 'Firebase Authentication n’est pas encore activé pour ce projet.',
  'auth/requires-recent-login': 'Reconnectez-vous puis réessayez.',
  // Firestore
  'permission-denied': 'Accès refusé. Vous n’avez pas les droits pour cette action.',
  unavailable: 'Serveur injoignable. Vérifiez votre connexion internet.',
  'deadline-exceeded': 'Le serveur met trop de temps à répondre. Réessayez.',
  'not-found': 'Élément introuvable. Il a peut-être été supprimé.',
  'failed-precondition': 'La base de données n’est pas prête (Firestore est-il créé ?).',
  'resource-exhausted': 'Quota gratuit du jour atteint. Réessayez demain.',
};

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && MESSAGES[code]) return MESSAGES[code];
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message && !message.startsWith('Firebase')) return message;
  }
  return 'Une erreur inattendue est survenue. Réessayez.';
}
