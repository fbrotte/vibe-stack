import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Mode démo vs mode normal
import { DEMO_MODE, DemoProvider } from './demo'
import { trpc, createTrpcClient } from './lib/trpc'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
          return false
        }
        return failureCount < 3
      },
      staleTime: 1000 * 60, // 1 minute
    },
    mutations: {
      retry: false,
    },
  },
})

// En mode démo, on n'a pas besoin du client tRPC
const trpcClient = DEMO_MODE ? null : createTrpcClient()

function AppWrapper() {
  // Mode démo : pas de tRPC, juste le DemoProvider
  if (DEMO_MODE) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DemoProvider>
            <App />
          </DemoProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  // Mode normal : tRPC + providers classiques
  return (
    <trpc.Provider client={trpcClient!} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)
