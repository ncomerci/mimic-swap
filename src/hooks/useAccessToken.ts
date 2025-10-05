export default function useAccessToken(address: string | undefined, cookies: string | null = null) {
  const accessToken = address
    ? (cookies?.match?.(new RegExp(`access_token_${address}=([^;]+)`))?.[1] ?? null)
    : null

  const saveAccessToken = (newToken: string) => {
    document.cookie = `access_token_${address}=${newToken}; path=/; max-age=86400`
  }

  return { accessToken, saveAccessToken }
}
