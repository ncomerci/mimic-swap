import { useState } from 'react'

import { useTokenList } from '../hooks/useTokenList'
import type { Token } from '../types/TokenList'
import TokenInput from './TokenInput'
import TokenSelector from './TokenSelector'

export default function SwapCard() {
  const { findToken } = useTokenList()
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<'from' | 'to'>('from')

  // Default tokens - ETH on Optimism (chainId 10) and USDC on Optimism
  const [fromToken, setFromToken] = useState<Token>(() => {
    const ethToken =
      findToken(10, '0x4200000000000000000000000000000000000006') ||
      findToken(1, '0x0000000000000000000000000000000000000000')
    return (
      ethToken ||
      ({
        chainId: 10,
        address: '0x4200000000000000000000000000000000000006',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        logoURI: 'https://ethereum-optimism.github.io/data/ETH/logo.svg',
        extensions: {},
      } as Token)
    )
  })

  const [toToken, setToToken] = useState<Token>(() => {
    const usdcToken =
      findToken(10, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607') ||
      findToken(1, '0xA0b86a33E6441e88C5F2712C3E9b74Ec6F3f2a7D')
    return (
      usdcToken ||
      ({
        chainId: 10,
        address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        logoURI: 'https://ethereum-optimism.github.io/data/BridgedUSDC/logo.png',
        extensions: {},
      } as Token)
    )
  })

  const handleSwapTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)

    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value) {
      // Simular conversión (1 ETH = 1850 USDC)
      const converted = (parseFloat(value) * 1850.42).toFixed(2)
      setToAmount(converted)
    } else {
      setToAmount('')
    }
  }

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
  }

  const handleSwap = () => {
    alert('Swap functionality would be implemented here!')
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
                    onClick={() => setSlippage(value)}
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
                  onChange={(e) => setSlippage(e.target.value)}
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
          value={toAmount}
          onChange={setToAmount}
          onTokenSelect={() => handleTokenSelect('to')}
          readOnly
        />

        {/* Exchange Rate */}
        {fromAmount && toAmount && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Rate</span>
              <span className="font-medium text-gray-900 dark:text-white">
                1 {fromToken.symbol} = 1,850.42 {toToken.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount}
          className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
            fromAmount && toAmount
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {fromAmount && toAmount ? 'Swap' : 'Enter an amount'}
        </button>
      </div>

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
