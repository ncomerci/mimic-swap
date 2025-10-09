import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { useTokenBalance } from '../hooks/useTokenBalance'
import { useTokenList } from '../hooks/useTokenList'
import { useTokenPriceConversion } from '../hooks/useTokenPrice'
import type { Token } from '../types/TokenList'
import { SwapTimeline } from './timeline'
import TokenInput from './TokenInput'
import TokenSelector from './TokenSelector'

const NULL_TOKEN: Token = {
  chainId: 0,
  address: '',
  name: '',
  symbol: '',
  decimals: 0,
  logoURI: '',
  extensions: {},
}

export default function SwapCard() {
  const { address, isConnected } = useAccount()
  const { findToken, loading } = useTokenList()
  const [fromAmount, setFromAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<'from' | 'to'>('from')
  const [showSwapTimeline, setShowSwapTimeline] = useState(false)
  const [isTimelineLoading, setIsTimelineLoading] = useState(false)
  const [timelineResetKey, setTimelineResetKey] = useState(0)

  const [fromToken, setFromToken] = useState<Token>(NULL_TOKEN)

  const [toToken, setToToken] = useState<Token>(NULL_TOKEN)

  useEffect(() => {
    if (!loading) {
      setFromToken(findToken(10, '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85') || NULL_TOKEN)
      setToToken(findToken(10, '0x4200000000000000000000000000000000000006') || NULL_TOKEN)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Get balance for the from token
  const { balance: fromTokenBalance } = useTokenBalance({
    token: fromToken,
    address,
  })

  // Use Moralis for price conversion
  const { data: priceData, isLoading: isPriceLoading } = useTokenPriceConversion({
    fromToken,
    toToken,
    amount: fromAmount,
    slippage: parseFloat(slippage) / 100,
    chainId: 10, // Optimism
  })

  const handleSwapTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    setShowSwapTimeline(false) // Hide timeline when tokens are swapped
    setTimelineResetKey((prev) => prev + 1) // Reset timeline state

    // Keep the fromAmount as is, the conversion will be recalculated automatically
    // Don't swap the amounts since we want to keep the user's input
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    setShowSwapTimeline(false) // Hide timeline when amount changes
    setTimelineResetKey((prev) => prev + 1) // Reset timeline state
  }

  // Calculate toAmount based on price data
  const calculatedToAmount = (() => {
    if (!fromAmount) return ''
    if (isPriceLoading) return ''
    if (!priceData) return ''
    if (priceData.convertedAmount === '') return ''
    return parseFloat(priceData.convertedAmount).toFixed(6)
  })()

  // Check if there's insufficient balance
  const hasInsufficientBalance =
    address && fromAmount && parseFloat(fromAmount) > parseFloat(fromTokenBalance)

  const handleTokenSelect = (target: 'from' | 'to') => {
    setTokenSelectorTarget(target)
    setShowTokenSelector(true)
  }

  const handleTokenSelected = (token: Token) => {
    if (tokenSelectorTarget === 'from') {
      setFromToken(token)
    } else {
      setToToken(token)
    }
    setShowTokenSelector(false)
    setShowSwapTimeline(false) // Hide timeline when token is changed
    setTimelineResetKey((prev) => prev + 1) // Reset timeline state
  }

  const handleSlippageChange = (value: string) => {
    setSlippage(value)
    setShowSwapTimeline(false) // Hide timeline when slippage changes
    setTimelineResetKey((prev) => prev + 1) // Reset timeline state
  }

  const handleSlippageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlippage(e.target.value)
    setShowSwapTimeline(false) // Hide timeline when slippage changes
    setTimelineResetKey((prev) => prev + 1) // Reset timeline state
  }

  const handleSwap = () => {
    setShowSwapTimeline(true)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-4 border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Swap</h2>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Slippage Tolerance
              </span>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleSlippageChange(value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      slippage === value
                        ? 'bg-pink-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="text"
                  value={slippage}
                  onChange={handleSlippageInputChange}
                  className="w-16 px-2 py-1 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* From Token */}
        <TokenInput
          label="From"
          token={fromToken}
          value={fromAmount}
          onChange={handleFromAmountChange}
          onTokenSelect={() => handleTokenSelect('from')}
        />

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="p-3 bg-white dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-110"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <TokenInput
          label="To"
          token={toToken}
          value={calculatedToAmount}
          onChange={() => {}} // No-op since it's read-only
          onTokenSelect={() => handleTokenSelect('to')}
          readOnly
          placeholder={isPriceLoading ? 'Loading...' : ''}
          showBalanceCheck={false}
        />

        {/* Exchange Rate */}
        {fromAmount && calculatedToAmount && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Slippage tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={
            !isConnected ||
            !fromAmount ||
            !calculatedToAmount ||
            isPriceLoading ||
            !!hasInsufficientBalance ||
            isTimelineLoading
          }
          className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
            isConnected &&
            fromAmount &&
            calculatedToAmount &&
            !isPriceLoading &&
            !hasInsufficientBalance &&
            !isTimelineLoading
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] cursor-pointer'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {!isConnected ? (
            'Connect Wallet'
          ) : isPriceLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading prices...
            </span>
          ) : isTimelineLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : fromAmount && calculatedToAmount ? (
            'Swap'
          ) : (
            'Enter an amount'
          )}
        </button>
      </div>

      {/* Swap Timeline */}
      <SwapTimeline
        fromToken={fromToken}
        fromAmount={fromAmount}
        toToken={toToken}
        toAmount={calculatedToAmount}
        slippage={slippage}
        userAddress={address}
        isVisible={showSwapTimeline}
        onLoadingStateChange={setIsTimelineLoading}
        resetKey={timelineResetKey}
      />

      {/* Token Selector Modal */}
      <TokenSelector
        isOpen={showTokenSelector}
        onClose={() => setShowTokenSelector(false)}
        onSelectToken={handleTokenSelected}
        selectedToken={tokenSelectorTarget === 'from' ? fromToken : toToken}
      />
    </div>
  )
}
