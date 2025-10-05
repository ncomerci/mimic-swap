import { Client } from '@mimicprotocol/sdk'

class ClientSingleton {
  private static instance: Client | null = null

  static getInstance(): Client {
    if (!ClientSingleton.instance) {
      ClientSingleton.instance = new Client({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
      })
    }
    return ClientSingleton.instance
  }

  private constructor() {}
}

export default ClientSingleton.getInstance()
