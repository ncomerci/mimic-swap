export interface SwapStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'loading' | 'completed' | 'error'
  error?: string
}

export interface StepContext {
  fromToken: {
    address: string
    chainId: number
    decimals: number
  }
  fromAmount: string
  toToken: {
    address: string
    chainId: number
    decimals: number
  }
  toAmount: string
  slippage: string
  userAddress?: `0x${string}`
  isVisible: boolean
  resetKey: number
  configSig?: string // Signature of the created config for intent monitoring
}

export interface StepProps {
  context: StepContext
  onStatusChange: (status: SwapStep['status'], description?: string, error?: string) => void
  onLoadingChange: (isLoading: boolean) => void
  onComplete: () => void
  onError: (error: string) => void
  onConfigSigUpdate?: (signature: string) => void
}

export interface StepDefinition {
  id: string
  title: string
  description: string
  component: React.ComponentType<StepProps>
  dependencies?: string[] // IDs of steps that must complete before this one
  autoTrigger?: boolean // Whether this step should auto-trigger when dependencies are met
}

export interface TimelineState {
  steps: SwapStep[]
  isLoading: boolean
  currentStepIndex: number
}
