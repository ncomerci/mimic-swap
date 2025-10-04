import { useState } from 'react'

import { useChain } from '../hooks/useChain'
import { useTokenList } from '../hooks/useTokenList'
import type { Token } from '../types/TokenList'

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: Token) => void
  selectedToken?: Token
}

export default function TokenSelector({
  isOpen,
  onClose,
  onSelectToken,
  selectedToken,
}: TokenSelectorProps) {
  const { getTokensByChain, loading, error } = useTokenList()
  const { selectedChain } = useChain()
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const tokens = selectedChain ? getTokensByChain(selectedChain.chainId) : []

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTokenSelect = (token: Token) => {
    onSelectToken(token)
    onClose()
    setSearchQuery('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Token</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-500"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading tokens...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Error loading tokens: {error}</p>
            </div>
          ) : !selectedChain ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Please select a chain first</p>
            </div>
          ) : (
            /* Token Selection */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedChain.name}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={`${token.chainId}-${token.address}`}
                      onClick={() => handleTokenSelect(token)}
                      className={`flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${
                        selectedToken?.address.toLowerCase() === token.address.toLowerCase() &&
                        selectedToken?.chainId === token.chainId
                          ? 'bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                          {token.symbol}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {token.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredTokens.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No tokens found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
