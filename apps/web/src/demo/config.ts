/**
 * Configuration du mode démo
 * Active les fausses données et les interactions scriptées
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// Délais par défaut pour simuler les interactions réseau
export const DEMO_DELAYS = {
  // Délai court (chargement rapide)
  short: 300,
  // Délai moyen (action utilisateur)
  medium: 800,
  // Délai long (opération lourde)
  long: 1500,
} as const

// Simule un délai réseau
export function simulateDelay(type: keyof typeof DEMO_DELAYS = 'medium'): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DEMO_DELAYS[type]))
}
