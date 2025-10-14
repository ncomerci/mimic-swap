import { useQuery } from '@tanstack/react-query'

import type { Token } from '../types/TokenList'

interface TokenPrice {
  tokenName?: string
  tokenSymbol?: string
  tokenLogo?: string
  tokenDecimals?: string
  nativePrice?: {
    value: string
    decimals: number
    name: string
    symbol: string
    address: string
  }
  usdPrice?: number
  usdPriceFormatted?: string
  '24hrPercentChange'?: string
  exchangeAddress?: string
  exchangeName?: string
  verifiedContract?: boolean
}

interface UseTokenPriceProps {
  token: Token
  chainId: number
}

// Moralis API base URL
const MORALIS_API_BASE = 'https://deep-index.moralis.io/api/v2.2'

// Helper function to get Moralis API key
const getMoralisApiKey = () => {
  const apiKey = import.meta.env.VITE_MORALIS_API_KEY

  if (!apiKey) {
    throw new Error('VITE_MORALIS_API_KEY is not defined in environment variables')
  }
  return apiKey
}

export function useTokenPrice({ token, chainId }: UseTokenPriceProps) {
  return useQuery({
    queryKey: ['tokenPrice', token.address, chainId],
    queryFn: async (): Promise<TokenPrice> => {
      const apiKey = getMoralisApiKey()

      const url = `${MORALIS_API_BASE}/erc20/${token.address}/price?chain=0x${chainId.toString(16)}`

      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data
    },
    enabled: !!token.address,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  })
}

export function useTokenPriceConversion({
  fromToken,
  toToken,
  amount,
  slippage = 0,
  chainId,
}: {
  fromToken: Token
  toToken: Token
  amount: string
  slippage?: number
  chainId: number
}) {
  return useQuery({
    queryKey: [
      'tokenPriceConversion',
      fromToken.address,
      toToken.address,
      amount,
      slippage,
      chainId,
    ],
    queryFn: async (): Promise<{ convertedAmount: string }> => {
      if (!amount || parseFloat(amount) <= 0) {
        return { convertedAmount: '' }
      }

      const apiKey = getMoralisApiKey()

      // Get prices for both tokens using parallel requests
      const [fromPriceResponse, toPriceResponse] = await Promise.all([
        fetch(
          `${MORALIS_API_BASE}/erc20/${fromToken.address}/price?chain=0x${chainId.toString(16)}`,
          {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
            },
          }
        ),
        fetch(
          `${MORALIS_API_BASE}/erc20/${toToken.address}/price?chain=0x${chainId.toString(16)}`,
          {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
            },
          }
        ),
      ])

      if (!fromPriceResponse.ok || !toPriceResponse.ok) {
        throw new Error(
          `HTTP error! From token: ${fromPriceResponse.status}, To token: ${toPriceResponse.status}`
        )
      }

      const [fromPrice, toPrice] = await Promise.all([
        fromPriceResponse.json(),
        toPriceResponse.json(),
      ])

      // Calculate conversion rate
      const rate = ((fromPrice.usdPrice || 0) / (toPrice.usdPrice || 1)).toString()

      // Calculate converted amount
      const baseConvertedAmount = parseFloat(amount) * parseFloat(rate)

      // Apply slippage (reduce the output amount by slippage percentage)
      const slippageMultiplier = 1 - slippage
      const convertedAmountWithSlippage = (baseConvertedAmount * slippageMultiplier).toString()

      return {
        convertedAmount: convertedAmountWithSlippage,
      }
    },
    enabled: !!fromToken.address && !!toToken.address && !!amount && parseFloat(amount) > 0,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
    retry: 3,
  })
}
