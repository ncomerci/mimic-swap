import { ConnectButton } from '@rainbow-me/rainbowkit'

import ChainSelector from './ChainSelector'

export default function Header() {
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
        <ConnectButton />
      </div>
    </header>
  )
}
