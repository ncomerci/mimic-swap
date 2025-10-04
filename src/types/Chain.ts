export interface Chain {
  name: string
  chain: string
  icon?: string
  rpc: string[]
  faucets: string[]
  nativeCurrency: NativeCurrency
  infoURL: string
  shortName: string
  chainId: number
  networkId: number
  slip44?: number
  explorers?: Explorer[]
  title?: string
}

export interface NativeCurrency {
  name: string
  symbol: string
  decimals: number
}

export interface Explorer {
  name: string
  url: string
  icon?: string
}
