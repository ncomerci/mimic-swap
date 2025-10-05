import { useQuery } from '@tanstack/react-query'

import sdk from '../lib/protocol'

export function useExecution(configSig: string) {
  const { data: rawData, ...rest } = useQuery({
    queryKey: ['execution', configSig],
    queryFn: () => sdk.executions.get({ configSig }),
    enabled: !!configSig,
  })

  return {
    data: rawData?.[0],
    ...rest,
  }
}
