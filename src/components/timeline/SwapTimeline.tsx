import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Token } from '../../types/TokenList'
import StepManager from './StepManager'
import ApprovalStep from './steps/ApprovalStep'
import ConfigStep from './steps/ConfigStep'
import IntentStep from './steps/IntentStep'
import TimelineUI from './TimelineUI'
import type { StepContext, StepDefinition, SwapStep, TimelineState } from './types'

interface SwapTimelineProps {
  fromToken: Token
  fromAmount: string
  toToken: Token
  toAmount: string
  slippage: string
  userAddress?: `0x${string}`
  isVisible: boolean
  onLoadingStateChange?: (isLoading: boolean) => void
  resetKey?: number
}

// Define the steps for the swap process
const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 'approval',
    title: 'Check Approval',
    description: 'Verifying spend allowance for input token',
    component: ApprovalStep,
    autoTrigger: true,
  },
  {
    id: 'config',
    title: 'Create Swap Config',
    description: 'Creating swap configuration with Mimic Protocol',
    component: ConfigStep,
    dependencies: ['approval'],
    autoTrigger: true,
  },
  {
    id: 'intent',
    title: 'Waiting for Intent',
    description: 'Monitoring intent execution status',
    component: IntentStep,
    dependencies: ['config'],
    autoTrigger: true,
  },
]

export default function SwapTimeline({
  fromToken,
  fromAmount,
  toToken,
  toAmount,
  slippage,
  userAddress,
  isVisible,
  onLoadingStateChange,
  resetKey = 0,
}: SwapTimelineProps) {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    steps: STEP_DEFINITIONS.map((def) => ({
      id: def.id,
      title: def.title,
      description: def.description,
      status: 'pending' as const,
    })),
    isLoading: false,
    currentStepIndex: 0,
  })

  const [configSig, setConfigSig] = useState<string | undefined>()

  // Use ref to store configSig to prevent context recreation
  const configSigRef = useRef<string | undefined>(configSig)
  configSigRef.current = configSig

  // Create step context
  const stepContext: StepContext = useMemo(
    () => ({
      fromToken: {
        address: fromToken.address,
        chainId: fromToken.chainId,
        decimals: fromToken.decimals,
      },
      fromAmount,
      toToken: {
        address: toToken.address,
        chainId: toToken.chainId,
        decimals: toToken.decimals,
      },
      toAmount,
      slippage,
      userAddress,
      isVisible,
      resetKey,
      get configSig() {
        return configSigRef.current
      },
    }),
    [fromToken, fromAmount, toToken, toAmount, slippage, userAddress, isVisible, resetKey]
  )

  // Handle step status updates
  const handleStepStatusUpdate = useCallback(
    (stepId: string, status: SwapStep['status'], description?: string, error?: string) => {
      setTimelineState((prev) => ({
        ...prev,
        steps: prev.steps.map((step) =>
          step.id === stepId
            ? { ...step, status, description: description || step.description, error }
            : step
        ),
      }))
    },
    []
  )

  // Handle step completion
  const handleStepComplete = useCallback((stepId: string) => {
    const stepIndex = STEP_DEFINITIONS.findIndex((def) => def.id === stepId)
    if (stepIndex !== -1) {
      setTimelineState((prev) => ({
        ...prev,
        currentStepIndex: Math.max(prev.currentStepIndex, stepIndex + 1),
      }))
    }
  }, [])

  // Handle config signature update
  const handleConfigSigUpdate = useCallback((signature: string) => {
    setConfigSig(signature)
  }, [])

  // Use ref to store onLoadingStateChange to prevent callback recreation
  const onLoadingStateChangeRef = useRef(onLoadingStateChange)
  onLoadingStateChangeRef.current = onLoadingStateChange

  // Handle loading state changes
  const handleLoadingChange = useCallback(
    (isLoading: boolean) => {
      setTimelineState((prev) => ({ ...prev, isLoading }))
      onLoadingStateChangeRef.current?.(isLoading)
    },
    [] // No dependencies to prevent recreation
  )

  // Reset timeline when resetKey changes
  useEffect(() => {
    if (resetKey > 0) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setTimelineState({
          steps: STEP_DEFINITIONS.map((def) => ({
            id: def.id,
            title: def.title,
            description: def.description,
            status: 'pending' as const,
          })),
          isLoading: false,
          currentStepIndex: 0,
        })
        setConfigSig(undefined)
      }, 0)
    }
  }, [resetKey])

  if (!isVisible) return null

  return (
    <div>
      <StepManager
        context={stepContext}
        stepDefinitions={STEP_DEFINITIONS}
        timelineState={timelineState}
        onStepStatusChange={handleStepStatusUpdate}
        onLoadingChange={handleLoadingChange}
        onStepComplete={handleStepComplete}
        onConfigSigUpdate={handleConfigSigUpdate}
      />

      <TimelineUI steps={timelineState.steps}>
        {/* Error panels and additional content can be added here */}
      </TimelineUI>
    </div>
  )
}
