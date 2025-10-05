import { useEffect, useMemo, useRef } from 'react'

import { useCreateConfig } from '../../../hooks/useCreateConfig'
import { generateUtcCron } from '../../../utils'
import type { StepProps } from '../types'

export default function ConfigStep({
  context,
  onStatusChange,
  onLoadingChange,
  onComplete,
  onConfigSigUpdate,
}: StepProps) {
  const { fromToken, fromAmount, toToken, toAmount, slippage, userAddress, isVisible } = context

  // Track if config creation has been completed to prevent re-triggering
  const configCompletedRef = useRef(false)

  // Memoize slippage calculation
  const slippageBps = useMemo(() => Math.round(parseFloat(slippage) * 100), [slippage])

  // Create config mutation
  const {
    mutate: createConfig,
    isPending: isConfigPending,
    isSuccess: isConfigSuccess,
    error: configError,
    reset: resetCreateConfig,
    isManifestLoading,
    manifestError,
  } = useCreateConfig({
    onSuccess: (config) => {
      configCompletedRef.current = true
      if (onConfigSigUpdate) {
        onConfigSigUpdate(config.sig)
      }
    },
    onError: (error) => {
      console.error('Config creation failed:', error)
    },
  })

  // Reset state when timeline resets
  useEffect(() => {
    if (context.resetKey > 0) {
      resetCreateConfig()
      configCompletedRef.current = false
    }
  }, [context.resetKey, resetCreateConfig])

  // Notify parent about loading state changes
  useEffect(() => {
    const isLoading = isVisible && (isConfigPending || isManifestLoading)
    onLoadingChange(isLoading)
  }, [isVisible, isConfigPending, isManifestLoading, onLoadingChange])

  // Auto-trigger config creation when conditions are met
  useEffect(() => {
    if (
      isVisible &&
      userAddress &&
      fromAmount &&
      toAmount &&
      !isManifestLoading &&
      !manifestError &&
      !isConfigPending &&
      !isConfigSuccess &&
      !configError &&
      !configCompletedRef.current
    ) {
      // Generate cron schedule and endDate
      const { cron, targetUtc } = generateUtcCron(60)
      const endDate = targetUtc + 600 * 1000 // 10 minutes after targetUtc

      createConfig({
        inputs: {
          tokenIn: fromToken.address,
          sourceChain: fromToken.chainId,
          amountIn: fromAmount,
          tokenOut: toToken.address,
          destinationChain: toToken.chainId,
          destinationAddress: userAddress,
          slippageBps,
        },
        options: {
          schedule: cron,
          endDate,
        },
      })
    }
  }, [
    isVisible,
    userAddress,
    fromAmount,
    toAmount,
    isManifestLoading,
    manifestError,
    isConfigPending,
    isConfigSuccess,
    configError,
    fromToken.address,
    fromToken.chainId,
    toToken.address,
    toToken.chainId,
    slippageBps,
    createConfig,
  ])

  // Calculate step status and notify parent
  useEffect(() => {
    if (!isVisible) {
      onStatusChange('pending', 'Creating swap configuration with Mimic Protocol')
      return
    }

    if (manifestError) {
      onStatusChange('error', 'Manifest loading failed', 'Failed to load required manifest')
      return
    }

    if (isManifestLoading) {
      onStatusChange('loading', 'Loading manifest...')
      return
    }

    if (configError) {
      onStatusChange('error', 'Config creation failed', 'Failed to create swap configuration')
      return
    }

    if (isConfigPending) {
      onStatusChange('loading', 'Creating swap configuration...')
      return
    }

    if (isConfigSuccess) {
      onStatusChange('completed', 'Swap configuration created successfully')
      onComplete()
      return
    }

    onStatusChange('pending', 'Ready to create swap configuration')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, manifestError, isManifestLoading, configError, isConfigPending, isConfigSuccess])

  // This component doesn't render anything - it's a logic component
  return null
}

// Export retry function for error handling
export { ConfigStep }
