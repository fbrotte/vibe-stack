import { useState, useCallback, useEffect, useRef } from 'react'
import type { DEMO_DELAYS } from './config'
import { simulateDelay } from './config'

/**
 * Hook pour simuler une mutation (création, modification, suppression)
 * Retourne un état loading + une fonction pour exécuter l'action
 */
export function useDemoMutation<TInput, TOutput>(
  handler: (input: TInput) => TOutput | Promise<TOutput>,
  options?: {
    delay?: keyof typeof DEMO_DELAYS
    onSuccess?: (result: TOutput) => void
  },
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TOutput | null>(null)

  const mutate = useCallback(
    async (input: TInput) => {
      setIsLoading(true)
      setError(null)

      try {
        await simulateDelay(options?.delay ?? 'medium')
        const result = await handler(input)
        setData(result)
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [handler, options],
  )

  return {
    mutate,
    isLoading,
    error,
    data,
    reset: () => {
      setData(null)
      setError(null)
    },
  }
}

/**
 * Hook pour simuler une query (chargement de données)
 * Se lance automatiquement au mount
 */
export function useDemoQuery<T>(
  fetcher: () => T | Promise<T>,
  options?: {
    delay?: keyof typeof DEMO_DELAYS
    enabled?: boolean
  },
) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)
  const hasRun = useRef(false)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await simulateDelay(options?.delay ?? 'short')
      const result = await fetcher()
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [fetcher, options?.delay])

  useEffect(() => {
    if (hasRun.current) return
    if (options?.enabled === false) {
      setIsLoading(false)
      return
    }
    hasRun.current = true
    refetch()
  }, [options?.enabled, refetch])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook pour gérer un flow de démonstration étape par étape
 * Parfait pour guider le client à travers un scénario prédéfini
 */
export function useDemoFlow<TStep extends string>(
  steps: TStep[],
  options?: {
    onStepChange?: (step: TStep, index: number) => void
    onComplete?: () => void
  },
) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentStep = steps[currentIndex]

  const next = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      options?.onStepChange?.(steps[nextIndex], nextIndex)
    } else {
      options?.onComplete?.()
    }
  }, [currentIndex, steps, options])

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      options?.onStepChange?.(steps[prevIndex], prevIndex)
    }
  }, [currentIndex, steps, options])

  const goTo = useCallback(
    (step: TStep) => {
      const index = steps.indexOf(step)
      if (index !== -1) {
        setCurrentIndex(index)
        options?.onStepChange?.(step, index)
      }
    },
    [steps, options],
  )

  const reset = useCallback(() => {
    setCurrentIndex(0)
    options?.onStepChange?.(steps[0], 0)
  }, [steps, options])

  return {
    currentStep,
    currentIndex,
    totalSteps: steps.length,
    isFirst: currentIndex === 0,
    isLast: currentIndex === steps.length - 1,
    progress: ((currentIndex + 1) / steps.length) * 100,
    next,
    previous,
    goTo,
    reset,
  }
}

/**
 * Hook pour simuler une action automatique après un délai
 * Utile pour les animations "auto-remplissage" de formulaires
 */
export function useDemoAutoAction(
  action: () => void,
  options?: {
    delay?: number
    enabled?: boolean
  },
) {
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (options?.enabled === false || hasTriggered) return

    const timeout = setTimeout(() => {
      action()
      setHasTriggered(true)
    }, options?.delay ?? 1000)

    return () => clearTimeout(timeout)
  }, [action, options?.delay, options?.enabled, hasTriggered])

  return {
    hasTriggered,
    reset: () => setHasTriggered(false),
  }
}

/**
 * Hook pour simuler une saisie de texte caractère par caractère
 * Effet "machine à écrire" pour les démos
 */
export function useDemoTypewriter(
  text: string,
  options?: {
    speed?: number // ms par caractère
    startDelay?: number
    enabled?: boolean
    onComplete?: () => void
  },
) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (options?.enabled === false) return

    setDisplayedText('')
    setIsComplete(false)

    const startTimeout = setTimeout(() => {
      setIsTyping(true)
      let index = 0

      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
          setIsTyping(false)
          setIsComplete(true)
          options?.onComplete?.()
        }
      }, options?.speed ?? 50)

      return () => clearInterval(interval)
    }, options?.startDelay ?? 0)

    return () => clearTimeout(startTimeout)
  }, [text, options?.speed, options?.startDelay, options?.enabled, options?.onComplete])

  return {
    displayedText,
    isTyping,
    isComplete,
    skip: () => {
      setDisplayedText(text)
      setIsTyping(false)
      setIsComplete(true)
    },
  }
}
