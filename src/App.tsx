import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Header from './components/Header'
import SwapCard from './components/SwapCard'
import { ChainProvider } from './contexts/ChainContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChainProvider>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <Header />

          <main className="container mx-auto px-4 py-12">
            <SwapCard />
          </main>

          {/* Background Decorations */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl" />
          </div>
        </div>
      </ChainProvider>
    </QueryClientProvider>
  )
}

export default App
