const baseUrl = import.meta.env.VITE_API_BASE_URL
const headers = {
  'Content-Type': 'application/json',
}

export async function getNonce(address: string): Promise<string> {
  const res = await fetch(`${baseUrl}/users/nonce`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ address }),
  })

  if (!res.ok) {
    throw new Error(`Error ${res.status}`)
  }

  const { nonce } = await res.json()
  return nonce
}

export async function getApiKey(token: string): Promise<string> {
  const res = await fetch(`${baseUrl}/users/api-key`, {
    method: 'GET',
    headers: {
      ...headers,
      'x-auth-token': token,
    },
  })

  if (!res.ok) {
    throw new Error(`API key fetch failed: ${res.status}`)
  }

  const data = await res.json()
  return data.apiKey
}

export async function authenticate(address: string, signature: string): Promise<string> {
  const res = await fetch(`${baseUrl}/users/authenticate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ address, signature }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(`Error ${res.status}: ${errorData?.message || 'Unknown error'}`)
  }

  const { token } = await res.json()
  return token
}
