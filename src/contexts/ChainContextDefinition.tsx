import { createContext } from 'react'

import type { Chain } from '../types/Chain'

interface ChainContextType {
  selectedChain: Chain | null
  setSelectedChain: (chain: Chain) => void
  chains: Chain[]
  isLoading: boolean
}

export const ChainContext = createContext<ChainContextType | undefined>(undefined)
