/**
 * Fausses données pour le mode démo
 *
 * Structure à adapter selon le projet client.
 * Les données ici sont des exemples, tu les remplaceras par les vraies données de ta démo.
 */

// ============================================================================
// TYPES - Définis les types de données de ta démo ici
// ============================================================================

export interface DemoUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
}

// Ajoute tes propres types selon le projet
// export interface DemoProject { ... }
// export interface DemoTask { ... }

// ============================================================================
// DONNÉES MOCKÉES - Remplace par les données de ton client
// ============================================================================

export const demoUsers: DemoUser[] = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Utilisateur Démo',
    role: 'admin',
  },
]

// Utilisateur connecté par défaut en mode démo
export const currentDemoUser: DemoUser = demoUsers[0]

// ============================================================================
// HELPERS - Fonctions utilitaires pour manipuler les données
// ============================================================================

/**
 * Génère un ID unique pour les nouvelles entrées
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Clone et ajoute un élément à une liste (immutable)
 */
export function addToList<T>(list: T[], item: T): T[] {
  return [...list, item]
}

/**
 * Clone et met à jour un élément dans une liste (immutable)
 */
export function updateInList<T extends { id: string }>(
  list: T[],
  id: string,
  updates: Partial<T>,
): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...updates } : item))
}

/**
 * Clone et supprime un élément d'une liste (immutable)
 */
export function removeFromList<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((item) => item.id !== id)
}
