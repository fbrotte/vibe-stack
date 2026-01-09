// Configuration
export { DEMO_MODE, DEMO_DELAYS, simulateDelay } from './config'

// Provider et contexte
export { DemoProvider, useDemo, useDemoIfEnabled } from './DemoProvider'

// Hooks utilitaires
export {
  useDemoMutation,
  useDemoQuery,
  useDemoFlow,
  useDemoAutoAction,
  useDemoTypewriter,
} from './hooks'

// Données mockées
export * from './data'
