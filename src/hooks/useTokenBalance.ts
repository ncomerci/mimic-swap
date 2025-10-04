import { erc20Abi, formatUnits } from 'viem'
import { useBalance, useReadContract } from 'wagmi'

import type { Token } from '../types/TokenList'

interface UseTokenBalanceProps {
  token: Token
  address?: `0x${string}`
}

export function useTokenBalance({ token, address }: UseTokenBalanceProps) {
  // For native tokens (ETH), use useBalance
  const isNativeToken = token.address === '0x0000000000000000000000000000000000000000'

  const {
    data: nativeBalance,
    isLoading: isNativeLoading,
    error: nativeError,
  } = useBalance({
    address,
    query: {
      enabled: !!address && isNativeToken,
    },
  })

  // For ERC20 tokens, use useReadContract
  const {
    data: tokenBalance,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useReadContract({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !isNativeToken,
    },
  })

  const isLoading = isNativeLoading || isTokenLoading
  const error = nativeError || tokenError

  // Format the balance using wagmi's native formatting
  const formattedBalance = (() => {
    if (isLoading || !address) return '0'

    if (isNativeToken && nativeBalance) {
      return formatUnits(nativeBalance.value, nativeBalance.decimals)
    }

    if (!isNativeToken && tokenBalance) {
      return formatUnits(tokenBalance, token.decimals)
    }

    return '0'
  })()

  return {
    balance: formattedBalance,
    isLoading,
    error,
    rawBalance: isNativeToken ? nativeBalance?.value : tokenBalance,
    // Also return the native balance object for additional formatting options
    nativeBalance,
  }
}
