export interface TokenList {
  name: string
  logoURI: string
  keywords: string[]
  timestamp: Date
  tokens: Token[]
  version: Version
}

export interface Token {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI: string
  extensions: Record<string, string>
}

export interface Version {
  major: number
  minor: number
  patch: number
}
