import type {
  Address,
  Signature,
  Signer,
  TypedDataDomain,
  TypedDataTypes,
} from '@mimicprotocol/sdk'
import type { Config } from '@wagmi/core'
import { signMessage, signTypedData } from '@wagmi/core/actions'
import { ethers } from 'ethers'

export class WagmiSigner implements Signer {
  private readonly address: Address
  private readonly config: Config

  constructor(address: Address, config: Config) {
    this.address = address
    this.config = config
  }

  signMessage(message: string): Promise<Signature> {
    return signMessage(this.config, { account: this.address as `0x${string}`, message })
  }

  signTypedData(
    domain: TypedDataDomain,
    types: TypedDataTypes,
    value: Record<string, unknown>
  ): Promise<Signature> {
    return signTypedData(this.config, {
      account: this.address as `0x${string}`,
      domain: {
        chainId: domain.chainId,
        name: domain.name,
        salt: domain.salt as `0x${string}` | undefined,
        verifyingContract: domain.verifyingContract as `0x${string}` | undefined,
        version: domain.version,
      },
      types,
      message: value,
      primaryType: 'Config',
    })
  }

  verifyMessage(message: string, signature: Signature): Address {
    return ethers.verifyMessage(message, signature)
  }

  verifyTypedData(
    domain: TypedDataDomain,
    types: TypedDataTypes,
    value: Record<string, unknown>,
    signature: Signature
  ): Address {
    return ethers.verifyTypedData(domain, types, value, signature)
  }
}
