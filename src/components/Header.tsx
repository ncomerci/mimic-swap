import { useState } from 'react'

import ChainSelector from './ChainSelector'

export default function Header() {
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = () => {
    setIsConnected(!isConnected)
  }

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Mimic Swap
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ChainSelector />
        <button
          onClick={handleConnect}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            isConnected
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isConnected ? '0x1234...5678' : 'Connect Wallet'}
        </button>
      </div>
    </header>
  )
}
