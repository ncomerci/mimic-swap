import { ApiError, type Config, DEFAULT_MIN_VALIDATIONS, TriggerType } from '@mimicprotocol/sdk'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useAccount, useConfig } from 'wagmi'

import sdk from '../lib/protocol'
import { WagmiSigner } from '../lib/signer'
import { generateRandomSemver, generateUtcCron } from '../utils'
import { useManifest } from './useManifest'

const TASK_CID = 'QmZom6ZKhE3GS1XfUF8MvhHqobrX14WUGSFUNru6vFoPEQ'

interface TaskInputs {
  tokenIn: string
  sourceChain: number
  amountIn: string
  tokenOut: string
  destinationChain: number
  destinationAddress: string
  slippageBps: number
}

interface Props {
  onSuccess?: (config: Config) => void
  onError?: (error: ApiError) => void
}

export function useCreateConfig({ onSuccess, onError }: Props = {}): UseMutationResult<
  unknown,
  ApiError,
  TaskInputs
> {
  const { address } = useAccount()
  const wagmiConfig = useConfig()
  if (!address) {
    throw new Error('Wallet not connected')
  }

  const { data: manifest } = useManifest(TASK_CID)

  return useMutation({
    mutationFn: async (inputs: TaskInputs) => {
      const { targetUtc, cron } = generateUtcCron()

      return await sdk.configs.signAndCreate(
        {
          taskCid: TASK_CID,
          description: 'Swap tokens',
          trigger: {
            type: TriggerType.Cron,
            schedule: cron,
            delta: `5m`,
            endDate: targetUtc + 90 * 1000,
          },
          input: {
            tokenIn: inputs.tokenIn,
            sourceChain: inputs.sourceChain,
            amountIn: inputs.amountIn,
            tokenOut: inputs.tokenOut,
            destinationChain: inputs.destinationChain,
            destinationAddress: inputs.destinationAddress,
            slippageBps: inputs.slippageBps,
          },
          version: generateRandomSemver(),
          manifest: manifest!,
          signer: address,
          executionFeeLimit: '0',
          minValidations: DEFAULT_MIN_VALIDATIONS,
        },
        new WagmiSigner(address, wagmiConfig)
      )
    },
    onSuccess,
    onError,
  })
}
