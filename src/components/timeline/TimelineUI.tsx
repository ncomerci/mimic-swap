import React from 'react'

import type { SwapStep } from './types'

interface TimelineUIProps {
  steps: SwapStep[]
  title?: string
  children?: React.ReactNode // For additional content like error panels
}

export default function TimelineUI({ steps, title = 'Swap Progress', children }: TimelineUIProps) {
  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

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

      {/* Additional content like error panels */}
      {children}
    </div>
  )
}
