import { ApiError, type Config, DEFAULT_MIN_VALIDATIONS, TriggerType } from '@mimicprotocol/sdk'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useAccount, useConfig } from 'wagmi'

import sdk from '../lib/protocol'
import { WagmiSigner } from '../lib/signer'
import { generateRandomSemver } from '../utils'
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

interface ExecutionOptions {
  schedule: string
  endDate: number
}

interface Props {
  onSuccess?: (config: Config) => void
  onError?: (error: ApiError) => void
}

interface UseCreateConfigReturn {
  mutate: UseMutationResult<
    unknown,
    ApiError,
    { inputs: TaskInputs; options: ExecutionOptions }
  >['mutate']
  isPending: boolean
  isSuccess: boolean
  error: ApiError | null
  reset: () => void
  isManifestLoading: boolean
  manifestError: Error | null
}

export function useCreateConfig({ onSuccess, onError }: Props = {}): UseCreateConfigReturn {
  const { address } = useAccount()
  const wagmiConfig = useConfig()
  if (!address) {
    throw new Error('Wallet not connected')
  }

  const {
    data: manifest,
    isLoading: isManifestLoading,
    error: manifestError,
  } = useManifest(TASK_CID)

  const mutation = useMutation({
    mutationFn: async ({ inputs, options }: { inputs: TaskInputs; options: ExecutionOptions }) => {
      // Validate manifest is available before proceeding
      if (!manifest) {
        throw new Error('Manifest not loaded yet. Please wait and try again.')
      }

      if (manifestError) {
        throw new Error(`Failed to load manifest: ${manifestError.message}`)
      }

      return await sdk.configs.signAndCreate(
        {
          taskCid: TASK_CID,
          description: 'Swap tokens',
          trigger: {
            type: TriggerType.Cron,
            schedule: options.schedule,
            delta: `5m`,
            endDate: options.endDate,
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
          manifest: manifest,
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

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
    isManifestLoading,
    manifestError,
  }
}
