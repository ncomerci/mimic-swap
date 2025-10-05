import { useQuery } from '@tanstack/react-query'

import sdk from '../lib/protocol'

export function useManifest(cid: string) {
  return useQuery({
    queryKey: ['manifest', cid],
    queryFn: () => sdk.tasks.getManifest(cid),
    enabled: !!cid,
  })
}
