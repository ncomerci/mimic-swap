import {
  BigInt,
  environment,
  ERC20Token,
  log,
  SwapBuilder,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

import { inputs } from './types'

export default function main(): void {
  const me = environment.getContext().user

  const tokenIn = ERC20Token.fromAddress(inputs.tokenIn, inputs.sourceChain)
  const tokenAmountIn = TokenAmount.fromStringDecimal(tokenIn, inputs.amountIn)
  const tokenOut = ERC20Token.fromAddress(inputs.tokenOut, inputs.destinationChain)
  const slippageBps = inputs.slippageBps
  const tokenAmountOut = tokenAmountIn.toTokenAmount(tokenOut)
  const minTokenAmountOut = tokenAmountOut
    .times(BigInt.fromU16(10000 - slippageBps))
    .div(BigInt.fromU16(10000))

  log.info('Swapping {} on chain {} for {} on chain {}', [
    tokenAmountIn.toString(),
    inputs.sourceChain.toString(),
    tokenAmountOut.toString(),
    inputs.destinationChain.toString(),
  ])
  log.info('[Sender]: {}', [me])
  log.info('[Destination address]: {}', [inputs.destinationAddress])

  const swap = SwapBuilder.forChains(inputs.sourceChain, inputs.destinationChain)
    .addTokenInFromTokenAmount(tokenAmountIn)
    .addTokenOutFromTokenAmount(minTokenAmountOut, inputs.destinationAddress)
    .build()

  swap.send()
}
