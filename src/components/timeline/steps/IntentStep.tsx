import type { AxiaIntent, ExecutionResponse } from '@mimicprotocol/sdk'
import { IntentStatus } from '@mimicprotocol/sdk'
import { useCallback, useEffect, useRef } from 'react'

import { useExecution } from '../../../hooks/useExecution'
import { useIntent } from '../../../hooks/useIntent'
import type { StepProps } from '../types'

export default function IntentStep({
  context,
  onStatusChange,
  onLoadingChange,
  onComplete,
  onError,
}: StepProps) {
  const { isVisible } = context
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const intentIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get configSig from context
  const configSig = context.configSig

  // Query execution with the config signature
  const {
    data: execution,
    isLoading: isExecutionLoading,
    error: executionError,
    refetch: refetchExecution,
  } = useExecution(configSig || '') as {
    data: ExecutionResponse | undefined
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }

  // Query intent with the hash from execution outputs
  const intentHash = execution?.outputs?.[0]?.hash
  const {
    data: intent,
    isLoading: isIntentLoading,
    error: intentError,
    refetch: refetchIntent,
  } = useIntent(intentHash || '') as {
    data: AxiaIntent | undefined
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }

  // Clear timeouts and intervals
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (intentIntervalRef.current) {
      clearInterval(intentIntervalRef.current)
      intentIntervalRef.current = null
    }
  }, [])

  // Reset timers when timeline resets
  useEffect(() => {
    if (context.resetKey > 0) {
      clearTimers()
    }
  }, [context.resetKey, clearTimers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  // Notify parent about loading state changes
  useEffect(() => {
    const isLoading = isVisible && (isExecutionLoading || isIntentLoading)
    onLoadingChange(isLoading)
  }, [isVisible, isExecutionLoading, isIntentLoading, onLoadingChange])

  // Setup polling for execution - only when configSig is available and we don't have intentHash yet
  useEffect(() => {
    if (!isVisible || !configSig || intentHash) {
      return
    }

    // Clear any existing timers
    clearTimers()

    // Start 90-second timeout for execution
    timeoutRef.current = setTimeout(() => {
      onStatusChange(
        'error',
        'Execution timeout - no response received',
        'No execution data received within 90 seconds'
      )
      onError('Execution timeout')
    }, 90000) // 90 seconds

    // Poll execution every 2 seconds
    intervalRef.current = setInterval(() => {
      refetchExecution()
    }, 2000)

    return () => {
      clearTimers()
    }
  }, [isVisible, configSig, intentHash, refetchExecution, onStatusChange, onError, clearTimers])

  // Setup polling for intent - only when we have intentHash and intent is not in a final state
  useEffect(() => {
    if (!intentHash) {
      return
    }

    // Check if intent has reached a final state
    const isIntentFinal =
      intent &&
      [
        IntentStatus.succeeded,
        IntentStatus.failed,
        IntentStatus.discarded,
        IntentStatus.expired,
      ].includes(intent.status)

    if (isIntentFinal) {
      return
    }

    // Poll intent every 2 seconds
    intentIntervalRef.current = setInterval(() => {
      refetchIntent()
    }, 2000)

    return () => {
      if (intentIntervalRef.current) {
        clearInterval(intentIntervalRef.current)
        intentIntervalRef.current = null
      }
    }
  }, [intentHash, intent, refetchIntent])

  // Handle status updates based on data changes
  useEffect(() => {
    if (!isVisible || !configSig) {
      onStatusChange('pending', 'Waiting for config signature...')
      return
    }

    // Check execution status
    if (executionError) {
      onStatusChange('error', 'Failed to fetch execution data', executionError.message)
      onError('Execution fetch failed')
      return
    }

    if (isExecutionLoading) {
      onStatusChange('loading', 'Waiting for execution data...')
      return
    }

    if (execution) {
      // Check if execution has output hash
      if (!execution.outputs?.[0]?.hash) {
        onStatusChange(
          'error',
          'Execution completed but no intent hash found',
          'Execution output missing intent hash'
        )
        onError('No intent hash in execution output')
        return
      }

      // Now monitor the intent
      if (intentError) {
        onStatusChange('error', 'Failed to fetch intent data', intentError.message)
        onError('Intent fetch failed')
        return
      }

      if (isIntentLoading) {
        onStatusChange('loading', 'Monitoring intent status...')
        return
      }

      if (intent) {
        // Check intent status
        const status = intent.status
        switch (status) {
          case IntentStatus.succeeded:
            onStatusChange('completed', 'Intent completed successfully')
            onComplete()
            break
          case IntentStatus.failed:
            onStatusChange('error', 'Intent execution failed', 'Intent status: failed')
            onError('Intent execution failed')
            break
          case IntentStatus.created:
          case IntentStatus.enqueued:
          case IntentStatus.submitted:
            onStatusChange('loading', 'Intent is pending execution...')
            break
          case IntentStatus.discarded:
          case IntentStatus.expired:
            onStatusChange('error', 'Intent was discarded or expired', `Intent status: ${status}`)
            onError('Intent was discarded or expired')
            break
          default:
            onStatusChange('loading', `Intent status: ${status}`)
        }
      } else {
        onStatusChange('loading', 'Waiting for intent data...')
      }
    } else {
      onStatusChange('loading', 'Waiting for execution data...')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isVisible,
    configSig,
    execution,
    executionError,
    isExecutionLoading,
    intent,
    intentError,
    isIntentLoading,
  ])

  // This component doesn't render anything - it's a logic component
  return null
}
