import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { StepContext, StepDefinition, SwapStep, TimelineState } from './types'

interface StepManagerProps {
  context: StepContext
  stepDefinitions: StepDefinition[]
  timelineState: TimelineState
  onStepStatusChange: (
    stepId: string,
    status: SwapStep['status'],
    description?: string,
    error?: string
  ) => void
  onLoadingChange: (isLoading: boolean) => void
  onStepComplete: (stepId: string) => void
  onConfigSigUpdate?: (signature: string) => void
}

export default function StepManager({
  context,
  stepDefinitions,
  timelineState,
  onStepStatusChange,
  onLoadingChange,
  onStepComplete,
  onConfigSigUpdate,
}: StepManagerProps) {
  // Use ref to store onLoadingChange to prevent callback recreation
  const onLoadingChangeRef = useRef(onLoadingChange)

  // Update the ref when onLoadingChange changes
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange
  }, [onLoadingChange])

  // Create step props for each step component
  const createStepProps = useCallback(
    (stepId: string) => ({
      context,
      onStatusChange: (status: SwapStep['status'], description?: string, error?: string) => {
        onStepStatusChange(stepId, status, description, error)
      },
      onLoadingChange: (isLoading: boolean) => {
        onLoadingChangeRef.current(isLoading)
      },
      onComplete: () => {
        onStepComplete(stepId)
      },
      onError: (error: string) => {
        onStepStatusChange(stepId, 'error', undefined, error)
      },
      onConfigSigUpdate: onConfigSigUpdate,
    }),
    [context, onStepStatusChange, onStepComplete, onConfigSigUpdate]
  )

  // Check if a step's dependencies are satisfied
  const areDependenciesSatisfied = useCallback(
    (dependencies?: string[]): boolean => {
      if (!dependencies || dependencies.length === 0) {
        return true // No dependencies, always satisfied
      }

      return dependencies.every((depId) => {
        const depStep = timelineState.steps.find((step) => step.id === depId)
        return depStep?.status === 'completed'
      })
    },
    [timelineState.steps]
  )

  // Render step components
  const stepComponents = useMemo(() => {
    return stepDefinitions
      .map((definition) => {
        const StepComponent = definition.component
        const stepProps = createStepProps(definition.id)

        // Check if dependencies are satisfied
        const dependenciesSatisfied = areDependenciesSatisfied(definition.dependencies)

        // Only render the component if dependencies are satisfied
        if (!dependenciesSatisfied) {
          return null
        }

        return <StepComponent key={definition.id} {...stepProps} />
      })
      .filter(Boolean) // Remove null entries
  }, [stepDefinitions, createStepProps, areDependenciesSatisfied])

  return <>{stepComponents}</>
}
