import { useCallback, useEffect, useMemo } from 'react'
import { erc20Abi, maxUint256, parseUnits } from 'viem'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import type { Token } from '../types/TokenList'

export interface SwapStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'loading' | 'completed' | 'error'
  error?: string
}

interface SwapTimelineProps {
  fromToken: Token
  fromAmount: string
  userAddress?: `0x${string}`
  isVisible: boolean
  onLoadingStateChange?: (isLoading: boolean) => void
  resetKey?: number
}

const SPENDER_ADDRESS = '0x609d831c0068844e11ef85a273c7f356212fd6d1' as const

export default function SwapTimeline({
  fromToken,
  fromAmount,
  userAddress,
  isVisible,
  onLoadingStateChange,
  resetKey = 0,
}: SwapTimelineProps) {
  const baseSteps: SwapStep[] = useMemo(
    () => [
      {
        id: 'approval',
        title: 'Check Approval',
        description: 'Verifying spend allowance for input token',
        status: 'pending',
      },
      {
        id: 'swap',
        title: 'Execute Swap',
        description: 'Processing the token swap',
        status: 'pending',
      },
      {
        id: 'confirmation',
        title: 'Confirmation',
        description: 'Transaction confirmed on blockchain',
        status: 'pending',
      },
    ],
    [resetKey] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Check if token needs approval (skip for native ETH)
  const isNativeToken = fromToken.address === '0x0000000000000000000000000000000000000000'
  const needsApproval = !isNativeToken && !!fromAmount && !!userAddress

  // Read current allowance
  const {
    data: allowance,
    isLoading: isAllowanceLoading,
    refetch: refetchAllowance,
  } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress ? [userAddress, SPENDER_ADDRESS] : undefined,
    query: {
      enabled: needsApproval,
    },
  })

  // Write contract for approval
  const {
    writeContract,
    data: approvalHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetWriteContract,
  } = useWriteContract()

  // Wait for approval transaction
  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  // Check if approval is sufficient
  const hasSufficientApproval = (() => {
    if (!needsApproval) return true
    if (!allowance || !fromAmount) return false

    const requiredAmount = parseUnits(fromAmount, fromToken.decimals)
    return allowance >= requiredAmount
  })()

  // Handle approval transaction
  const handleApproval = useCallback(async () => {
    if (!userAddress || !fromAmount) return

    try {
      await writeContract({
        address: fromToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SPENDER_ADDRESS, maxUint256], // Approve max amount for better UX
      })
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }, [userAddress, fromAmount, fromToken.address, writeContract])

  // Refetch allowance when approval is successful
  if (isApprovalSuccess) {
    refetchAllowance()
  }

  // Reset wagmi hooks state when timeline resets
  useEffect(() => {
    if (resetKey > 0) {
      resetWriteContract()
    }
  }, [resetKey, resetWriteContract])

  // Notify parent component about loading state changes
  useEffect(() => {
    const isTimelineLoading =
      isVisible && (isAllowanceLoading || isApprovalPending || isApprovalConfirming)
    onLoadingStateChange?.(isTimelineLoading)
  }, [isVisible, isAllowanceLoading, isApprovalPending, isApprovalConfirming, onLoadingStateChange])

  // Auto-trigger approval when needed
  useEffect(() => {
    if (
      isVisible &&
      !isNativeToken &&
      !hasSufficientApproval &&
      !isAllowanceLoading &&
      !isApprovalPending &&
      !isApprovalConfirming &&
      !isApprovalSuccess &&
      !approvalError &&
      !approvalReceiptError &&
      userAddress &&
      fromAmount
    ) {
      handleApproval()
    }
  }, [
    isVisible,
    isNativeToken,
    hasSufficientApproval,
    isAllowanceLoading,
    isApprovalPending,
    isApprovalConfirming,
    isApprovalSuccess,
    approvalError,
    approvalReceiptError,
    userAddress,
    fromAmount,
    handleApproval,
  ])

  // Calculate approval step status
  const approvalStepStatus = (() => {
    if (!isVisible) return 'pending'
    if (approvalError || approvalReceiptError) return 'error'
    if (isAllowanceLoading || isApprovalPending || isApprovalConfirming) return 'loading'
    if (isNativeToken) return 'completed'
    if (hasSufficientApproval || isApprovalSuccess) return 'completed'
    // Don't show error immediately - show pending to allow approval
    return 'pending'
  })()

  const approvalStepDescription = (() => {
    if (!isVisible) return 'Verifying spend allowance for input token'
    if (approvalError || approvalReceiptError) return 'Approval transaction failed'
    if (isAllowanceLoading) return 'Checking allowance...'
    if (isApprovalPending) return 'Sending approval transaction...'
    if (isApprovalConfirming) return 'Waiting for approval confirmation...'
    if (isNativeToken) return 'Native token - no approval needed'
    if (hasSufficientApproval || isApprovalSuccess) return 'Sufficient allowance found'
    return 'Approval required - sending transaction automatically...'
  })()

  const approvalStepError = (() => {
    if (approvalError) {
      console.error('Approval error:', approvalError.message)
      return 'Transaction was rejected or failed'
    }
    if (approvalReceiptError) {
      console.error('Approval receipt error:', approvalReceiptError.message)
      return 'Transaction confirmation failed'
    }
    return undefined
  })()

  // Calculate current steps based on approval status
  const steps = useMemo(() => {
    return baseSteps.map((step) => {
      if (step.id === 'approval') {
        return {
          ...step,
          status: approvalStepStatus as SwapStep['status'],
          description: approvalStepDescription,
          error: approvalStepError,
        }
      }
      return step
    })
  }, [baseSteps, approvalStepStatus, approvalStepDescription, approvalStepError])

  if (!isVisible) return null

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Swap Progress</h3>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            {/* Step indicator */}
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : step.status === 'loading'
                      ? 'bg-blue-500 text-white'
                      : step.status === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : step.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : step.status === 'error' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</h4>
                {step.status === 'loading' && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">Checking...</span>
                )}
                {step.status === 'completed' && (
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Complete</span>
                )}
                {step.status === 'error' && (
                  <span className="text-xs text-red-600 dark:text-red-400">✗ Error</span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
              {step.error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{step.error}</p>
              )}
            </div>

            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
            )}
          </div>
        ))}
      </div>

      {/* Approval in progress */}
      {(isApprovalPending || isApprovalConfirming) && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {isApprovalPending
                ? 'Sending approval transaction...'
                : 'Waiting for confirmation...'}
            </span>
          </div>
        </div>
      )}

      {/* Approval error */}
      {(approvalError || approvalReceiptError) && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-red-800 dark:text-red-200">
                Approval transaction failed
              </span>
            </div>
            <button
              onClick={handleApproval}
              disabled={isApprovalPending || isApprovalConfirming}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
