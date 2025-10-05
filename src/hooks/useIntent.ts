import { useQuery } from '@tanstack/react-query'

import sdk from '../lib/protocol'

export function useIntent(hash: string) {
  return useQuery({
    queryKey: ['intent', hash],
    queryFn: () => sdk.intents.getByHash(hash),
    enabled: !!hash,
  })
}
