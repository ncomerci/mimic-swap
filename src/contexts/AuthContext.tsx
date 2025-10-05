import type { ReactNode } from 'react'
import { createContext, useEffect, useRef, useState } from 'react'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'

import { authenticate, getApiKey, getNonce } from '../auth'
import useAccessToken from '../hooks/useAccessToken'
import useApiKey from '../hooks/useApiKey'

interface AuthProviderProps {
  children: ReactNode
}

export interface AuthContextType {
  apiKey: string | null
  accessToken: string | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()

  // Get cookies from document
  const cookies = typeof document !== 'undefined' ? document.cookie : null

  const { apiKey: freshApiKey, saveApiKey } = useApiKey(address, cookies)
  const { accessToken: freshToken, saveAccessToken } = useAccessToken(address, cookies)

  const [apiKey, setApiKey] = useState(freshApiKey)
  const [accessToken, setAccessToken] = useState(freshToken)
  const [prevAddress, setPrevAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isAuthenticatingRef = useRef(false)

  useEffect(() => {
    if (address) {
      setApiKey(freshApiKey)
      setAccessToken(freshToken)
    }
  }, [address, freshApiKey, freshToken])

  useEffect(() => {
    if (!isConnected) {
      setPrevAddress(null)
      return
    }

    const alreadyAuthenticated = !!(freshToken && freshApiKey)
    const shouldAuthenticate =
      isConnected &&
      address &&
      !alreadyAuthenticated &&
      address !== prevAddress &&
      !loading &&
      !isAuthenticatingRef.current

    if (shouldAuthenticate) {
      handleAuthenticate()
      setPrevAddress(address)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, freshToken, freshApiKey])

  async function handleAuthenticate() {
    if (!isConnected || !address || isAuthenticatingRef.current) return

    isAuthenticatingRef.current = true
    setLoading(true)

    try {
      const nonce = await getNonce(address)
      const signature = await signMessageAsync({
        message: `Sign in with nonce: ${nonce}`,
        account: address,
      })
      const accessToken = await authenticate(address, signature)
      const fetchedApiKey = await getApiKey(accessToken)

      setAccessToken(accessToken)
      setApiKey(fetchedApiKey)
      saveAccessToken(accessToken)
      saveApiKey(fetchedApiKey)
    } catch (err) {
      console.error('Auth error:', err)
      disconnect()
    } finally {
      setLoading(false)
      isAuthenticatingRef.current = false
    }
  }

  const isAuthenticated = !!(accessToken && apiKey)

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        accessToken,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
