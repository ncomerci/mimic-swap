import { type ReactNode, useEffect, useState } from 'react'

import type { Chain } from '../types/Chain'
import { ChainContext } from './ChainContextDefinition'

interface ChainProviderProps {
  children: ReactNode
}

export function ChainProvider({ children }: ChainProviderProps) {
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [chains, setChains] = useState<Chain[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadChains = async () => {
      try {
        const response = await fetch('/chains.json')
        const chainsData: Chain[] = await response.json()
        const opMainnet = chainsData.find((chain) => chain.chainId === 10)
        setChains([opMainnet!])
        setSelectedChain(opMainnet!)
      } catch (error) {
        console.error('Error loading chains:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChains()
  }, [])

  return (
    <ChainContext.Provider
      value={{
        selectedChain,
        setSelectedChain,
        chains,
        isLoading,
      }}
    >
      {children}
    </ChainContext.Provider>
  )
}
