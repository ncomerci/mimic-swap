import { useAccount } from 'wagmi'

import { useTokenBalance } from '../hooks/useTokenBalance'
import { useTokenPrice } from '../hooks/useTokenPrice'
import type { Token } from '../types/TokenList'

interface TokenInputProps {
  label: string
  token: Token
  value: string
  onChange: (value: string) => void
  onTokenSelect: () => void
  readOnly?: boolean
  placeholder?: string
}

export default function TokenInput({
  label,
  token,
  value,
  onChange,
  onTokenSelect,
  readOnly = false,
  placeholder,
}: TokenInputProps) {
  const { address } = useAccount()
  const { balance, isLoading } = useTokenBalance({ token, address })
  const { data: tokenPrice, isLoading: isPriceLoading } = useTokenPrice({ token, chainId: 10 })

  const hasInsufficientBalance = address && value && parseFloat(value) > parseFloat(balance)
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        {address && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Balance: {isLoading ? '...' : balance}
            </span>
            {!isLoading && parseFloat(balance) > 0 && (
              <button
                onClick={() => onChange(balance)}
                className="text-xs px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-md hover:bg-pink-200 dark:hover:bg-pink-900/30 transition-colors"
              >
                Max
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '0.0'}
          readOnly={readOnly}
          className="flex-1 bg-transparent text-3xl font-semibold text-gray-900 dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 min-w-0"
        />

        <button
          onClick={onTokenSelect}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-w-0 flex-shrink-0"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
            {token.logoURI ? (
              <img
                src={token.logoURI}
                alt={token.symbol}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = token.symbol.slice(0, 2).toUpperCase()
                  }
                }}
              />
            ) : (
              token.symbol.slice(0, 2).toUpperCase()
            )}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
            {token.symbol}
          </span>
          <svg
            className="w-4 h-4 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {value && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {isPriceLoading ? (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              Loading price...
            </span>
          ) : tokenPrice?.usdPrice ? (
            `≈ $${(parseFloat(value) * tokenPrice.usdPrice).toFixed(2)}`
          ) : (
            'Price unavailable'
          )}
        </div>
      )}

      {hasInsufficientBalance && (
        <div className="mt-2 text-sm text-red-500 dark:text-red-400">Insufficient balance</div>
      )}
    </div>
  )
}
