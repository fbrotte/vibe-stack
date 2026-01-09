import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { DEMO_MODE } from './config'
import { currentDemoUser, type DemoUser } from './data'

// ============================================================================
// TYPES DU CONTEXTE DÉMO
// ============================================================================

interface DemoState {
  // Données globales de la démo (à étendre selon ton projet)
  user: DemoUser | null
  isAuthenticated: boolean

  // Ajoute tes propres états ici
  // projects: DemoProject[]
  // selectedProject: DemoProject | null
}

interface DemoContextValue extends DemoState {
  // Mode démo activé ?
  isDemoMode: boolean

  // Actions pour manipuler l'état de la démo
  login: () => void
  logout: () => void

  // Fonction générique pour mettre à jour l'état
  updateState: <K extends keyof DemoState>(key: K, value: DemoState[K]) => void

  // Reset complet de la démo
  reset: () => void
}

// ============================================================================
// ÉTAT INITIAL
// ============================================================================

const initialState: DemoState = {
  user: null,
  isAuthenticated: false,
}

// ============================================================================
// CONTEXT
// ============================================================================

const DemoContext = createContext<DemoContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface DemoProviderProps {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [state, setState] = useState<DemoState>(initialState)

  const updateState = useCallback(<K extends keyof DemoState>(key: K, value: DemoState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const login = useCallback(() => {
    setState((prev) => ({
      ...prev,
      user: currentDemoUser,
      isAuthenticated: true,
    }))
  }, [])

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
    }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const value: DemoContextValue = {
    ...state,
    isDemoMode: DEMO_MODE,
    login,
    logout,
    updateState,
    reset,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

// ============================================================================
// HOOK D'ACCÈS
// ============================================================================

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext)

  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider')
  }

  return context
}

/**
 * Hook conditionnel - retourne les valeurs démo ou null si pas en mode démo
 * Utile pour les composants qui doivent fonctionner dans les deux modes
 */
export function useDemoIfEnabled(): DemoContextValue | null {
  const context = useContext(DemoContext)
  return context?.isDemoMode ? context : null
}
