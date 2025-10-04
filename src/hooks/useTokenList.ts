import { useQuery } from '@tanstack/react-query'

import type { Token, TokenList } from '../types/TokenList'

const fetchTokenList = async (): Promise<TokenList> => {
  const response = await fetch('/optimism.tokenlist.json')
  if (!response.ok) {
    throw new Error('Failed to load token list')
  }
  return response.json()
}

export function useTokenList() {
  const {
    data: tokenList,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['tokenList'],
    queryFn: fetchTokenList,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const getTokensByChain = (chainId: number): Token[] => {
    if (!tokenList) return []
    return tokenList.tokens.filter((token) => token.chainId === chainId)
  }

  const getAllChains = (): number[] => {
    if (!tokenList) return []
    const chains = new Set(tokenList.tokens.map((token) => token.chainId))
    return Array.from(chains).sort()
  }

  const findToken = (chainId: number, address: string): Token | undefined => {
    if (!tokenList) return undefined
    return tokenList.tokens.find(
      (token) => token.chainId === chainId && token.address.toLowerCase() === address.toLowerCase()
    )
  }

  return {
    tokenList,
    loading,
    error: error instanceof Error ? error.message : null,
    getTokensByChain,
    getAllChains,
    findToken,
  }
}
