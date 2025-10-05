import { useCallback, useEffect, useRef } from 'react'
import { erc20Abi, maxUint256, parseUnits } from 'viem'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import type { StepProps } from '../types'

const SPENDER_ADDRESS = '0x609d831c0068844e11ef85a273c7f356212fd6d1' as const

export default function ApprovalStep({
  context,
  onStatusChange,
  onLoadingChange,
  onComplete,
}: StepProps) {
  const { fromToken, fromAmount, userAddress, isVisible } = context

  // Track if approval has been completed to prevent re-triggering
  const approvalCompletedRef = useRef(false)

  // Track if we're currently executing to prevent double execution
  const isExecutingRef = useRef(false)

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

  // Store the latest handleApproval function to avoid dependency issues
  const handleApprovalRef = useRef(handleApproval)

  // Update the ref when handleApproval changes
  useEffect(() => {
    handleApprovalRef.current = handleApproval
  }, [handleApproval])

  // Refetch allowance when approval is successful
  if (isApprovalSuccess) {
    refetchAllowance()
  }

  // Reset state when timeline resets
  useEffect(() => {
    if (context.resetKey > 0) {
      resetWriteContract()
      approvalCompletedRef.current = false
      isExecutingRef.current = false
    }
  }, [context.resetKey, resetWriteContract])

  // Notify parent about loading state changes
  useEffect(() => {
    const isLoading = isVisible && (isAllowanceLoading || isApprovalPending || isApprovalConfirming)
    onLoadingChange(isLoading)
  }, [isVisible, isAllowanceLoading, isApprovalPending, isApprovalConfirming, onLoadingChange])

  // Memoize the approval trigger function to prevent unnecessary re-executions
  const triggerApproval = useCallback(() => {
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
      !approvalCompletedRef.current &&
      !isExecutingRef.current &&
      userAddress &&
      fromAmount
    ) {
      // Set executing flag to prevent double execution
      isExecutingRef.current = true

      handleApprovalRef.current()
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
  ])

  // Auto-trigger approval when needed
  useEffect(() => {
    triggerApproval()
  }, [triggerApproval])

  // Calculate step status and notify parent
  useEffect(() => {
    if (!isVisible) {
      onStatusChange('pending', 'Verifying spend allowance for input token')
      return
    }

    if (approvalError || approvalReceiptError) {
      const errorMessage = approvalError
        ? 'Transaction was rejected or failed'
        : 'Transaction confirmation failed'
      onStatusChange('error', 'Approval transaction failed', errorMessage)
      isExecutingRef.current = false
      return
    }

    if (isAllowanceLoading || isApprovalPending || isApprovalConfirming) {
      let description = 'Checking allowance...'
      if (isApprovalPending) description = 'Sending approval transaction...'
      if (isApprovalConfirming) description = 'Waiting for approval confirmation...'

      onStatusChange('loading', description)
      return
    }

    if (isNativeToken) {
      onStatusChange('completed', 'Native token - no approval needed')
      approvalCompletedRef.current = true
      isExecutingRef.current = false
      onComplete()
      return
    }

    if (hasSufficientApproval || isApprovalSuccess) {
      onStatusChange('completed', 'Sufficient allowance found')
      approvalCompletedRef.current = true
      isExecutingRef.current = false
      onComplete()
      return
    }

    onStatusChange('pending', 'Approval required - sending transaction automatically...')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isVisible,
    approvalError,
    approvalReceiptError,
    isAllowanceLoading,
    isApprovalPending,
    isApprovalConfirming,
    isNativeToken,
    hasSufficientApproval,
    isApprovalSuccess,
  ])

  // This component doesn't render anything - it's a logic component
  return null
}

// Export retry function for error handling
export { ApprovalStep }
