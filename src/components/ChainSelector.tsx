import { useEffect, useRef, useState } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'

const LOGO_MAP: Record<number, string> = {
  10: '/op-logo.svg',
}

export default function ChainSelector() {
  const chainId = useChainId()
  const { chains, switchChain, isPending } = useSwitchChain()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleChainSelect = (targetChainId: number) => {
    switchChain({ chainId: targetChainId })
    setIsOpen(false)
  }

  const currentChain = chains.find((chain) => chain.id === chainId)

  if (isPending) {
    return (
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        {currentChain && (
          <>
            <div className="w-6 h-6 flex items-center justify-center">
              {LOGO_MAP[currentChain.id] ? (
                <img
                  src={LOGO_MAP[currentChain.id]}
                  alt={currentChain.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {currentChain.name.toUpperCase().slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {currentChain.name}
            </span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Select Network
            </div>
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                  chainId === chain.id
                    ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {LOGO_MAP[chain.id] ? (
                    <img
                      src={LOGO_MAP[chain.id]}
                      alt={chain.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {chain.name.toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{chain.name}</div>
                </div>
                {chainId === chain.id && (
                  <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
