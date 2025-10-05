export default function useApiKey(address?: string, cookies: string | null = null) {
  const apiKey = address
    ? (cookies?.match?.(new RegExp(`api_key_${address}=([^;]+)`))?.[1] ?? null)
    : null

  const saveApiKey = (newApiKey: string) => {
    document.cookie = `api_key_${address}=${newApiKey}; path=/; max-age=86400`
  }

  return { apiKey, saveApiKey }
}
